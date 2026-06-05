<?php

namespace App\Livewire;

use App\Enums\BookingStatus;
use App\Enums\WaitMode;
use App\Models\Booking;
use App\Models\Car;
use App\Models\ForceBlock;
use App\Models\RequestType;
use App\Models\User;
use App\Services\BookingConflictException;
use App\Services\BookingService;
use Carbon\Carbon;
use Livewire\Attributes\Computed;
use Livewire\Attributes\Layout;
use Livewire\Component;

#[Layout('components.layouts.app')]
class BookingWizard extends Component
{
    // Form data
    public $carId = '';
    public $requestTypeId = '';
    public $date = '';
    public $startTime = '';
    public $endTime = '';
    public $hasPassengers = false;
    public $hasLuggage = false;
    public $waitMode = 'WAIT_ON_SITE';
    
    // Calendar state
    public $currentMonth;
    public $currentYear;
    
    // State
    public $step = 1;
    public $cars = [];
    public $requestTypes = [];
    public $error = '';
    public $success = '';
    
    // Auth
    public $user = null;
    
    protected $rules = [
        'carId' => 'required|exists:cars,id',
        'requestTypeId' => 'required|exists:request_types,id',
        'date' => 'required|date|after_or_equal:today',
        'startTime' => 'required',
        'endTime' => 'required',
        'waitMode' => 'required|in:WAIT_ON_SITE,RETURN_AT_TIME',
    ];
    
    public function mount()
    {
        $this->cars = Car::where('status', 'ACTIVE')->get();
        $this->date = Carbon::now('Asia/Dushanbe')->format('Y-m-d');
        $this->currentMonth = Carbon::now('Asia/Dushanbe')->month;
        $this->currentYear = Carbon::now('Asia/Dushanbe')->year;
        
        $this->authenticateFromTelegram();
    }
    
    protected function authenticateFromTelegram()
    {
        $authService = app(\App\Services\TelegramAuthService::class);
        
        $initData = request()->query('initData');
        
        if ($initData) {
            $telegramUser = $authService->validateInitData($initData);
            if ($telegramUser) {
                $this->user = $authService->getOrCreateUser($telegramUser);
                return;
            }
        }
        
        $telegramId = request()->query('telegram_id');
        if ($telegramId) {
            $this->user = User::where('telegram_id', $telegramId)->first();
        }
    }
    
    // Calendar Methods
    public function getMonthName(): string
    {
        $months = [
            1 => 'Январь', 2 => 'Февраль', 3 => 'Март', 4 => 'Апрель',
            5 => 'Май', 6 => 'Июнь', 7 => 'Июль', 8 => 'Август',
            9 => 'Сентябрь', 10 => 'Октябрь', 11 => 'Ноябрь', 12 => 'Декабрь',
        ];
        return $months[$this->currentMonth];
    }
    
    public function prevMonth()
    {
        if ($this->currentMonth === 1) {
            $this->currentMonth = 12;
            $this->currentYear--;
        } else {
            $this->currentMonth--;
        }
    }
    
    public function nextMonth()
    {
        if ($this->currentMonth === 12) {
            $this->currentMonth = 1;
            $this->currentYear++;
        } else {
            $this->currentMonth++;
        }
    }
    
    #[Computed]
    public function getCalendarDays(): array
    {
        $firstDay = Carbon::create($this->currentYear, $this->currentMonth, 1);
        $lastDay = $firstDay->copy()->endOfMonth();
        $today = Carbon::now('Asia/Dushanbe')->startOfDay();
        
        // Get first day of week (1=Monday, 7=Sunday)
        $startDayOfWeek = $firstDay->dayOfWeekIso;
        
        $days = [];
        
        // Add empty cells for days before month starts
        for ($i = 1; $i < $startDayOfWeek; $i++) {
            $days[] = null;
        }
        
        // Add all days of month
        for ($day = 1; $day <= $lastDay->day; $day++) {
            $date = Carbon::create($this->currentYear, $this->currentMonth, $day);
            $dateStr = $date->format('Y-m-d');
            
            $days[] = [
                'day' => $day,
                'date' => $dateStr,
                'isToday' => $date->isSameDay($today),
                'isSelected' => $dateStr === $this->date,
                'isPast' => $date->lt($today),
            ];
        }
        
        return $days;
    }
    
    public function selectDate(string $date)
    {
        $this->date = $date;
        $this->startTime = '';
        $this->endTime = '';
    }
    
