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
        Schema::create('force_blocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('car_id')->constrained('cars')->cascadeOnDelete();
            $table->dateTimeTz('start_time');
            $table->dateTimeTz('end_time');
            $table->string('reason');
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();

            // Index for efficient time-based queries
            $table->index(['car_id', 'start_time', 'end_time'], 'ix_force_blocks_car_time');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('force_blocks');
    }
};
