<?php

namespace App\Services;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\BookingStatusHistory;
use App\Models\Car;
use App\Models\ForceBlock;
use App\Models\RequestType;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class BookingService
{
    const BUFFER_MINUTES = 30;

    /**
     * Create a new booking with preemption logic.
     *
     * @throws BookingConflictException
     */
    public function createBooking(
        int $userId,
        int $requestTypeId,
        Carbon $startTime,
        Carbon $endTime,
        bool $hasPassengers,
        bool $hasLuggage,
        string $waitMode,
        bool $autoApprove = false
    ): Booking {
        if ($startTime->gte($endTime)) {
            throw new BookingConflictException('Start time must be before end time');
        }

        return DB::transaction(function () use (
            $userId,
            $requestTypeId,
            $startTime,
            $endTime,
            $hasPassengers,
            $hasLuggage,
            $waitMode,
            $autoApprove
        ) {
            $requestType = $this->getRequestType($requestTypeId);
            $carId = $requestType->car_id;

            // Lock car to prevent race conditions
            $car = Car::where('id', $carId)->lockForUpdate()->first();
            if (!$car) {
                throw new BookingConflictException('Car not found');
            }

            $driverId = $car->default_driver_id;

            // Check for force blocks
            $this->ensureNoForceBlockConflict($carId, $startTime, $endTime);

            // Get overlapping bookings
            $overlappingBookings = $this->getOverlappingBookings($carId, $startTime, $endTime);

            $preempted = [];

            foreach ($overlappingBookings as $existing) {
                $existingPriority = $existing->requestType->priority;
                $newPriority = $requestType->priority;

                if ($newPriority > $existingPriority) {
                    // Preempt the existing booking
                    $oldStatus = $existing->status;
                    $existing->status = BookingStatus::DECLINED;
                    $existing->rejection_reason = 'Displaced by higher priority request';
                    $existing->save();

                    BookingStatusHistory::create([
                        'booking_id' => $existing->id,
                        'old_status' => $oldStatus,
                        'new_status' => BookingStatus::DECLINED,
                        'changed_by_user_id' => $userId,
                        'reason' => 'Displaced by higher priority request',
                    ]);

                    $preempted[] = $existing;
                } else {
                    throw new BookingConflictException(
                        'Slot unavailable due to existing booking with equal/higher priority'
                    );
                }
            }

            $initialStatus = $autoApprove ? BookingStatus::APPROVED : BookingStatus::NEW;

            $booking = Booking::create([
                'user_id' => $userId,
                'car_id' => $carId,
                'driver_id' => $driverId,
                'request_type_id' => $requestTypeId,
                'start_time' => $startTime,
                'end_time' => $endTime,
                'has_passengers' => $hasPassengers,
                'has_luggage' => $hasLuggage,
                'wait_mode' => $waitMode,
                'status' => $initialStatus,
            ]);

            BookingStatusHistory::create([
                'booking_id' => $booking->id,
                'old_status' => null,
                'new_status' => $initialStatus,
                'changed_by_user_id' => $userId,
                'reason' => null,
            ]);

            // Notify preempted users and their drivers
            if (!empty($preempted)) {
                $bot = app(\SergiX44\Nutgram\Nutgram::class);
                $notificationService = app(\App\Services\NotificationService::class);
                
                foreach ($preempted as $preemptedBooking) {
                    // Notify the preempted client
                    $notificationService->notifyBookingPreempted($preemptedBooking, $bot);
                    
                    // Notify the driver if assigned
                    if ($preemptedBooking->driver_id) {
                        $notificationService->notifyDriverBookingDeclined(
                            $preemptedBooking,
                            'Displaced by higher priority request',
                            $bot
                        );
                    }
                }
            }

            return $booking->fresh(['car', 'requestType', 'user', 'driver']);
        });
    }

    /**
     * Get request type and validate it's active.
     */
    private function getRequestType(int $requestTypeId): RequestType
    {
        $requestType = RequestType::where('id', $requestTypeId)
            ->where('is_active', true)
            ->first();

        if (!$requestType) {
            throw new BookingConflictException('Request type not found or inactive');
        }

        return $requestType;
    }

    /**
     * Check for force block conflicts.
     */
    private function ensureNoForceBlockConflict(int $carId, Carbon $startTime, Carbon $endTime): void
    {
        $bufferMinutes = self::BUFFER_MINUTES;
        $effectiveStart = $startTime->copy()->subMinutes($bufferMinutes);
        $effectiveEnd = $endTime->copy()->addMinutes($bufferMinutes);

        $hasBlock = ForceBlock::where('car_id', $carId)
            ->where('start_time', '<', $effectiveEnd)
            ->where('end_time', '>', $effectiveStart)
            ->exists();

        if ($hasBlock) {
            throw new BookingConflictException('Requested time is blocked for this car');
        }
    }

    /**
     * Get overlapping active bookings.
     */
    private function getOverlappingBookings(int $carId, Carbon $startTime, Carbon $endTime): array
    {
        $bufferMinutes = self::BUFFER_MINUTES;
        $effectiveStart = $startTime->copy()->subMinutes($bufferMinutes);
        $effectiveEnd = $endTime->copy()->addMinutes($bufferMinutes);

        return Booking::with('requestType')
            ->where('car_id', $carId)
            ->whereIn('status', [BookingStatus::NEW, BookingStatus::APPROVED, BookingStatus::IN_PROGRESS])
            ->where('start_time', '<', $effectiveEnd)
            ->where('end_time', '>', $effectiveStart)
            ->lockForUpdate()
            ->get()
            ->all();
    }

    /**
     * Suggest next available time slot.
     */
    public function suggestNextFreeSlot(
        int $requestTypeId,
        Carbon $startTime,
        Carbon $endTime,
        int $searchHorizonHours = 24
    ): ?array {
        $requestType = $this->getRequestType($requestTypeId);
        $carId = $requestType->car_id;

        $duration = $endTime->diffInSeconds($startTime);
        $bufferMinutes = self::BUFFER_MINUTES;
        $searchEnd = $startTime->copy()->addHours($searchHorizonHours);

        // Get all bookings and blocks in the search window
        $bookings = Booking::where('car_id', $carId)
            ->whereIn('status', [BookingStatus::NEW, BookingStatus::APPROVED, BookingStatus::IN_PROGRESS])
            ->where('start_time', '<=', $searchEnd)
            ->where('end_time', '>=', $startTime)
            ->get();

        $blocks = ForceBlock::where('car_id', $carId)
            ->where('start_time', '<=', $searchEnd)
            ->where('end_time', '>=', $startTime)
            ->get();

        // Build intervals with buffer
        $intervals = [];
        foreach ($bookings as $booking) {
            $intervals[] = [
                $booking->start_time->copy()->subMinutes($bufferMinutes),
                $booking->end_time->copy()->addMinutes($bufferMinutes),
            ];
        }
        foreach ($blocks as $block) {
            $intervals[] = [
                $block->start_time->copy()->subMinutes($bufferMinutes),
                $block->end_time->copy()->addMinutes($bufferMinutes),
            ];
        }

        // Sort intervals by start time
        usort($intervals, fn($a, $b) => $a[0]->timestamp <=> $b[0]->timestamp);

        $candidateStart = $startTime->copy();
        foreach ($intervals as [$busyStart, $busyEnd]) {
            $candidateEnd = $candidateStart->copy()->addSeconds($duration);

            if ($candidateEnd->lte($busyStart)) {
                if ($candidateEnd->lte($searchEnd)) {
                    return [
                        'start' => $candidateStart->toISOString(),
                        'end' => $candidateEnd->toISOString(),
                    ];
                }
                return null;
            }

            if ($candidateStart->lt($busyEnd)) {
                $candidateStart = $busyEnd->copy();
            }
        }

        $candidateEnd = $candidateStart->copy()->addSeconds($duration);
        if ($candidateEnd->lte($searchEnd)) {
            return [
                'start' => $candidateStart->toISOString(),
                'end' => $candidateEnd->toISOString(),
            ];
        }

        return null;
    }
}
