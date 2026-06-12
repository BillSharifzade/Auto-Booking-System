<?php

namespace App\Http\Controllers\Api;

use App\Enums\BookingStatus;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Car;
use App\Models\Department;
use App\Models\ForceBlock;
use App\Models\Position;
use App\Models\RequestType;
use App\Models\User;
use App\Services\NotificationService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use SergiX44\Nutgram\Nutgram;

class AdminController extends Controller
{
    // =================== BOOKINGS ===================
    
    public function getBookings(Request $request)
    {
        $query = Booking::with(['user', 'car', 'driver', 'requestType', 'department', 'position']);
        
        if ($request->has('date')) {
            $date = $request->input('date');
            $query->whereRaw("DATE(start_time) = ?", [$date]);
        }
        
        $priorityLabels = [
            1 => 'Низкий',
            2 => 'Средний', 
            3 => 'Высокий',
            4 => 'Срочный',
        ];
        
        $bookings = $query->orderBy('id', 'desc')->get()->map(function ($booking) use ($priorityLabels) {
            $priority = $booking->requestType?->priority ?? 2;
            
            return [
                'id' => (string) $booking->id,
                'date' => $booking->start_time->timezone('Asia/Dushanbe')->format('Y-m-d'),
                'startTime' => $booking->start_time->timezone('Asia/Dushanbe')->format('H:i'),
                'endTime' => $booking->end_time->timezone('Asia/Dushanbe')->format('H:i'),
                'client' => $booking->user->full_name ?? $booking->user->username ?? 'Неизвестный',
                'carId' => (string) $booking->car_id,
                'carName' => $booking->car?->model ?? 'Не указан',
                'driverId' => $booking->driver_id ? (string) $booking->driver_id : null,
                'driverName' => $booking->driver?->full_name ?? 'Не назначен',
                'requestTypeName' => $booking->requestType?->title ?? 'Не указан',
                'priority' => $priority,
                'priorityLabel' => $priorityLabels[$priority] ?? 'Средний',
                'status' => strtolower($booking->status->value),
                'clientName' => $booking->client_name,
                'fromLocation' => $booking->from_location,
                'toLocation' => $booking->to_location,
                'comment' => $booking->comment,
                'hasLuggage' => $booking->has_luggage,
                'passengerCount' => $booking->has_passengers ? 1 : 0,
                'isWaitMode' => $booking->wait_mode === \App\Enums\WaitMode::WAIT_ON_SITE,
                'departmentId' => $booking->department_id ? (string) $booking->department_id : null,
                'departmentName' => $booking->department?->short_name ?? null,
                'positionId' => $booking->position_id ? (string) $booking->position_id : null,
                'positionName' => $booking->position?->title ?? null,
            ];
        });
        
        // Return paginated format expected by frontend
        return response()->json([
            'data' => $bookings,
            'total' => count($bookings),
            'page' => 1,
            'limit' => 100,
            'totalPages' => 1,
        ]);
    }

    public function getBooking($id)
    {
        $booking = Booking::with(['user', 'car', 'driver', 'requestType', 'department', 'position'])->findOrFail($id);
        return response()->json($this->formatBooking($booking));
    }

    private function formatBooking($booking)
    {
        $priorityLabels = [1 => 'Низкий', 2 => 'Средний', 3 => 'Высокий', 4 => 'Срочный'];
        $priority = $booking->requestType?->priority ?? 2;
        
        return [
            'id' => (string) $booking->id,
            'date' => $booking->start_time->timezone('Asia/Dushanbe')->format('Y-m-d'),
            'startTime' => $booking->start_time->timezone('Asia/Dushanbe')->format('H:i'),
            'endTime' => $booking->end_time->timezone('Asia/Dushanbe')->format('H:i'),
            'client' => $booking->user->full_name ?? $booking->user->username ?? 'Неизвестный',
            'carId' => (string) $booking->car_id,
            'carName' => $booking->car?->model ?? 'Не указан',
            'driverId' => $booking->driver_id ? (string) $booking->driver_id : null,
            'driverName' => $booking->driver?->full_name ?? 'Не назначен',
            'requestTypeName' => $booking->requestType?->title ?? 'Не указан',
            'priority' => $priority,
            'priorityLabel' => $priorityLabels[$priority] ?? 'Средний',
            'status' => strtolower($booking->status->value),
            'clientName' => $booking->client_name,
            'fromLocation' => $booking->from_location,
            'toLocation' => $booking->to_location,
            'comment' => $booking->comment,
            'hasLuggage' => $booking->has_luggage,
            'passengerCount' => $booking->has_passengers ? 1 : 0,
            'isWaitMode' => $booking->wait_mode === \App\Enums\WaitMode::WAIT_ON_SITE,
            'departmentId' => $booking->department_id ? (string) $booking->department_id : null,
            'departmentName' => $booking->department?->short_name ?? null,
            'positionId' => $booking->position_id ? (string) $booking->position_id : null,
            'positionName' => $booking->position?->title ?? null,
        ];
    }
    
