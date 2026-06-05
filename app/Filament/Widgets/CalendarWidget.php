<?php

namespace App\Filament\Widgets;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\ForceBlock;
use Carbon\Carbon;
use Filament\Widgets\Widget;
use Illuminate\Contracts\View\View;

class CalendarWidget extends Widget
{
    protected static string $view = 'filament.widgets.calendar-widget';
    
    protected static ?int $sort = 2;
    
    protected int|string|array $columnSpan = '1';
    
    public int $currentMonth;
    public int $currentYear;
    public ?string $selectedDate = null;
    
    public function mount(): void
    {
        $this->currentMonth = now()->month;
        $this->currentYear = now()->year;
        $this->selectedDate = now()->format('Y-m-d');
    }
    
    public function prevMonth(): void
    {
        if ($this->currentMonth === 1) {
            $this->currentMonth = 12;
            $this->currentYear--;
        } else {
            $this->currentMonth--;
        }
    }
    
    public function nextMonth(): void
    {
        if ($this->currentMonth === 12) {
            $this->currentMonth = 1;
            $this->currentYear++;
        } else {
            $this->currentMonth++;
        }
    }
    
    public function selectDate(string $date): void
    {
        $this->selectedDate = $date;
        $this->dispatch('dateSelected', date: $date);
    }
    
    public function getMonthName(): string
    {
        $months = [
            1 => 'Январь', 2 => 'Февраль', 3 => 'Март', 4 => 'Апрель',
            5 => 'Май', 6 => 'Июнь', 7 => 'Июль', 8 => 'Август',
            9 => 'Сентябрь', 10 => 'Октябрь', 11 => 'Ноябрь', 12 => 'Декабрь',
        ];
        return $months[$this->currentMonth] . ' ' . $this->currentYear;
    }
    
    public function getCalendarDays(): array
    {
        $firstDay = Carbon::create($this->currentYear, $this->currentMonth, 1);
        $lastDay = $firstDay->copy()->endOfMonth();
        $today = now()->startOfDay();
        
        // Get first day of week (1=Monday, 7=Sunday)
        $startDayOfWeek = $firstDay->dayOfWeekIso;
        
        // Get bookings and force blocks for this month
        $monthStart = $firstDay->copy()->startOfDay()->utc();
        $monthEnd = $lastDay->copy()->endOfDay()->utc();
        
        $bookings = Booking::whereIn('status', [
                BookingStatus::NEW, 
                BookingStatus::APPROVED, 
                BookingStatus::IN_PROGRESS
            ])
            ->where('start_time', '>=', $monthStart)
            ->where('start_time', '<=', $monthEnd)
            ->get()
            ->groupBy(fn ($booking) => $booking->start_time->timezone('Asia/Dushanbe')->format('Y-m-d'));
        
        $forceBlocks = ForceBlock::where('start_time', '>=', $monthStart)
            ->where('start_time', '<=', $monthEnd)
            ->get()
            ->groupBy(fn ($block) => $block->start_time->timezone('Asia/Dushanbe')->format('Y-m-d'));
        
        $days = [];
        
        // Add empty cells for days before month starts
        for ($i = 1; $i < $startDayOfWeek; $i++) {
            $days[] = null;
        }
        
        // Add all days of month
        for ($day = 1; $day <= $lastDay->day; $day++) {
            $date = Carbon::create($this->currentYear, $this->currentMonth, $day);
            $dateStr = $date->format('Y-m-d');
            
            $dayBookings = $bookings->get($dateStr, collect());
            $dayForceBlocks = $forceBlocks->get($dateStr, collect());
            
            // Determine status
            $status = null;
            if ($dayForceBlocks->count() > 0) {
                $status = 'force_major';
            } elseif ($dayBookings->where('status', BookingStatus::NEW)->count() > 0) {
                $status = 'waiting';
            } elseif ($dayBookings->count() > 0) {
                $status = 'approved';
            }
            
            $days[] = [
                'day' => $day,
                'date' => $dateStr,
                'isToday' => $date->isSameDay($today),
                'isSelected' => $dateStr === $this->selectedDate,
                'status' => $status,
                'bookingCount' => $dayBookings->count(),
            ];
        }
        
        return $days;
    }
}
