<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users');
            $table->foreignId('car_id')->constrained('cars');
            $table->foreignId('driver_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('request_type_id')->constrained('request_types');
            $table->dateTimeTz('start_time');
            $table->dateTimeTz('end_time');
            $table->boolean('has_passengers')->default(false);
            $table->boolean('has_luggage')->default(false);
            $table->enum('wait_mode', ['WAIT_ON_SITE', 'RETURN_AT_TIME']);
            $table->enum('status', ['NEW', 'APPROVED', 'DECLINED', 'CANCELED', 'IN_PROGRESS', 'COMPLETED'])->default('NEW');
            $table->text('rejection_reason')->nullable();
            $table->timestamps();

            // Indexes for efficient queries
            $table->index(['car_id', 'start_time', 'end_time'], 'ix_bookings_car_time');
            $table->index(['driver_id', 'status'], 'ix_bookings_driver_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
