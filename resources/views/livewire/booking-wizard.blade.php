<div>
    <!-- Header -->
    <div class="header">
        <h1>🚗 Бронирование</h1>
        <p>{{ $step === 4 ? 'Заявка создана' : "Шаг {$step} из 3" }}</p>
    </div>
    
    <!-- Step Indicator -->
    @if($step < 4)
    <div class="step-indicator">
        <div class="step-dot {{ $step >= 1 ? ($step > 1 ? 'completed' : 'active') : '' }}"></div>
        <div class="step-dot {{ $step >= 2 ? ($step > 2 ? 'completed' : 'active') : '' }}"></div>
        <div class="step-dot {{ $step >= 3 ? 'active' : '' }}"></div>
    </div>
    @endif
    
    @if($error)
        <div class="alert alert-error">{{ $error }}</div>
    @endif
    
    @if($step === 1)
        <!-- Step 1: Select Car & Request Type -->
        <div class="card animate-fade-in">
            <div class="card-title">🚙 Выберите автомобиль</div>
            
            <div class="form-group">
                <label>Автомобиль</label>
                <select wire:model.live="carId" class="form-control">
                    <option value="">-- Выберите автомобиль --</option>
                    @foreach($cars as $car)
                        <option value="{{ $car->id }}">{{ $car->model }} ({{ $car->license_plate }})</option>
                    @endforeach
                </select>
            </div>
            
            @if(count($requestTypes) > 0)
                <div class="form-group">
                    <label>Тип заявки</label>
                    <select wire:model="requestTypeId" class="form-control">
                        <option value="">-- Выберите тип --</option>
                        @foreach($requestTypes as $type)
                            <option value="{{ $type->id }}">{{ $type->title }} (приоритет: {{ $type->priority }})</option>
                        @endforeach
                    </select>
                </div>
            @endif
        </div>
        
        <div style="padding: 0 16px;">
            <button wire:click="nextStep" class="btn btn-primary" @if(!$carId || !$requestTypeId) disabled @endif>
                Далее →
            </button>
        </div>
        
    @elseif($step === 2)
        <!-- Step 2: Date & Time -->
        
        <!-- Calendar -->
        <div class="calendar animate-fade-in">
            <div class="calendar-header">
                <button wire:click="prevMonth">‹</button>
                <h3>{{ $this->getMonthName() }} {{ $this->currentYear }}</h3>
                <button wire:click="nextMonth">›</button>
            </div>
            <div class="calendar-weekdays">
                <span>Пн</span>
                <span>Вт</span>
                <span>Ср</span>
                <span>Чт</span>
                <span>Пт</span>
                <span>Сб</span>
                <span>Вс</span>
            </div>
            <div class="calendar-days">
                @foreach($this->getCalendarDays() as $day)
                    @if($day === null)
                        <div class="calendar-day"></div>
                    @else
                        <button 
                            wire:click="selectDate('{{ $day['date'] }}')"
                            class="calendar-day {{ $day['isToday'] ? 'today' : '' }} {{ $day['isSelected'] ? 'selected' : '' }} {{ $day['isPast'] ? 'disabled' : '' }}"
                            @if($day['isPast']) disabled @endif
                        >
                            {{ $day['day'] }}
                        </button>
                    @endif
                @endforeach
            </div>
        </div>
        
        <!-- Time Slots -->
        <p class="section-title">
            Доступные слоты на {{ \Carbon\Carbon::parse($date)->locale('ru')->isoFormat('D MMMM YYYY') }}
        </p>
        
        <div class="time-slots animate-fade-in">
            @foreach($this->getTimeSlots() as $slot)
                <button 
                    wire:click="selectTimeSlot('{{ $slot['time'] }}')"
                    class="time-slot {{ $slot['isSelected'] ? 'selected' : '' }} {{ !$slot['available'] ? 'disabled' : 'available' }}"
                    @if(!$slot['available']) disabled @endif
                >
                    {{ $slot['time'] }}
                </button>
            @endforeach
        </div>
        
        @if($startTime)
        <div class="card animate-fade-in">
            <div class="card-title">⏰ Время поездки</div>
            <div class="form-group">
                <label>Время окончания</label>
                <input type="time" wire:model="endTime" class="form-control" min="{{ $startTime }}">
            </div>
        </div>
        @endif
        
        <div style="padding: 0 16px; display: flex; gap: 8px;">
            <button wire:click="prevStep" class="btn btn-secondary" style="flex: 1;">← Назад</button>
            <button wire:click="nextStep" class="btn btn-primary" style="flex: 2;" @if(!$startTime || !$endTime) disabled @endif>Далее →</button>
        </div>
        
    @elseif($step === 3)
        <!-- Step 3: Options -->
        <div class="card animate-fade-in">
            <div class="card-title">⚙️ Дополнительно</div>
            
            <div class="form-group">
                <label>Опции</label>
                <div class="checkbox-group">
                    <label class="checkbox-item">
                        <input type="checkbox" wire:model="hasPassengers">
                        <span>👥 Пассажиры</span>
                    </label>
                    <label class="checkbox-item">
                        <input type="checkbox" wire:model="hasLuggage">
                        <span>🧳 Багаж</span>
                    </label>
                </div>
            </div>
            
            <div class="form-group">
                <label>Режим ожидания</label>
                <div class="radio-group">
                    <label class="radio-item">
                        <input type="radio" wire:model="waitMode" value="WAIT_ON_SITE">
                        <span>Водитель ждет на месте</span>
                    </label>
                    <label class="radio-item">
                        <input type="radio" wire:model="waitMode" value="RETURN_AT_TIME">
                        <span>Водитель возвращается</span>
                    </label>
                </div>
            </div>
        </div>
        
        <div class="card animate-fade-in">
            <div class="card-title">📋 Подтверждение</div>
            <div class="booking-details">
                <div class="detail-row">
                    <span>📅</span>
                    <span><strong>Дата:</strong> {{ \Carbon\Carbon::parse($date)->locale('ru')->isoFormat('D MMMM YYYY') }}</span>
                </div>
                <div class="detail-row">
                    <span>🕐</span>
                    <span><strong>Время:</strong> {{ $startTime }} — {{ $endTime }}</span>
                </div>
                @if($hasPassengers)
                <div class="detail-row">
                    <span>👥</span>
                    <span>С пассажирами</span>
                </div>
                @endif
                @if($hasLuggage)
                <div class="detail-row">
                    <span>🧳</span>
                    <span>С багажом</span>
                </div>
                @endif
            </div>
        </div>
        
        <div style="padding: 0 16px; display: flex; gap: 8px;">
            <button wire:click="prevStep" class="btn btn-secondary" style="flex: 1;">← Назад</button>
            <button wire:click="submit" class="btn btn-primary" style="flex: 2;">✅ Создать заявку</button>
        </div>
        
    @elseif($step === 4)
        <!-- Success -->
        <div class="success-screen animate-fade-in">
            <div class="icon">✅</div>
            <h2>Заявка создана!</h2>
            <p>Ваша заявка была успешно отправлена. Вы получите уведомление, когда она будет подтверждена.</p>
            <button wire:click="closeApp" class="btn btn-primary">Закрыть</button>
        </div>
    @endif
    
    <!-- Bottom Navigation -->
    <nav class="bottom-nav">
        <a href="/booking" class="nav-item active">
            <span class="icon">🏠</span>
            <span class="label">Главная</span>
        </a>
        <a href="/bookings" class="nav-item">
            <span class="icon">📋</span>
            <span class="label">Мои заявки</span>
        </a>
    </nav>
</div>
