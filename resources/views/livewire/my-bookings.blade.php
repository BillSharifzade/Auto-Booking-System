<div>
    <!-- Header -->
    <div class="header">
        <h1>📋 Мои заявки</h1>
        <p>Всего заявок: {{ count($bookings) }}</p>
    </div>
    
    @if($error)
        <div class="alert alert-error">{{ $error }}</div>
    @endif
    
    @if($success)
        <div class="alert alert-success">{{ $success }}</div>
    @endif
    
    @if(!$user)
        <div class="card">
            <div class="empty-state">
                <div class="icon">🔐</div>
                <p>Откройте приложение через Telegram</p>
                <span class="hint">Для просмотра заявок требуется авторизация</span>
            </div>
        </div>
    @else
        <!-- Tabs -->
        <div class="tabs">
            <button wire:click="setActiveTab('active')" class="tab {{ $activeTab === 'active' ? 'active' : '' }}">
                Активные
            </button>
            <button wire:click="setActiveTab('history')" class="tab {{ $activeTab === 'history' ? 'active' : '' }}">
                История
            </button>
        </div>
        
        <div style="padding: 0 16px;">
            @if(count($bookings) === 0)
                <div class="empty-state">
                    <div class="icon">📋</div>
                    <p>{{ $activeTab === 'active' ? 'Нет активных заявок' : 'История пуста' }}</p>
                    <span class="hint">
                        @if($activeTab === 'active')
                            Создайте первую заявку на главной
                        @else
                            Здесь будут отображаться завершенные заявки
                        @endif
                    </span>
                </div>
            @else
                @foreach($bookings as $index => $booking)
                    <div class="booking-item animate-fade-in" style="animation-delay: {{ $index * 0.05 }}s;">
                        <div class="booking-header">
                            <div>
                                <div class="booking-id">Заявка #{{ $booking->id }}</div>
                                <div class="booking-date">
                                    {{ $booking->start_time->timezone('Asia/Dushanbe')->locale('ru')->isoFormat('D MMMM YYYY') }}
                                </div>
                            </div>
                            <span class="badge badge-{{ strtolower($booking->status->value) }}">
                                {{ match($booking->status) {
                                    App\Enums\BookingStatus::NEW => 'Новая',
                                    App\Enums\BookingStatus::APPROVED => 'Подтверждена',
                                    App\Enums\BookingStatus::IN_PROGRESS => 'В процессе',
                                    App\Enums\BookingStatus::COMPLETED => 'Завершена',
                                    App\Enums\BookingStatus::DECLINED => 'Отклонена',
                                    App\Enums\BookingStatus::CANCELED => 'Отменена',
                                } }}
                            </span>
                        </div>
                        
                        <div class="booking-details">
                            <div class="detail-row">
                                <span>🚗</span>
                                <span>{{ $booking->car->model }} ({{ $booking->car->license_plate }})</span>
                            </div>
                            <div class="detail-row">
                                <span>⏱️</span>
                                <span>
                                    {{ $booking->start_time->timezone('Asia/Dushanbe')->format('H:i') }}
                                    —
                                    {{ $booking->end_time->timezone('Asia/Dushanbe')->format('H:i') }}
                                </span>
                            </div>
                            @if($booking->driver)
                            <div class="detail-row">
                                <span>👤</span>
                                <span>Водитель: {{ $booking->driver->full_name ?? $booking->driver->username }}</span>
                            </div>
                            @endif
                            @if($booking->has_passengers)
                            <div class="detail-row">
                                <span>👥</span>
                                <span>С пассажирами</span>
                            </div>
                            @endif
                            @if($booking->has_luggage)
                            <div class="detail-row">
                                <span>🧳</span>
                                <span>С багажом</span>
                            </div>
                            @endif
                        </div>
                        
                        @if($booking->rejection_reason)
                            <div class="alert alert-error" style="margin: 12px 0 0 0;">
                                <strong>Причина:</strong> {{ $booking->rejection_reason }}
                            </div>
                        @endif
                        
                        @if($booking->canBeCanceled())
                            <button 
                                wire:click="cancelBooking({{ $booking->id }})" 
                                wire:confirm="Вы уверены, что хотите отменить эту заявку?"
                                class="btn btn-outline btn-cancel"
                            >
                                ❌ Отменить заявку
                            </button>
                        @endif
                    </div>
                @endforeach
            @endif
        </div>
        
        <div style="padding: 16px;">
            <a href="/booking" class="btn btn-primary" style="text-decoration: none;">
                ➕ Новая заявка
            </a>
        </div>
    @endif
    
    <!-- Bottom Navigation -->
    <nav class="bottom-nav">
        <a href="/booking" class="nav-item">
            <span class="icon">🏠</span>
            <span class="label">Главная</span>
        </a>
        <a href="/bookings" class="nav-item active">
            <span class="icon">📋</span>
            <span class="label">Мои заявки</span>
        </a>
    </nav>
</div>
