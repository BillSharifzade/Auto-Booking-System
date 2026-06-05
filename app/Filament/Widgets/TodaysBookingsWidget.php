<?php

namespace App\Filament\Widgets;

use App\Enums\BookingStatus;
use App\Models\Booking;
use Carbon\Carbon;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Widgets\TableWidget as BaseWidget;
use Illuminate\Database\Eloquent\Builder;

class TodaysBookingsWidget extends BaseWidget
{
    protected static ?int $sort = 3;
    
    protected int|string|array $columnSpan = 'full';
    
    protected static ?string $heading = 'Заявки на сегодня';
    
    public function table(Table $table): Table
    {
        $todayStart = now()->startOfDay();
        $todayEnd = now()->endOfDay();
        
        return $table
            ->query(
                Booking::query()
                    ->with(['user', 'car', 'driver', 'requestType'])
                    ->where('start_time', '>=', $todayStart)
                    ->where('start_time', '<=', $todayEnd)
                    ->orderBy('start_time')
            )
            ->columns([
                Tables\Columns\TextColumn::make('start_time')
                    ->label('Время')
                    ->dateTime('H:i')
                    ->timezone('Asia/Dushanbe')
                    ->sortable(),
                    
                Tables\Columns\TextColumn::make('end_time')
                    ->label('До')
                    ->dateTime('H:i')
                    ->timezone('Asia/Dushanbe'),
                    
                Tables\Columns\TextColumn::make('user.full_name')
                    ->label('Клиент')
                    ->searchable(),
                    
                Tables\Columns\TextColumn::make('car.model')
                    ->label('Авто')
                    ->searchable(),
                    
                Tables\Columns\TextColumn::make('driver.full_name')
                    ->label('Водитель')
                    ->placeholder('Не назначен'),
                    
                Tables\Columns\TextColumn::make('status')
                    ->label('Статус')
                    ->badge()
                    ->formatStateUsing(fn (BookingStatus $state): string => match ($state) {
                        BookingStatus::NEW => 'Новая',
                        BookingStatus::APPROVED => 'Подтверждена',
                        BookingStatus::IN_PROGRESS => 'В процессе',
                        BookingStatus::COMPLETED => 'Завершена',
                        BookingStatus::DECLINED => 'Отклонена',
                        BookingStatus::CANCELED => 'Отменена',
                    })
                    ->color(fn (BookingStatus $state): string => match ($state) {
                        BookingStatus::NEW => 'warning',
                        BookingStatus::APPROVED => 'success',
                        BookingStatus::IN_PROGRESS => 'info',
                        BookingStatus::COMPLETED => 'gray',
                        BookingStatus::DECLINED => 'danger',
                        BookingStatus::CANCELED => 'gray',
                    }),
            ])
            ->actions([
                Tables\Actions\Action::make('approve')
                    ->label('Принять')
                    ->icon('heroicon-o-check')
                    ->color('success')
                    ->visible(fn (Booking $record) => $record->status === BookingStatus::NEW)
                    ->action(function (Booking $record) {
                        $record->update(['status' => BookingStatus::APPROVED]);
                        $record->statusHistory()->create([
                            'old_status' => BookingStatus::NEW,
                            'new_status' => BookingStatus::APPROVED,
                            'changed_by_user_id' => auth()->id(),
                            'reason' => 'Подтверждено администратором',
                        ]);
                    }),
                    
                Tables\Actions\Action::make('decline')
                    ->label('Отклонить')
                    ->icon('heroicon-o-x-mark')
                    ->color('danger')
                    ->visible(fn (Booking $record) => $record->status === BookingStatus::NEW)
                    ->requiresConfirmation()
                    ->action(function (Booking $record) {
                        $record->update([
                            'status' => BookingStatus::DECLINED,
                            'rejection_reason' => 'Отклонено администратором',
                        ]);
                        $record->statusHistory()->create([
                            'old_status' => BookingStatus::NEW,
                            'new_status' => BookingStatus::DECLINED,
                            'changed_by_user_id' => auth()->id(),
                            'reason' => 'Отклонено администратором',
                        ]);
                    }),
            ])
            ->emptyStateHeading('Нет заявок на сегодня')
            ->emptyStateDescription('Заявки на текущий день будут отображаться здесь')
            ->emptyStateIcon('heroicon-o-calendar');
    }
}
