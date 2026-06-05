<?php

namespace App\Models;

use App\Enums\BookingStatus;
use App\Enums\WaitMode;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Booking extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'client_name',
        'car_id',
        'driver_id',
        'request_type_id',
        'department_id',
        'position_id',
        'from_location',
        'to_location',
        'comment',
        'start_time',
        'end_time',
        'has_passengers',
        'has_luggage',
        'wait_mode',
        'status',
        'rejection_reason',
    ];

    protected function casts(): array
    {
        return [
            'start_time' => 'datetime',
            'end_time' => 'datetime',
            'has_passengers' => 'boolean',
            'has_luggage' => 'boolean',
            'wait_mode' => WaitMode::class,
            'status' => BookingStatus::class,
        ];
    }

    /**
     * Client who made the booking.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Car for this booking.
     */
    public function car(): BelongsTo
    {
        return $this->belongsTo(Car::class);
    }

    /**
     * Driver assigned to this booking.
     */
    public function driver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'driver_id');
    }

    /**
     * Request type for this booking.
     */
    public function requestType(): BelongsTo
    {
        return $this->belongsTo(RequestType::class);
    }

    /**
     * Department for this booking.
     */
    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    /**
     * Position for this booking.
     */
    public function position(): BelongsTo
    {
        return $this->belongsTo(Position::class);
    }

    /**
     * Status history for this booking.
     */
    public function statusHistory(): HasMany
    {
        return $this->hasMany(BookingStatusHistory::class);
    }

    /**
     * Check if booking is active (can be modified).
     */
    public function isActive(): bool
    {
        return in_array($this->status, [
            BookingStatus::NEW,
            BookingStatus::APPROVED,
            BookingStatus::IN_PROGRESS,
        ]);
    }

    /**
     * Check if booking can be canceled.
     */
    public function canBeCanceled(): bool
    {
        return in_array($this->status, [
            BookingStatus::NEW,
            BookingStatus::APPROVED,
        ]);
    }
}