    public function store(Request $request, \SergiX44\Nutgram\Nutgram $bot)
    {
        $validated = $request->validate([
            'userId' => 'nullable|exists:users,id',
            'clientName' => 'nullable|string|max:255',
            'carId' => 'required|exists:cars,id',
            'driverId' => 'nullable|exists:users,id',
            'departmentId' => 'nullable|exists:departments,id',
            'positionId' => 'nullable|exists:positions,id',
            'requestTypeId' => 'required|exists:request_types,id',
            'date' => 'required|date',
            'timeFrom' => 'required',
            'timeTo' => 'required',
            'hasPassengers' => 'boolean',
            'hasLuggage' => 'boolean',
            'waitingMode' => 'required',
            'fromLocation' => 'nullable|string|max:255',
            'toLocation' => 'nullable|string|max:255',
            'comment' => 'nullable|string',
        ]);

        $userId = $validated['userId'] ?? null;
        if (!$userId && !empty($validated['clientName'])) {
            // Create a new user for the client
            $user = User::create([
                'full_name' => $validated['clientName'],
                'username' => 'client_' . uniqid(),
                'role' => 'CLIENT',
                'is_active' => true,
            ]);
            $userId = $user->id;
        }

        if (!$userId) {
            return response()->json(['error' => 'User ID or Client Name is required'], 422);
        }

        $dateTimeFrom = \Carbon\Carbon::parse($validated['date'] . ' ' . $validated['timeFrom']);
        $dateTimeTo = \Carbon\Carbon::parse($validated['date'] . ' ' . $validated['timeTo']);

        $booking = Booking::create([
            'user_id' => $userId,
            'car_id' => $validated['carId'],
            'driver_id' => $validated['driverId'],
            'department_id' => $validated['departmentId'] ?? null,
            'position_id' => $validated['positionId'] ?? null,
            'request_type_id' => $validated['requestTypeId'],
            'start_time' => $dateTimeFrom,
            'end_time' => $dateTimeTo,
            'has_passengers' => $validated['hasPassengers'] ?? false,
            'has_luggage' => $validated['hasLuggage'] ?? false,
            'wait_mode' => $validated['waitingMode'],
            'status' => BookingStatus::APPROVED,
            'client_name' => $validated['clientName'] ?? null,
            'from_location' => $validated['fromLocation'] ?? null,
            'to_location' => $validated['toLocation'] ?? null,
            'comment' => $validated['comment'] ?? null,
            'source' => 'ADMIN_PANEL',
        ]);

        // Notify driver about new booking assignment
        $booking = $booking->fresh(['user', 'car', 'driver', 'requestType', 'department', 'position']);
        if ($booking->driver_id) {
            $notificationService = app(NotificationService::class);
            $notificationService->notifyDriverNewBooking($booking, $bot);
        }

        return response()->json($this->formatBooking($booking));
    }

