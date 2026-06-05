<?php

namespace App\Livewire;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\User;
use Livewire\Attributes\Layout;
use Livewire\Component;

#[Layout('components.layouts.app')]
class MyBookings extends Component
{
    public $bookings = [];
    public $user = null;
    public $success = '';
    public $error = '';
    public $activeTab = 'active';
    
    public function mount()
    {
        $this->authenticateFromTelegram();
        $this->loadBookings();
    }
    
    protected function authenticateFromTelegram()
    {
        $authService = app(\App\Services\TelegramAuthService::class);
        
        // First try initData from query (passed by JS)
        $initData = request()->query('initData');
        
        if ($initData) {
            $telegramUser = $authService->validateInitData($initData);
            if ($telegramUser) {
                $this->user = $authService->getOrCreateUser($telegramUser);
                return;
            }
        }
        
        // Fallback: telegram_id for development/testing
        $telegramId = request()->query('telegram_id');
        if ($telegramId) {
            $this->user = User::where('telegram_id', $telegramId)->first();
        }
    }
    
    public function loadBookings()
    {
        if (!$this->user) {
            return;
        }
        
        $query = Booking::with(['car', 'requestType', 'driver'])
            ->where('user_id', $this->user->id)
            ->orderBy('start_time', 'desc');
        
        if ($this->activeTab === 'active') {
            $query->whereIn('status', [
                BookingStatus::NEW,
                BookingStatus::APPROVED,
                BookingStatus::IN_PROGRESS,
            ]);
        } else {
            $query->whereIn('status', [
                BookingStatus::COMPLETED,
                BookingStatus::DECLINED,
                BookingStatus::CANCELED,
            ]);
        }
        
        $this->bookings = $query->limit(20)->get();
    }
    
    public function setActiveTab($tab)
    {
        $this->activeTab = $tab;
        $this->loadBookings();
    }
    
    public function cancelBooking($bookingId)
    {
        $booking = Booking::find($bookingId);
        
        if (!$booking || $booking->user_id !== $this->user->id) {
            $this->error = 'Заявка не найдена';
            return;
        }
        
        if (!$booking->canBeCanceled()) {
            $this->error = 'Эту заявку нельзя отменить';
            return;
        }
        
        $oldStatus = $booking->status;
        $booking->status = BookingStatus::CANCELED;
        $booking->rejection_reason = 'Отменена клиентом';
        $booking->save();
        
        $booking->statusHistory()->create([
            'old_status' => $oldStatus,
            'new_status' => BookingStatus::CANCELED,
            'changed_by_user_id' => $this->user->id,
            'reason' => 'Отменена клиентом через приложение',
        ]);
        
        $this->success = 'Заявка успешно отменена';
        $this->loadBookings();
    }
    
    public function render()
    {
        return view('livewire.my-bookings');
    }
}
