<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\ForceBlock;
use Carbon\Carbon;

class CalendarService
{
    /**
     * Get calendar slots (bookings and blocks) for a car in a time range.
     */
    public function getSlots(int $carId, Carbon $startTime, Carbon $endTime): array
    {
        $bookings = Booking::where('car_id', $carId)
            ->whereIn('status', ['NEW', 'APPROVED', 'IN_PROGRESS'])
            ->where('start_time', '<', $endTime)
            ->where('end_time', '>', $startTime)
            ->get();

        $blocks = ForceBlock::where('car_id', $carId)
            ->where('start_time', '<', $endTime)
            ->where('end_time', '>', $startTime)
            ->get();

        $slots = [];

        foreach ($bookings as $booking) {
            $slots[] = [
                'type' => 'booking',
                'id' => $booking->id,
                'car_id' => $booking->car_id,
                'start' => $booking->start_time->toISOString(),
                'end' => $booking->end_time->toISOString(),
                'status' => $booking->status->value,
            ];
        }

        foreach ($blocks as $block) {
            $slots[] = [
                'type' => 'block',
                'id' => $block->id,
                'car_id' => $block->car_id,
                'start' => $block->start_time->toISOString(),
                'end' => $block->end_time->toISOString(),
                'reason' => $block->reason,
            ];
        }

        return $slots;
    }
}