    // Time Slots
    #[Computed]
    public function getTimeSlots(): array
    {
        $slots = [];
        $now = Carbon::now('Asia/Dushanbe');
        $selectedDate = Carbon::parse($this->date, 'Asia/Dushanbe');
        $isToday = $selectedDate->isSameDay($now);
        
        // Get existing bookings for this car on selected date
        $existingBookings = [];
        $forceBlocks = [];
        
        if ($this->carId) {
            $requestType = RequestType::find($this->requestTypeId);
            $carId = $requestType ? $requestType->car_id : $this->carId;
            
            $dayStart = $selectedDate->copy()->startOfDay()->utc();
            $dayEnd = $selectedDate->copy()->endOfDay()->utc();
            
            $existingBookings = Booking::where('car_id', $carId)
                ->whereIn('status', [BookingStatus::NEW, BookingStatus::APPROVED, BookingStatus::IN_PROGRESS])
                ->where('start_time', '<', $dayEnd)
                ->where('end_time', '>', $dayStart)
                ->get();
            
            $forceBlocks = ForceBlock::where('car_id', $carId)
                ->where('start_time', '<', $dayEnd)
                ->where('end_time', '>', $dayStart)
                ->get();
        }
        
        // Generate slots from 8:00 to 20:00
        for ($hour = 8; $hour < 20; $hour++) {
            for ($minute = 0; $minute < 60; $minute += 30) {
                $time = sprintf('%02d:%02d', $hour, $minute);
                $slotTime = Carbon::parse("{$this->date} {$time}", 'Asia/Dushanbe');
                
                // Skip past times for today
                if ($isToday && $slotTime->lt($now)) {
                    continue;
                }
                
                // Check if blocked
                $isBlocked = false;
                $slotTimeUtc = $slotTime->copy()->utc();
                
                foreach ($existingBookings as $booking) {
                    $bookingStart = Carbon::parse($booking->start_time);
                    $bookingEnd = Carbon::parse($booking->end_time)->addMinutes(30); // 30-min buffer
                    
                    if ($slotTimeUtc->gte($bookingStart) && $slotTimeUtc->lt($bookingEnd)) {
                        $isBlocked = true;
                        break;
                    }
                }
                
                foreach ($forceBlocks as $block) {
                    $blockStart = Carbon::parse($block->start_time);
                    $blockEnd = Carbon::parse($block->end_time);
                    
                    if ($slotTimeUtc->gte($blockStart) && $slotTimeUtc->lt($blockEnd)) {
                        $isBlocked = true;
                        break;
                    }
                }
                
                $slots[] = [
                    'time' => $time,
                    'available' => !$isBlocked,
                    'isSelected' => $time === $this->startTime,
                ];
            }
        }
        
        return $slots;
    }
    
    public function selectTimeSlot(string $time)
    {
        $this->startTime = $time;
        
        // Auto-set end time to +1 hour
        $start = Carbon::parse($time);
        $this->endTime = $start->addHour()->format('H:i');
    }
    
    public function updatedCarId($value)
    {
        if ($value) {
            $this->requestTypes = RequestType::where('car_id', $value)
                ->where('is_active', true)
                ->orderBy('priority', 'desc')
                ->get();
            $this->requestTypeId = '';
        } else {
            $this->requestTypes = [];
        }
    }
    
    public function nextStep()
    {
        if ($this->step === 1) {
            $this->validate([
                'carId' => 'required',
                'requestTypeId' => 'required',
            ]);
        } elseif ($this->step === 2) {
            $this->validate([
                'date' => 'required|date|after_or_equal:today',
                'startTime' => 'required',
                'endTime' => 'required',
            ]);
            
            if ($this->startTime >= $this->endTime) {
                $this->error = 'Время окончания должно быть позже времени начала';
                return;
            }
        }
        
        $this->error = '';
        $this->step++;
    }
    
    public function prevStep()
    {
        $this->step = max(1, $this->step - 1);
    }
    
    public function submit()
    {
        $this->validate();
        
        if (!$this->user) {
            $this->error = 'Не удалось определить пользователя. Откройте приложение через Telegram.';
            return;
        }
        
        try {
            $startTime = Carbon::parse("{$this->date} {$this->startTime}", 'Asia/Dushanbe')
                ->setTimezone('UTC');
            $endTime = Carbon::parse("{$this->date} {$this->endTime}", 'Asia/Dushanbe')
                ->setTimezone('UTC');
            
            $bookingService = app(BookingService::class);
            
            $booking = $bookingService->createBooking(
                userId: $this->user->id,
                requestTypeId: (int) $this->requestTypeId,
                startTime: $startTime,
                endTime: $endTime,
                hasPassengers: $this->hasPassengers,
                hasLuggage: $this->hasLuggage,
                waitMode: $this->waitMode,
                autoApprove: false
            );
            
            $this->success = "Заявка #{$booking->id} успешно создана!";
            $this->step = 4;
            
            $this->dispatch('show-alert', message: $this->success);
            
        } catch (BookingConflictException $e) {
            $this->error = $e->getMessage();
        } catch (\Exception $e) {
            $this->error = 'Произошла ошибка. Попробуйте позже.';
            logger()->error('Booking creation error', ['error' => $e->getMessage()]);
        }
    }
    
    public function closeApp()
    {
        $this->dispatch('close-webapp');
    }
    
    public function render()
    {
        return view('livewire.booking-wizard');
    }
}
