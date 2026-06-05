<?php

namespace App\Models;

use App\Enums\CarStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Car extends Model
{
    use HasFactory;

    protected $fillable = [
        'model',
        'license_plate',
        'description',
        'status',
        'color_hex',
        'default_driver_id',
    ];

    protected function casts(): array
    {
        return [
            'status' => CarStatus::class,
        ];
    }

    /**
     * Default driver for this car.
     */
    public function defaultDriver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'default_driver_id');
    }

    /**
     * Request types associated with this car.
     */
    public function requestTypes(): HasMany
    {
        return $this->hasMany(RequestType::class);
    }

    /**
     * Bookings for this car.
     */
    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    /**
     * Force blocks for this car.
     */
    public function forceBlocks(): HasMany
    {
        return $this->hasMany(ForceBlock::class);
    }

    /**
     * Current driver (alias for defaultDriver).
     */
    public function currentDriver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'default_driver_id');
    }
}