    public function update(Request $request, $id, \SergiX44\Nutgram\Nutgram $bot)
    {
        $booking = Booking::findOrFail($id);
        $oldDriverId = $booking->driver_id;
        
        $validated = $request->validate([
            'carId' => 'exists:cars,id',
            'driverId' => 'nullable|exists:users,id',
            'departmentId' => 'nullable|exists:departments,id',
            'positionId' => 'nullable|exists:positions,id',
            'date' => 'date',
            'timeFrom' => 'string',
            'timeTo' => 'string',
            'status' => 'string',
        ]);

        if (isset($validated['carId'])) $booking->car_id = $validated['carId'];
        if (array_key_exists('driverId', $validated)) $booking->driver_id = $validated['driverId'];
        if (array_key_exists('departmentId', $validated)) $booking->department_id = $validated['departmentId'];
        if (array_key_exists('positionId', $validated)) $booking->position_id = $validated['positionId'];
        
        if (isset($validated['date']) && isset($validated['timeFrom'])) {
            $booking->start_time = \Carbon\Carbon::parse($validated['date'] . ' ' . $validated['timeFrom']);
        }
        if (isset($validated['date']) && isset($validated['timeTo'])) {
            $booking->end_time = \Carbon\Carbon::parse($validated['date'] . ' ' . $validated['timeTo']);
        }

        $booking->save();

        if ($oldDriverId != $booking->driver_id) {
            $this->notifyDriver($booking, $bot, '✏️ *Вам назначена поездка*');
        }

        return response()->json($this->formatBooking($booking->fresh(['user', 'car', 'driver', 'requestType'])));
    }

