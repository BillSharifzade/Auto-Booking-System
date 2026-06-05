<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BookingResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'userId' => $this->user_id,
            'userName' => $this->user?->full_name ?? $this->user?->username ?? 'Unknown',
            'userUsername' => $this->user?->username,
            'requestTypeId' => (string) $this->request_type_id,
            'carId' => (string) $this->car_id,
            'carName' => $this->car ? "{$this->car->model}" : 'Unknown Car',
            'driverId' => $this->driver_id ? (string) $this->driver_id : null,
            'departmentId' => $this->department_id ? (string) $this->department_id : null,
            'departmentName' => $this->department?->short_name,
            'positionId' => $this->position_id ? (string) $this->position_id : null,
            'positionName' => $this->position?->title,
            'clientName' => $this->client_name,
            'fromLocation' => $this->from_location,
            'toLocation' => $this->to_location,
            'comment' => $this->comment,
            'dateTimeFrom' => $this->start_time instanceof \Carbon\Carbon ? $this->start_time->toIso8601String() : $this->start_time,
            'dateTimeTo' => $this->end_time instanceof \Carbon\Carbon ? $this->end_time->toIso8601String() : $this->end_time,
            'hasPassengers' => (bool) $this->has_passengers,
            'hasLuggage' => (bool) $this->has_luggage,
            'waitingMode' => match($this->wait_mode) {
                \App\Enums\WaitMode::RETURN_AT_TIME => 'DRIVER_RETURNS',
                default => 'DRIVER_WAITS',
            },
            'returnTime' => null, // Not in current schema
            'status' => $this->status instanceof \App\Enums\BookingStatus ? $this->status->value : strtoupper($this->status),
            'declineReason' => $this->rejection_reason,
            'source' => 'WEB_APP', // Default source
            'createdAt' => $this->created_at instanceof \Carbon\Carbon ? $this->created_at->toIso8601String() : $this->created_at,
            'updatedAt' => $this->updated_at instanceof \Carbon\Carbon ? $this->updated_at->toIso8601String() : $this->updated_at,
            // Formatted times for frontend display (Asia/Dushanbe)
            'formattedStartTime' => $this->start_time instanceof \Carbon\Carbon 
                ? $this->start_time->timezone('Asia/Dushanbe')->translatedFormat('d F Y в H:i') 
                : $this->start_time,
            'formattedEndTime' => $this->end_time instanceof \Carbon\Carbon 
                ? $this->end_time->timezone('Asia/Dushanbe')->format('H:i') 
                : $this->end_time,
            'formattedTimeRange' => ($this->start_time instanceof \Carbon\Carbon && $this->end_time instanceof \Carbon\Carbon)
                ? $this->start_time->timezone('Asia/Dushanbe')->format('H:i') . ' - ' . $this->end_time->timezone('Asia/Dushanbe')->format('H:i')
                : '',
        ];
    }
}
