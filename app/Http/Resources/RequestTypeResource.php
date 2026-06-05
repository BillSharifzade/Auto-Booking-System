<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RequestTypeResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // Priority labels for display
        $priorityLabels = [
            1 => 'Низкий',
            2 => 'Средний', 
            3 => 'Высокий',
            4 => 'Срочный',
        ];
        
        return [
            'id' => (string) $this->id,
            'name' => $this->title, // Map 'title' to 'name' for client compatibility
            'description' => $priorityLabels[$this->priority] ?? 'Приоритет: ' . $this->priority,
            'priority' => (int) $this->priority,
            'carId' => (string) $this->car_id,
            'carName' => $this->car ? $this->car->model : 'Unknown Car',
            'color' => null, // Not in DB yet
            'icon' => '🚗', // Default icon
        ];
    }
}
