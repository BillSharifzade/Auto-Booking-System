<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('positions', function (Blueprint $table) {
            // Positions exempt from the minimum advance-booking time (e.g. department heads)
            $table->boolean('no_time_limit')->default(false)->after('is_active');
        });

        DB::table('positions')
            ->where('title', 'Руководитель департамента')
            ->update(['no_time_limit' => true]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('positions', function (Blueprint $table) {
            $table->dropColumn('no_time_limit');
        });
    }
};
