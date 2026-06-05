<?php

namespace App\Filament\Widgets;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\Car;
use App\Models\User;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class StatsOverviewWidget extends BaseWidget
{
    protected static ?int $sort = 1;
    
    protected function getStats(): array
    {
        $todayStart = now()->startOfDay();
        $todayEnd = now()->endOfDay();
        
        $pendingBookings = Booking::where('status', BookingStatus::NEW)->count();
        $todayBookings = Booking::where('start_time', '>=', $todayStart)
            ->where('start_time', '<=', $todayEnd)
            ->count();
        $activeCars = Car::where('status', 'ACTIVE')->count();
        $activeDrivers = User::where('role', 'DRIVER')->where('is_active', true)->count();
        
        return [
            Stat::make('Ожидают подтверждения', $pendingBookings)
                ->description('Новые заявки')
                ->descriptionIcon('heroicon-m-clock')
                ->color('warning')
                ->chart([2, 4, 6, 8, $pendingBookings]),
                
            Stat::make('Заявки на сегодня', $todayBookings)
                ->description(now()->format('d.m.Y'))
                ->descriptionIcon('heroicon-m-calendar')
                ->color('primary'),
                
            Stat::make('Автомобили', $activeCars)
                ->description('Активные')
                ->descriptionIcon('heroicon-m-truck')
                ->color('success'),
                
            Stat::make('Водители', $activeDrivers)
                ->description('Активные')
                ->descriptionIcon('heroicon-m-users')
                ->color('info'),
        ];
    }
}
