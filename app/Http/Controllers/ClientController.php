<?php

namespace App\Http\Controllers;

use App\Enums\BookingStatus;
use App\Http\Resources\BookingResource;
use App\Http\Resources\RequestTypeResource;
use App\Models\Booking;
use App\Models\Car;
use App\Models\RequestType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ClientController extends Controller
{
    public function getRequestTypes()
    {
        $types = RequestType::orderBy('priority', 'desc')->get();
        return response()->json([
            'success' => true,
            'data' => RequestTypeResource::collection($types)
        ]);
    }

    public function getCarById($id)
    {
        $car = Car::find($id);
        if (!$car) {
            return response()->json(['success' => false, 'error' => 'Car not found'], 404);
        }
        // Car resource not needed as Car model fields might match or simple enough, 
        // but for consistency let's return array or create CarResource later if needed.
        // For now, assuming Car model matches or client adapts. 
        // Actually client expects camelCase. Let's return raw for now or map it.
        // Client expects: id, name, model, licensePlate, description, isActive, driverId, color
        
        return response()->json([
            'success' => true,
            'data' => [
                'id' => (string) $car->id,
                'name' => $car->model,
                'model' => $car->model,
                'licensePlate' => $car->license_plate,
                'description' => $car->description,
                'isActive' => $car->status->value === 'ACTIVE',
                'driverId' => (string) $car->default_driver_id,
                'color' => $car->color_hex,
            ]
        ]);
    }

    public function getUserBookings(Request $request)
    {
        // Get user from Telegram header
        $user = $this->resolveUser($request);
        
        if (!$user) {
            return response()->json([
                'success' => true,
                'data' => []
            ]);
        }
        
        $bookings = Booking::with(['user', 'car', 'requestType', 'department', 'position'])
            ->where('user_id', $user->id)
            ->orderBy('id', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => BookingResource::collection($bookings)
        ]);
    }

    public function getCarBookings($carId, Request $request)
    {
        $date = $request->query('date');
        if (!$date) {
            return response()->json(['success' => false, 'error' => 'Date is required'], 400);
        }

        $startOfDay = \Carbon\Carbon::parse($date)->startOfDay();
        $endOfDay = \Carbon\Carbon::parse($date)->endOfDay();

        $bookings = Booking::with(['department', 'position'])
            ->where('car_id', $carId)
            ->whereIn('status', [BookingStatus::APPROVED, BookingStatus::NEW, BookingStatus::IN_PROGRESS])
            ->where(function ($query) use ($startOfDay, $endOfDay) {
                $query->whereBetween('start_time', [$startOfDay, $endOfDay]);
            })
            ->get();

        return response()->json([
            'success' => true,
            'data' => BookingResource::collection($bookings)
        ]);
    }

    public function createBooking(Request $request)
    {
        \Illuminate\Support\Facades\Log::info('Create Booking Request received', $request->all());
        try {
            $validated = $request->validate([
                'requestTypeId' => 'required|exists:request_types,id',
                'departmentId' => 'required|exists:departments,id',
                'positionId' => 'required|exists:positions,id',
                'clientName' => 'required|string',
                'fromLocation' => 'required|string',
                'toLocation' => 'required|string',
                'comment' => 'nullable|string',
                'date' => 'required|date',
                'timeFrom' => 'required',
                'timeTo' => 'required',
                'hasPassengers' => 'boolean',
                'hasLuggage' => 'boolean',
                'waitingMode' => 'required',
                'returnTime' => 'nullable',
            ]);

            $requestType = RequestType::find($validated['requestTypeId']);
            $car = Car::find($requestType->car_id);

            if (!$car) {
                return response()->json(['success' => false, 'error' => 'Car not found'], 404);
            }

            // Get user from Telegram initData or create/find user
            $user = $this->resolveUser($request);
            
            // If no user found, return 401
            if (!$user) {
                return response()->json(['success' => false, 'error' => 'User not authenticated'], 401);
            }

            $dateTimeFrom = \Carbon\Carbon::createFromFormat('Y-m-d H:i', $validated['date'] . ' ' . $validated['timeFrom'], 'Asia/Dushanbe');
            $dateTimeTo = \Carbon\Carbon::createFromFormat('Y-m-d H:i', $validated['date'] . ' ' . $validated['timeTo'], 'Asia/Dushanbe');

            // Enforce minimum 3-hour advance booking for regular employees.
            // Admins may bypass this limit.
            if (!$user->isAdmin() && $dateTimeFrom->lt(now()->addHours(3))) {
                return response()->json([
                    'success' => false,
                    'error' => 'Бронирование возможно не позднее чем за 3 часа до начала поездки',
                ], 422);
            }

            // Robust duplicate check: if the SAME user is trying to book the SAME car at the SAME time
            // we treat it as a success (idempotency) instead of an overlap error.
            $duplicate = Booking::where('user_id', $user->id)
                ->where('car_id', $car->id)
                ->where('start_time', $dateTimeFrom)
                ->where('created_at', '>=', now()->subMinutes(5)) // Check last 5 mins
                ->first();

            if ($duplicate) {
                 return response()->json([
                    'success' => true,
                    'data' => new BookingResource($duplicate),
                    'message' => 'Заявка успешно создана'
                ]);
            }

            // Check for overlapping bookings (excluding any booking by the SAME user for the SAME time, 
            // though the check above handles that, this is for other users).
            $existingBooking = Booking::where('car_id', $car->id)
                ->whereIn('status', [BookingStatus::APPROVED, BookingStatus::NEW, BookingStatus::IN_PROGRESS])
                ->where(function ($query) use ($dateTimeFrom, $dateTimeTo) {
                    $query->where(function ($q) use ($dateTimeFrom, $dateTimeTo) {
                        $q->where('start_time', '>=', $dateTimeFrom)
                          ->where('start_time', '<', $dateTimeTo);
                    })->orWhere(function ($q) use ($dateTimeFrom, $dateTimeTo) {
                        $q->where('end_time', '>', $dateTimeFrom)
                          ->where('end_time', '<=', $dateTimeTo);
                    })->orWhere(function ($q) use ($dateTimeFrom, $dateTimeTo) {
                        $q->where('start_time', '<=', $dateTimeFrom)
                          ->where('end_time', '>=', $dateTimeTo);
                    });
                })
                ->first();

            if ($existingBooking) {
                // If the overlap is actually the SAME user booking the SAME time, 
                // it's a double-submit, so return success instead of error.
                if ($existingBooking->user_id === $user->id && 
                    $existingBooking->start_time->eq($dateTimeFrom)) {
                    return response()->json([
                        'success' => true,
                        'data' => new BookingResource($existingBooking),
                        'message' => 'Заявка успешно создана'
                    ]);
                }

                return response()->json(['success' => false, 'error' => 'Выбранное время уже занято другим пользователем'], 409);
            }    

        // Map waiting mode
        $waitMode = $validated['waitingMode'] === 'DRIVER_RETURNS' 
            ? \App\Enums\WaitMode::RETURN_AT_TIME 
            : \App\Enums\WaitMode::WAIT_ON_SITE;

            $booking = Booking::create([
                'user_id' => $user->id,
                'request_type_id' => $validated['requestTypeId'],
                'department_id' => $validated['departmentId'],
                'position_id' => $validated['positionId'],
                'client_name' => $validated['clientName'],
                'from_location' => $validated['fromLocation'],
                'to_location' => $validated['toLocation'],
                'comment' => $validated['comment'] ?? null,
                'car_id' => $car->id,
                'driver_id' => $car->defaultDriver ? $car->default_driver_id : null,
                'start_time' => $dateTimeFrom,
                'end_time' => $dateTimeTo,
                'has_passengers' => $validated['hasPassengers'] ?? false,
                'has_luggage' => $validated['hasLuggage'] ?? false,
                'wait_mode' => $waitMode,
                'status' => BookingStatus::NEW,
            ]);

            // Notify Driver
            if ($booking->driver_id) {
                $driver = \App\Models\User::find($booking->driver_id);
                if ($driver && $driver->telegram_id) {
                    try {
                        $bot = app(\SergiX44\Nutgram\Nutgram::class);
                        
                        $startLocal = $booking->start_time->timezone('Asia/Dushanbe')->format('d.m.Y H:i');
                        $endLocal = $booking->end_time->timezone('Asia/Dushanbe')->format('H:i');
                        
                        $msg = "🆕 *Новая заявка #{$booking->id}*\n\n";
                        $msg .= "📅 *Время:* {$startLocal} — {$endLocal}\n";
                        $msg .= "🚙 *Автомобиль:* {$car->model}\n";
                        $msg .= "👤 *Клиент:* " . ($user->full_name ?? $user->username ?? 'Неизвестный') . "\n";
                        $msg .= "📌 *Статус:* Ожидает подтверждения";

                        $bot->sendMessage(
                            text: $msg,
                            chat_id: $driver->telegram_id,
                            parse_mode: 'Markdown'
                        );
                    } catch (\Exception $e) {
                        // Log error but don't fail request
                        \Illuminate\Support\Facades\Log::error('Failed to notify driver: ' . $e->getMessage());
                    }
                }
            }

            // Notify Client (Confirmation)
            if ($user->telegram_id) {
                try {
                    $bot = app(\SergiX44\Nutgram\Nutgram::class);
                    
                    $startLocal = $booking->start_time->timezone('Asia/Dushanbe')->format('d.m.Y H:i');
                    $endLocal = $booking->end_time->timezone('Asia/Dushanbe')->format('H:i');
                    
                    $msg = "✅ *Ваша заявка #{$booking->id} принята!*\n\n";
                    $msg .= "📅 *Время:* {$startLocal} — {$endLocal}\n";
                    $msg .= "🚙 *Автомобиль:* {$car->model}\n";
                    $msg .= "⏳ *Статус:* Ожидает подтверждения водителем\n\n";
                    $msg .= "Мы уведомим вас, когда водитель подтвердит поездку.";

                    $bot->sendMessage(
                        text: $msg,
                        chat_id: $user->telegram_id,
                        parse_mode: 'Markdown'
                    );
                } catch (\Exception $e) {
                    // Log error but don't fail booking creation
                    \Illuminate\Support\Facades\Log::error('Failed to notify client: ' . $e->getMessage());
                }
            }

            return response()->json([
                'success' => true,
                'data' => new BookingResource($booking),
                'message' => 'Заявка успешно создана'
            ]);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Booking creation failed: ' . $e->getMessage() . "\n" . $e->getTraceAsString());
            return response()->json([
                'success' => false,
                'error' => 'Debug Error: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function cancelBooking($id)
    {
        $booking = Booking::with(['user'])->find($id);
        if (!$booking) {
            return response()->json(['success' => false, 'error' => 'Booking not found'], 404);
        }

        if ($booking->status === BookingStatus::COMPLETED || $booking->status === BookingStatus::CANCELED) {
            return response()->json(['success' => false, 'error' => 'Cannot cancel this booking'], 400);
        }

        $booking->update(['status' => BookingStatus::CANCELED]);

        return response()->json([
            'success' => true,
            'data' => new BookingResource($booking),
            'message' => 'Заявка отменена'
        ]);
    }

    public function checkAvailability(Request $request)
    {
        $carId = $request->query('carId');
        $from = \Carbon\Carbon::parse($request->query('from'));
        $to = \Carbon\Carbon::parse($request->query('to'));

        // Add 30 min buffer
        $bufferMinutes = 30;
            
        // Get all active bookings for the car
        $activeBookings = Booking::where('car_id', $carId)
            ->whereIn('status', [BookingStatus::APPROVED, BookingStatus::NEW, BookingStatus::IN_PROGRESS])
            ->get();
            
        $conflicts = [];
        
        foreach ($activeBookings as $booking) {
            $bookingFrom = $booking->start_time;
            $bookingTo = $booking->end_time;
            $bookingToWithBuffer = $bookingTo->copy()->addMinutes($bufferMinutes);
            
            if (
                ($from >= $bookingFrom && $from < $bookingToWithBuffer) ||
                ($to > $bookingFrom && $to <= $bookingToWithBuffer) ||
                ($from <= $bookingFrom && $to >= $bookingToWithBuffer)
            ) {
                $conflicts[] = $booking;
            }
        }

        return response()->json([
            'success' => true,
            'data' => [
                'available' => count($conflicts) === 0,
                'conflictingBookings' => count($conflicts) > 0 ? BookingResource::collection(collect($conflicts)) : null
            ]
        ]);
    }


    private function resolveUser(Request $request)
    {
        $telegramId = $request->header('X-Telegram-User-Id');
        if (!$telegramId) {
            return null;
        }

        $firstName = $request->header('X-Telegram-First-Name') ? urldecode($request->header('X-Telegram-First-Name')) : null;
        $lastName = $request->header('X-Telegram-Last-Name') ? urldecode($request->header('X-Telegram-Last-Name')) : null;
        $username = $request->header('X-Telegram-Username');

        $fullName = trim(($firstName ?? '') . ' ' . ($lastName ?? ''));
        if (empty($fullName)) {
            $fullName = $username ? '@' . $username : 'Telegram User ' . $telegramId;
        }

        $user = \App\Models\User::where('telegram_id', $telegramId)->first();
        
        if ($user) {
            // Update info if provided and different
            if ($fullName !== 'Telegram User ' . $telegramId && $user->full_name !== $fullName) {
                 $user->update([
                     'full_name' => $fullName,
                     'username' => $username ?? $user->username,
                 ]);
            }
            return $user;
        }

        return \App\Models\User::create([
            'telegram_id' => $telegramId,
            'full_name' => $fullName,
            'username' => $username,
            'role' => \App\Enums\UserRole::CLIENT,
            'is_active' => true,
        ]);
    }
}
