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
        Schema::create('cars', function (Blueprint $table) {
            $table->id();
            $table->string('model');
            $table->string('license_plate', 64)->unique();
            $table->text('description')->nullable();
            $table->enum('status', ['ACTIVE', 'MAINTENANCE', 'ARCHIVED'])->default('ACTIVE');
            $table->string('color_hex', 16)->nullable();
            $table->foreignId('default_driver_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cars');
    }
};
