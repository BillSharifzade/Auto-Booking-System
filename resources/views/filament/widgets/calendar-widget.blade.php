<x-filament-widgets::widget>
    <x-filament::section>
        <x-slot name="heading">
            <div class="flex items-center justify-between">
                <span>{{ $this->getMonthName() }}</span>
                <div class="flex gap-1">
                    <x-filament::icon-button
                        icon="heroicon-m-chevron-left"
                        wire:click="prevMonth"
                        size="sm"
                    />
                    <x-filament::icon-button
                        icon="heroicon-m-chevron-right"
                        wire:click="nextMonth"
                        size="sm"
                    />
                </div>
            </div>
        </x-slot>
        
        {{-- Week days header --}}
        <div class="grid grid-cols-7 gap-1 mb-2">
            @foreach(['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] as $day)
                <div class="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-2">
                    {{ $day }}
                </div>
            @endforeach
        </div>
        
        {{-- Calendar grid --}}
        <div class="grid grid-cols-7 gap-1">
            @foreach($this->getCalendarDays() as $day)
                @if($day === null)
                    <div class="aspect-square"></div>
                @else
                    <button
                        wire:click="selectDate('{{ $day['date'] }}')"
                        class="aspect-square p-1 rounded-lg border transition-all relative flex flex-col items-center justify-center
                            {{ $day['isSelected'] ? 'bg-primary-600 text-white border-primary-600' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-primary-500' }}
                            {{ $day['isToday'] && !$day['isSelected'] ? 'ring-2 ring-primary-500' : '' }}
                        "
                    >
                        <span class="text-sm font-medium">{{ $day['day'] }}</span>
                        
                        @if($day['status'])
                            <div class="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                                <div class="w-1.5 h-1.5 rounded-full
                                    {{ $day['status'] === 'force_major' ? 'bg-danger-500' : '' }}
                                    {{ $day['status'] === 'waiting' ? 'bg-warning-500' : '' }}
                                    {{ $day['status'] === 'approved' ? 'bg-success-500' : '' }}
                                "></div>
                            </div>
                        @endif
                        
                        @if($day['bookingCount'] > 0 && !$day['isSelected'])
                            <span class="absolute top-0 right-0 -mt-1 -mr-1 bg-primary-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                {{ $day['bookingCount'] }}
                            </span>
                        @endif
                    </button>
                @endif
            @endforeach
        </div>
        
        {{-- Legend --}}
        <div class="flex gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
            <div class="flex items-center gap-1">
                <div class="w-2 h-2 rounded-full bg-success-500"></div>
                <span>Подтверждено</span>
            </div>
            <div class="flex items-center gap-1">
                <div class="w-2 h-2 rounded-full bg-warning-500"></div>
                <span>Ожидает</span>
            </div>
            <div class="flex items-center gap-1">
                <div class="w-2 h-2 rounded-full bg-danger-500"></div>
                <span>Блокировка</span>
            </div>
        </div>
    </x-filament::section>
</x-filament-widgets::widget>
