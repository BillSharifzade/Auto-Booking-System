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
        Schema::table('bookings', function (Blueprint $table) {
            $table->string('client_name')->nullable()->after('user_id');
            $table->string('from_location')->nullable()->after('position_id');
            $table->string('to_location')->nullable()->after('from_location');
            $table->text('comment')->nullable()->after('to_location');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn(['client_name', 'from_location', 'to_location', 'comment']);
        });
    }
};