    public function destroy($id, \SergiX44\Nutgram\Nutgram $bot)
    {
        try {
            $booking = Booking::with(['driver', 'user', 'car'])->findOrFail($id);
            
            // Notify driver before deletion
            if ($booking->driver_id) {
                $notificationService = app(NotificationService::class);
                $notificationService->notifyDriverBookingDeleted($booking, $bot);
            }
            
            $booking->delete();
            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            Log::error('Failed to delete booking: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to delete booking'], 500);
        }
    }

    public function updateBookingStatus(Request $request, $id, \SergiX44\Nutgram\Nutgram $bot)
    {
        $booking = Booking::findOrFail($id);
        $validated = $request->validate(['status' => 'required|string', 'reason' => 'nullable|string']);
        
        $statusMap = [
            'APPROVED' => BookingStatus::APPROVED,
            'DECLINED' => BookingStatus::DECLINED,
            'CANCELED' => BookingStatus::CANCELED,
            'IN_PROGRESS' => BookingStatus::IN_PROGRESS,
            'COMPLETED' => BookingStatus::COMPLETED,
        ];
        
        $newStatus = $statusMap[strtoupper($validated['status'])] ?? null;
        if (!$newStatus) {
            return response()->json(['error' => 'Invalid status'], 400);
        }

        $reason = trim($validated['reason'] ?? '');

        // Cancellation/decline must always carry a reason for the client
        if (in_array($newStatus, [BookingStatus::CANCELED, BookingStatus::DECLINED], true) && $reason === '') {
            return response()->json(['error' => 'Reason is required'], 422);
        }

        $booking->update(array_merge(
            ['status' => $newStatus],
            $reason !== '' ? ['rejection_reason' => $reason] : []
        ));

        $booking->load(['driver', 'user', 'car']);
        $notificationService = app(NotificationService::class);
        if ($newStatus === BookingStatus::CANCELED) {
            $notificationService->notifyClientBookingCanceled($booking, $reason, $bot);
        } elseif ($newStatus === BookingStatus::DECLINED) {
            $notificationService->notifyClientBookingDeclined($booking, $reason, $bot);
        }

        $titles = [
            'APPROVED' => '✅ *Заявка одобрена*',
            'DECLINED' => '🚫 *Заявка отклонена*',
            'CANCELED' => '❌ *Поездка отменена*',
            'IN_PROGRESS' => '🚗 *Поездка началась*',
            'COMPLETED' => '✅ *Поездка завершена*',
        ];
        
        $this->notifyDriver($booking, $bot, $titles[strtoupper($validated['status'])] ?? '📝 *Статус изменен*');
        
        return response()->json($this->formatBooking($booking->fresh(['user', 'car', 'driver', 'requestType'])));
    }

    public function approveBooking($id, \SergiX44\Nutgram\Nutgram $bot)
    {
        $booking = Booking::with(['driver', 'user', 'car'])->findOrFail($id);
        $booking->update(['status' => BookingStatus::APPROVED]);
        
        // Notify driver
        if ($booking->driver_id) {
            $notificationService = app(NotificationService::class);
            $notificationService->notifyDriverBookingApproved($booking, $bot);
        }
        
        return response()->json(['success' => true]);
    }
    
    public function declineBooking(Request $request, $id, \SergiX44\Nutgram\Nutgram $bot)
    {
        $validated = $request->validate([
            'reason' => 'required|string|max:1000',
        ]);

        $reason = trim($validated['reason']);
        if ($reason === '') {
            return response()->json(['error' => 'Reason is required'], 422);
        }

        $booking = Booking::with(['driver', 'user', 'car'])->findOrFail($id);
        $booking->update([
            'status' => BookingStatus::DECLINED,
            'rejection_reason' => $reason,
        ]);

        $notificationService = app(NotificationService::class);

        // Notify the client (booking owner) with the rejection reason
        $notificationService->notifyClientBookingDeclined($booking, $reason, $bot);

        // Notify driver
        if ($booking->driver_id) {
            $notificationService->notifyDriverBookingDeclined($booking, $reason, $bot);
        }

        return response()->json(['success' => true]);
    }

    public function cancelBooking(Request $request, $id, \SergiX44\Nutgram\Nutgram $bot)
    {
        $validated = $request->validate([
            'reason' => 'required|string|max:1000',
        ]);

        $reason = trim($validated['reason']);
        if ($reason === '') {
            return response()->json(['error' => 'Reason is required'], 422);
        }

        $booking = Booking::with(['driver', 'user', 'car'])->findOrFail($id);
        $booking->update([
            'status' => BookingStatus::CANCELED,
            'rejection_reason' => $reason,
        ]);

        $notificationService = app(NotificationService::class);

        // Notify the client (booking owner) with the cancellation reason
        $notificationService->notifyClientBookingCanceled($booking, $reason, $bot);

        // Notify driver
        if ($booking->driver_id) {
            $notificationService->notifyDriverBookingCanceled($booking, 'administrator', $bot, $reason);
        }

        return response()->json(['success' => true]);
    }

    private function notifyDriver(Booking $booking, \SergiX44\Nutgram\Nutgram $bot, string $title)
    {
        if (!$booking->driver_id) return;

        $driver = User::find($booking->driver_id);
        if (!$driver || !$driver->telegram_id) return;

        $booking->load(['car', 'user']);
        $startLocal = $booking->start_time->timezone('Asia/Dushanbe')->format('d.m.Y H:i');
        $endLocal = $booking->end_time->timezone('Asia/Dushanbe')->format('H:i');
        
        $msg = "{$title}\n\n";
        $msg .= "🆔 *Заявка #{$booking->id}*\n";
        $msg .= "📅 *Время:* {$startLocal} — {$endLocal}\n";
        $msg .= "🚙 *Автомобиль:* {$booking->car->model}\n";
        $msg .= "👤 *Клиент:* " . ($booking->user->full_name ?? $booking->user->username ?? 'Неизвестный') . "\n";
        $msg .= "📌 *Статус:* {$booking->status->value}";

        $keyboard = \SergiX44\Nutgram\Telegram\Types\Keyboard\InlineKeyboardMarkup::make();
        if ($booking->status === BookingStatus::APPROVED) {
            $keyboard->addRow(
                \SergiX44\Nutgram\Telegram\Types\Keyboard\InlineKeyboardButton::make(
                    '📍 На месте',
                    callback_data: "driver_arrived:{$booking->id}"
                )
            );
        } elseif ($booking->status === BookingStatus::IN_PROGRESS) {
            $keyboard->addRow(
                \SergiX44\Nutgram\Telegram\Types\Keyboard\InlineKeyboardButton::make(
                    '🏁 Завершить поездку',
                    callback_data: "complete_journey:{$booking->id}"
                )
            );
        }

        try {
            $bot->sendMessage(
                text: $msg,
                chat_id: $driver->telegram_id,
                parse_mode: 'Markdown',
                reply_markup: $keyboard->inline_keyboard ? $keyboard : null
            );
        } catch (\Exception $e) {
            Log::error('Failed to notify driver: ' . $e->getMessage());
        }
    }

    // =================== VEHICLES (CARS) ===================
    
    public function getVehicles(Request $request)
    {
        $cars = Car::with('currentDriver')->get()->map(function ($car) {
            return $this->formatVehicle($car);
        });
        
        return response()->json([
            'data' => $cars,
            'total' => count($cars),
            'page' => 1,
            'limit' => 100,
            'totalPages' => 1,
        ]);
    }

    public function getVehicle($id)
    {
        $car = Car::with('currentDriver')->findOrFail($id);
        return response()->json($this->formatVehicle($car));
    }

    private function formatVehicle($car)
    {
        $statusMap = [
            'ACTIVE' => 'available',
            'MAINTENANCE' => 'maintenance',
            'ARCHIVED' => 'out_of_service',
        ];
        
        return [
            'id' => (string) $car->id,
            'name' => $car->model,
            'make' => '',
            'model' => $car->model,
            'licensePlate' => $car->license_plate,
            'year' => null,
            'color' => $car->color_hex,
            'status' => $statusMap[$car->status?->value ?? 'ACTIVE'] ?? 'available',
            'driverId' => $car->default_driver_id ? (string) $car->default_driver_id : null,
            'driverName' => $car->currentDriver?->full_name ?? null,
            'description' => $car->description,
            'isActive' => ($car->status?->value ?? 'ACTIVE') === 'ACTIVE',
            'createdAt' => $car->created_at?->toISOString(),
            'updatedAt' => $car->updated_at?->toISOString(),
        ];
    }

    public function createVehicle(Request $request)
    {
        $validated = $request->validate([
            'model' => 'required|string|max:255',
            'licensePlate' => 'required|string|max:64|unique:cars,license_plate',
            'description' => 'nullable|string',
            'color' => 'nullable|string|max:16',
            'status' => 'nullable|string|in:available,maintenance,out_of_service',
        ]);

        $statusMap = [
            'available' => 'ACTIVE',
            'maintenance' => 'MAINTENANCE',
            'out_of_service' => 'ARCHIVED',
        ];

        $car = Car::create([
            'model' => $validated['model'],
            'license_plate' => $validated['licensePlate'],
            'description' => $validated['description'] ?? null,
            'color_hex' => $validated['color'] ?? null,
            'status' => $statusMap[$validated['status'] ?? 'available'] ?? 'ACTIVE',
        ]);

        return response()->json($this->formatVehicle($car), 201);
    }

    public function updateVehicle(Request $request, $id)
    {
        $car = Car::findOrFail($id);
        
        $validated = $request->validate([
            'model' => 'string|max:255',
            'licensePlate' => 'string|max:64|unique:cars,license_plate,' . $id,
            'description' => 'nullable|string',
            'color' => 'nullable|string|max:16',
            'status' => 'nullable|string|in:available,maintenance,out_of_service',
        ]);

        $statusMap = [
            'available' => 'ACTIVE',
            'maintenance' => 'MAINTENANCE',
            'out_of_service' => 'ARCHIVED',
        ];

        if (isset($validated['model'])) $car->model = $validated['model'];
        if (isset($validated['licensePlate'])) $car->license_plate = $validated['licensePlate'];
        if (isset($validated['description'])) $car->description = $validated['description'];
        if (isset($validated['color'])) $car->color_hex = $validated['color'];
        if (isset($validated['status'])) $car->status = $statusMap[$validated['status']] ?? 'ACTIVE';
        
        $car->save();

        return response()->json($this->formatVehicle($car->fresh(['currentDriver'])));
    }

    public function deleteVehicle($id)
    {
        try {
            $car = Car::findOrFail($id);
            $car->delete();
            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Cannot delete vehicle. It may have associated bookings.'], 400);
        }
    }

    public function updateVehicleStatus(Request $request, $id)
    {
        $car = Car::findOrFail($id);
        $statusMap = [
            'available' => 'ACTIVE',
            'maintenance' => 'MAINTENANCE',
            'out_of_service' => 'ARCHIVED',
        ];
        $validated = $request->validate(['status' => 'required|string|in:available,maintenance,out_of_service']);
        $car->update(['status' => $statusMap[$validated['status']] ?? 'ACTIVE']);
        return response()->json($this->formatVehicle($car->fresh(['currentDriver'])));
    }

    public function assignDriverToVehicle(Request $request, $id)
    {
        $car = Car::findOrFail($id);
        $validated = $request->validate(['driverId' => 'nullable|exists:users,id']);
        $car->update(['default_driver_id' => $validated['driverId']]);
        return response()->json($this->formatVehicle($car->fresh(['currentDriver'])));
    }

    public function getCars()
    {
        return response()->json(Car::all());
    }

    // =================== DRIVERS ===================
    
    public function getDrivers(Request $request)
    {
        $drivers = User::where('role', 'DRIVER')->get()->map(function ($user) {
            return $this->formatDriver($user);
        });
        
        return response()->json([
            'data' => $drivers,
            'total' => count($drivers),
            'page' => 1,
            'limit' => 100,
            'totalPages' => 1,
        ]);
    }

    public function getDriver($id)
    {
        $driver = User::where('role', 'DRIVER')->findOrFail($id);
        return response()->json($this->formatDriver($driver));
    }

    private function formatDriver($user)
    {
        return [
            'id' => (string) $user->id,
            'name' => $user->full_name ?? $user->username,
            'fullName' => $user->full_name ?? $user->username,
            'phone' => $user->phone_number ?? '',
            'email' => $user->email ?? '',
            'telegramId' => $user->telegram_id,
            'status' => $user->is_active ? 'active' : 'inactive',
            'createdAt' => $user->created_at?->toISOString(),
            'updatedAt' => $user->updated_at?->toISOString(),
        ];
    }

    public function createDriver(Request $request)
    {
        $validated = $request->validate([
            'fullName' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255|unique:users,email',
            'telegramId' => 'nullable|integer|unique:users,telegram_id',
            'status' => 'nullable|string|in:active,inactive',
        ]);

        try {
            $driver = User::create([
                'full_name' => $validated['fullName'],
                'username' => $validated['fullName'],
                'phone_number' => $validated['phone'] ?? null,
                'email' => $validated['email'] ?? null,
                'telegram_id' => $validated['telegramId'] ?? null,
                'role' => 'DRIVER',
                'is_active' => ($validated['status'] ?? 'active') === 'active',
            ]);

            return response()->json($this->formatDriver($driver), 201);
        } catch (\Exception $e) {
            \Log::error('Error creating driver: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to create driver. Please check the data and try again.'], 400);
        }
    }

    public function updateDriver(Request $request, $id)
    {
        $driver = User::where('role', 'DRIVER')->findOrFail($id);
        
        $validated = $request->validate([
            'fullName' => 'string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255|unique:users,email,' . $id,
            'telegramId' => 'nullable|integer|unique:users,telegram_id,' . $id,
            'status' => 'nullable|string|in:active,inactive',
        ]);

        try {
            if (isset($validated['fullName'])) {
                $driver->full_name = $validated['fullName'];
                $driver->username = $validated['fullName'];
            }
            if (isset($validated['phone'])) $driver->phone_number = $validated['phone'];
            if (isset($validated['email'])) $driver->email = $validated['email'];
            if (isset($validated['telegramId'])) $driver->telegram_id = $validated['telegramId'];
            if (isset($validated['status'])) $driver->is_active = $validated['status'] === 'active';
            
            $driver->save();

            return response()->json($this->formatDriver($driver));
        } catch (\Exception $e) {
            \Log::error('Error updating driver: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to update driver. Please check the data and try again.'], 400);
        }
    }

    public function deleteDriver($id)
    {
        try {
            $driver = User::where('role', 'DRIVER')->findOrFail($id);
            $driver->delete();
            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Cannot delete driver. They may have associated bookings or cars.'], 400);
        }
    }

    public function updateDriverStatus(Request $request, $id)
    {
        $driver = User::where('role', 'DRIVER')->findOrFail($id);
        $validated = $request->validate(['status' => 'required|string|in:active,inactive']);
        $driver->update(['is_active' => $validated['status'] === 'active']);
        return response()->json($this->formatDriver($driver));
    }

    // =================== ADMIN ACCOUNTS ===================

    public function getAdmins(Request $request)
    {
        $admins = User::where('role', 'ADMIN')->orderBy('id')->get()->map(function ($user) {
            return $this->formatAdmin($user);
        });

        return response()->json([
            'data' => $admins,
            'total' => count($admins),
            'page' => 1,
            'limit' => 100,
            'totalPages' => 1,
        ]);
    }

    private function formatAdmin($user)
    {
        return [
            'id' => (string) $user->id,
            'name' => $user->full_name ?? $user->username,
            'email' => $user->email,
            'isActive' => $user->is_active,
            'createdAt' => $user->created_at?->toISOString(),
            'updatedAt' => $user->updated_at?->toISOString(),
        ];
    }

    public function createAdmin(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'password' => 'required|string|min:8',
        ]);

        $admin = User::create([
            'full_name' => $validated['name'],
            'username' => $validated['email'],
            'email' => $validated['email'],
            'password' => $validated['password'],
            'role' => 'ADMIN',
            'is_active' => true,
        ]);

        return response()->json($this->formatAdmin($admin), 201);
    }

    public function updateAdmin(Request $request, $id)
    {
        $admin = User::where('role', 'ADMIN')->findOrFail($id);

        $validated = $request->validate([
            'name' => 'string|max:255',
            'email' => 'email|max:255|unique:users,email,' . $id,
            'password' => 'nullable|string|min:8',
        ]);

        if (isset($validated['name'])) $admin->full_name = $validated['name'];
        if (isset($validated['email'])) $admin->email = $validated['email'];
        if (!empty($validated['password'])) $admin->password = $validated['password'];

        $admin->save();

        return response()->json($this->formatAdmin($admin));
    }

    public function deleteAdmin(Request $request, $id)
    {
        $admin = User::where('role', 'ADMIN')->findOrFail($id);

        // Blocking self-deletion also guarantees at least one admin always remains
        if ($request->user()->id === $admin->id) {
            return response()->json(['error' => 'Нельзя удалить собственную учётную запись'], 422);
        }

        $admin->delete();

        return response()->json(['success' => true]);
    }

    // =================== REQUEST TYPES ===================
    
    public function getRequestTypes()
    {
        $types = RequestType::with('car')->get()->map(function ($type) {
            return $this->formatRequestType($type);
        });
        
        return response()->json([
            'data' => $types,
            'total' => count($types),
            'page' => 1,
            'limit' => 100,
            'totalPages' => 1,
        ]);
    }

    private function formatRequestType($type)
    {
        return [
            'id' => (string) $type->id,
            'name' => $type->title,
            'title' => $type->title,
            'priority' => $type->priority,
            'carId' => (string) $type->car_id,
            'carName' => $type->car?->model ?? 'Не указан',
            'isActive' => $type->is_active,
            'createdAt' => $type->created_at?->toISOString(),
            'updatedAt' => $type->updated_at?->toISOString(),
        ];
    }

    public function createRequestType(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'priority' => 'required|integer|min:1|max:20',
            'carId' => 'required|exists:cars,id',
            'isActive' => 'boolean',
            'name' => 'nullable|string', // Allow name as alias for title
        ]);

        $type = RequestType::create([
            'title' => $validated['title'] ?? $validated['name'],
            'priority' => $validated['priority'],
            'car_id' => $validated['carId'],
            'is_active' => $validated['isActive'] ?? true,
        ]);

        return response()->json($this->formatRequestType($type->fresh(['car'])), 201);
    }

    public function updateRequestType(Request $request, $id)
    {
        $type = RequestType::findOrFail($id);
        
        $validated = $request->validate([
            'title' => 'string|max:255',
            'priority' => 'integer|min:1|max:20',
            'carId' => 'exists:cars,id',
            'isActive' => 'boolean',
            'name' => 'nullable|string',
        ]);

        if (isset($validated['title'])) $type->title = $validated['title'];
        if (isset($validated['name']) && !isset($validated['title'])) $type->title = $validated['name'];
        if (isset($validated['priority'])) $type->priority = $validated['priority'];
        if (isset($validated['carId'])) $type->car_id = $validated['carId'];
        if (isset($validated['isActive'])) $type->is_active = $validated['isActive'];
        
        $type->save();

        return response()->json($this->formatRequestType($type->fresh(['car'])));
    }

    public function deleteRequestType($id)
    {
        try {
            $type = RequestType::findOrFail($id);
            $type->delete();
            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Cannot delete request type. It may have associated bookings.'], 400);
        }
    }

    // =================== FORCE BLOCKS ===================
    
    public function createForceBlock(Request $request)
    {
        $validated = $request->validate([
            'carId' => 'required|exists:cars,id',
            'startTime' => 'required|date',
            'endTime' => 'required|date|after:startTime',
            'reason' => 'nullable|string',
        ]);

        $block = ForceBlock::create([
            'car_id' => $validated['carId'],
            'start_time' => \Carbon\Carbon::parse($validated['startTime']),
            'end_time' => \Carbon\Carbon::parse($validated['endTime']),
            'reason' => $validated['reason'],
            'created_by' => $request->user()?->id,
        ]);

        return response()->json(['success' => true, 'block' => $block], 201);
    }

    // =================== DEPARTMENTS ===================
    
    public function getDepartments(Request $request)
    {
        $departments = Department::orderBy('short_name')->get()->map(function ($dept) {
            return $this->formatDepartment($dept);
        });
        
        return response()->json([
            'data' => $departments,
            'total' => count($departments),
            'page' => 1,
            'limit' => 100,
            'totalPages' => 1,
        ]);
    }

    public function getDepartment($id)
    {
        $department = Department::findOrFail($id);
        return response()->json($this->formatDepartment($department));
    }

    private function formatDepartment($dept)
    {
        return [
            'id' => (string) $dept->id,
            'shortName' => $dept->short_name,
            'fullName' => $dept->full_name,
            'isActive' => $dept->is_active,
            'createdAt' => $dept->created_at?->toISOString(),
            'updatedAt' => $dept->updated_at?->toISOString(),
        ];
    }

    public function createDepartment(Request $request)
    {
        $validated = $request->validate([
            'shortName' => 'required|string|max:50',
            'fullName' => 'required|string|max:255',
            'isActive' => 'boolean',
        ]);

        $department = Department::create([
            'short_name' => $validated['shortName'],
            'full_name' => $validated['fullName'],
            'is_active' => $validated['isActive'] ?? true,
        ]);

        return response()->json($this->formatDepartment($department), 201);
    }

    public function updateDepartment(Request $request, $id)
    {
        $department = Department::findOrFail($id);
        
        $validated = $request->validate([
            'shortName' => 'string|max:50',
            'fullName' => 'string|max:255',
            'isActive' => 'boolean',
        ]);

        if (isset($validated['shortName'])) $department->short_name = $validated['shortName'];
        if (isset($validated['fullName'])) $department->full_name = $validated['fullName'];
        if (isset($validated['isActive'])) $department->is_active = $validated['isActive'];
        
        $department->save();

        return response()->json($this->formatDepartment($department));
    }

    public function deleteDepartment($id)
    {
        try {
            $department = Department::findOrFail($id);
            $department->delete();
            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Cannot delete department. It may have associated bookings.'], 400);
        }
    }

    // =================== POSITIONS ===================
    
    public function getPositions(Request $request)
    {
        $positions = Position::orderBy('title')->get()->map(function ($pos) {
            return $this->formatPosition($pos);
        });
        
        return response()->json([
            'data' => $positions,
            'total' => count($positions),
            'page' => 1,
            'limit' => 100,
            'totalPages' => 1,
        ]);
    }

    public function getPosition($id)
    {
        $position = Position::findOrFail($id);
        return response()->json($this->formatPosition($position));
    }

    private function formatPosition($pos)
    {
        return [
            'id' => (string) $pos->id,
            'title' => $pos->title,
            'isActive' => $pos->is_active,
            'createdAt' => $pos->created_at?->toISOString(),
            'updatedAt' => $pos->updated_at?->toISOString(),
        ];
    }

    public function createPosition(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'isActive' => 'boolean',
        ]);

        $position = Position::create([
            'title' => $validated['title'],
            'is_active' => $validated['isActive'] ?? true,
        ]);

        return response()->json($this->formatPosition($position), 201);
    }

    public function updatePosition(Request $request, $id)
    {
        $position = Position::findOrFail($id);
        
        $validated = $request->validate([
            'title' => 'string|max:255',
            'isActive' => 'boolean',
        ]);

        if (isset($validated['title'])) $position->title = $validated['title'];
        if (isset($validated['isActive'])) $position->is_active = $validated['isActive'];
        
        $position->save();

        return response()->json($this->formatPosition($position));
    }

    public function deletePosition($id)
    {
        try {
            $position = Position::findOrFail($id);
            $position->delete();
            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Cannot delete position. It may have associated bookings.'], 400);
        }
    }
}
