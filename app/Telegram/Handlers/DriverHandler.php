<?php

namespace App\Telegram\Handlers;

use App\Enums\BookingStatus;
use App\Enums\UserRole;
use App\Models\Booking;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use SergiX44\Nutgram\Nutgram;
use SergiX44\Nutgram\Telegram\Types\Keyboard\InlineKeyboardButton;
use SergiX44\Nutgram\Telegram\Types\Keyboard\InlineKeyboardMarkup;
use SergiX44\Nutgram\Telegram\Types\Keyboard\KeyboardButton;
use SergiX44\Nutgram\Telegram\Types\Keyboard\ReplyKeyboardMarkup;

class DriverHandler
{
    public function handleDriverMenu(Nutgram $bot): void
    {
        $telegramId = $bot->userId();
        
        $driver = User::where('telegram_id', $telegramId)
            ->where('role', UserRole::DRIVER)
            ->first();

        if (!$driver) {
            $bot->sendMessage('❌ Вы не зарегистрированы как водитель.');
            return;
        }

        $keyboard = ReplyKeyboardMarkup::make(resize_keyboard: true)
            ->addRow(
                KeyboardButton::make('🚗 Текущая поездка')
            )
            ->addRow(
                KeyboardButton::make('📅 Расписание'),
                KeyboardButton::make('📋 Все заявки')
            );

        $bot->sendMessage(
            text: "🚖 *Меню водителя*\n\n" .
                  "Используйте кнопки ниже для управления поездками.",
            parse_mode: 'Markdown',
            reply_markup: $keyboard
        );
    }

    public function handleCurrentTrip(Nutgram $bot): void
    {
        $telegramId = $bot->userId();
        
        $driver = User::where('telegram_id', $telegramId)
            ->where('role', UserRole::DRIVER)
            ->first();

        if (!$driver) {
            $bot->sendMessage('❌ Вы не зарегистрированы как водитель.');
            return;
        }

        $now = Carbon::now();

        // First try to find IN_PROGRESS booking (actively being served)
        $booking = Booking::with(['car', 'user', 'requestType'])
            ->where('driver_id', $driver->id)
            ->where('status', BookingStatus::IN_PROGRESS)
            ->orderBy('start_time', 'desc')
            ->first();

        // If no IN_PROGRESS, check for APPROVED bookings that started
        if (!$booking) {
            $booking = Booking::with(['car', 'user', 'requestType'])
                ->where('driver_id', $driver->id)
                ->where('status', BookingStatus::APPROVED)
                ->where('start_time', '<=', $now)
                ->where('end_time', '>=', $now)
                ->orderBy('start_time')
                ->first();
        }

        if (!$booking) {
            $bot->sendMessage('ℹ️ Сейчас у вас нет активной поездки.');
            return;
        }

        $startLocal = $booking->start_time->timezone('Asia/Dushanbe')->format('d.m.Y H:i');
        $endLocal = $booking->end_time->timezone('Asia/Dushanbe')->format('H:i');

        // Escape Markdown special characters
        $carModel = $this->escapeMarkdown($booking->car->model);
        $clientName = $this->escapeMarkdown($booking->user->full_name);
        $statusValue = $this->escapeMarkdown($booking->status->value);

        $text = "🚗 *Текущая поездка #" . $booking->id . "*\n\n";
        $text .= "📅 *Время:* {$startLocal} — {$endLocal}\n";
        $text .= "🚙 *Автомобиль:* {$carModel}\n";
        $text .= "👤 *Клиент:* {$clientName}\n";
        $text .= "📌 *Статус:* {$statusValue}\n";

        // Add "На месте" or "Завершить поездку" button
        $keyboard = InlineKeyboardMarkup::make();
        if ($booking->status === BookingStatus::APPROVED) {
            $keyboard->addRow(
                InlineKeyboardButton::make(
                    '📍 На месте',
                    callback_data: "driver_arrived:{$booking->id}"
                )
            );
        } elseif ($booking->status === BookingStatus::IN_PROGRESS) {
            $keyboard->addRow(
                InlineKeyboardButton::make(
                    '🏁 Завершить поездку',
                    callback_data: "complete_journey:{$booking->id}"
                )
            );
        }

        $bot->sendMessage(
            text: $text,
            parse_mode: 'Markdown',
            reply_markup: $keyboard->inline_keyboard ? $keyboard : null
        );
    }

    public function handleSchedule(Nutgram $bot): void
    {
        $telegramId = $bot->userId();
        
        $driver = User::where('telegram_id', $telegramId)
            ->where('role', UserRole::DRIVER)
            ->first();

        if (!$driver) {
            $bot->sendMessage('❌ Вы не зарегистрированы как водитель.');
            return;
        }

        $now = Carbon::now();

        $bookings = Booking::with(['car', 'user'])
            ->where('driver_id', $driver->id)
            ->whereIn('status', [BookingStatus::APPROVED, BookingStatus::IN_PROGRESS])
            ->where('start_time', '>=', $now)
            ->orderBy('start_time')
            ->limit(10)
            ->get();

        if ($bookings->isEmpty()) {
            $bot->sendMessage('ℹ️ У вас нет запланированных поездок.');
            return;
        }

        $text = "📅 *Ваше расписание:*\n\n";

        foreach ($bookings as $booking) {
            $startLocal = $booking->start_time->timezone('Asia/Dushanbe')->format('d.m.Y H:i');
            $endLocal = $booking->end_time->timezone('Asia/Dushanbe')->format('H:i');

            $carModel = $this->escapeMarkdown($booking->car->model);
            $clientName = $this->escapeMarkdown($booking->user->full_name);

            $text .= "🚗 *Поездка #{$booking->id}*\n";
            $text .= "📅 {$startLocal} — {$endLocal}\n";
            $text .= "🚙 {$carModel}\n";
            $text .= "👤 {$clientName}\n\n";
        }

        $bot->sendMessage(
            text: $text,
            parse_mode: 'Markdown'
        );
    }

    public function handleAllBookings(Nutgram $bot): void
    {
        $telegramId = $bot->userId();
        
        $driver = User::where('telegram_id', $telegramId)
            ->where('role', UserRole::DRIVER)
            ->first();

        if (!$driver) {
            $bot->sendMessage('❌ Вы не зарегистрированы как водитель.');
            return;
        }

        $bookings = Booking::with(['car', 'user'])
            ->where('driver_id', $driver->id)
            ->whereIn('status', [BookingStatus::NEW, BookingStatus::APPROVED, BookingStatus::IN_PROGRESS])
            ->orderBy('start_time')
            ->limit(10)
            ->get();

        if ($bookings->isEmpty()) {
            $bot->sendMessage('ℹ️ У вас сейчас нет активных заявок.');
            return;
        }

        foreach ($bookings as $booking) {
            $startLocal = $booking->start_time->timezone('Asia/Dushanbe')->format('d.m.Y H:i');
            $endLocal = $booking->end_time->timezone('Asia/Dushanbe')->format('H:i');

            $carModel = $this->escapeMarkdown($booking->car->model);
            $clientName = $this->escapeMarkdown($booking->user->full_name);
            $statusValue = $this->escapeMarkdown($booking->status->value);

            $text = "🚗 *Заявка #{$booking->id}*\n\n";
            $text .= "📅 *Время:* {$startLocal} — {$endLocal}\n";
            $text .= "🚙 *Автомобиль:* {$carModel}\n";
            $text .= "👤 *Клиент:* {$clientName}\n";
            $text .= "📌 *Статус:* {$statusValue}\n";

            $keyboard = InlineKeyboardMarkup::make();
            if ($booking->status === BookingStatus::APPROVED || $booking->status === BookingStatus::NEW) {
                $keyboard->addRow(
                    InlineKeyboardButton::make(
                        '📍 На месте',
                        callback_data: "driver_arrived:{$booking->id}"
                    )
                );
            } elseif ($booking->status === BookingStatus::IN_PROGRESS) {
                $keyboard->addRow(
                    InlineKeyboardButton::make(
                        '🏁 Завершить поездку',
                        callback_data: "complete_journey:{$booking->id}"
                    )
                );
            }

            $bot->sendMessage(
                text: $text,
                parse_mode: 'Markdown',
                reply_markup: $keyboard->inline_keyboard ? $keyboard : null
            );
        }
    }

    public function handleArrived(Nutgram $bot): void
    {
        // Always answer ASAP to avoid "loading" state in Telegram UI.
        try {
            $bot->answerCallbackQuery(null, '✅ Принято');
        } catch (\Throwable $e) {
            Log::warning('answerCallbackQuery failed (arrived)', ['exception' => $e]);
        }

        try {
            $data = (string)($bot->callbackQuery()?->data ?? '');
            Log::info('Driver arrived callback received', ['data' => $data]);
            $parts = explode(':', $data, 2);
            $bookingId = isset($parts[1]) ? (int)$parts[1] : 0;

            if ($bookingId <= 0) {
                try {
                    $bot->answerCallbackQuery(null, '❌ Некорректные данные', true);
                } catch (\Throwable $e) {
                    Log::warning('answerCallbackQuery failed (invalid arrived data)', ['exception' => $e]);
                }
                return;
            }

            $telegramId = $bot->userId();
            $driver = User::where('telegram_id', $telegramId)
                ->where('role', UserRole::DRIVER)
                ->first();

            if (!$driver) {
                try {
                    $bot->answerCallbackQuery(null, '❌ У вас нет прав водителя', true);
                } catch (\Throwable $e) {
                    Log::warning('answerCallbackQuery failed (not driver)', ['exception' => $e]);
                }
                return;
            }

            /** @var Booking|null $booking */
            $booking = DB::transaction(function () use ($bookingId, $driver) {
                $booking = Booking::with(['user', 'car'])
                    ->lockForUpdate()
                    ->find($bookingId);

                if (!$booking || (int)$booking->driver_id !== (int)$driver->id) {
                    return null;
                }

                if ($booking->status !== BookingStatus::APPROVED && $booking->status !== BookingStatus::NEW) {
                    return $booking; // no-op, but return to allow UI update
                }

                $oldStatus = $booking->status;
                $booking->status = BookingStatus::IN_PROGRESS;
                $booking->save();

                $booking->statusHistory()->create([
                    'old_status' => $oldStatus,
                    'new_status' => BookingStatus::IN_PROGRESS,
                    'changed_by_user_id' => $driver->id,
                    'reason' => 'Driver arrived',
                ]);

                return $booking;
            });

            if (!$booking) {
                try {
                    $bot->answerCallbackQuery(null, '❌ Заявка не найдена', true);
                } catch (\Throwable $e) {
                    Log::warning('answerCallbackQuery failed (booking not found)', ['exception' => $e]);
                }
                return;
            }

            // Notify client (plain text to avoid Markdown parse failures).
            if ($booking->user && $booking->user->telegram_id) {
                $startLocal = $booking->start_time?->timezone('Asia/Dushanbe')->format('d.m.Y H:i') ?? '';
                $carModel = $booking->car?->model ?? '—';
                $driverName = $driver->full_name ?? '—';
                $driverPhone = $driver->phone_number ?? '—';

                $clientMessage = "🚗 Водитель прибыл!\n\n";
                $clientMessage .= "Заявка #{$booking->id}\n";
                if ($startLocal !== '') {
                    $clientMessage .= "📅 Время: {$startLocal}\n";
                }
                $clientMessage .= "🚙 Автомобиль: {$carModel}\n";
                $clientMessage .= "👤 Водитель: {$driverName}\n";
                $clientMessage .= "📞 Телефон: {$driverPhone}\n\n";
                $clientMessage .= "⏰ Пожалуйста, выходите.";

                try {
                    $bot->sendMessage(
                        chat_id: $booking->user->telegram_id,
                        text: $clientMessage
                    );
                } catch (\Throwable $e) {
                    Log::error('Failed to notify booking user about arrival', [
                        'booking_id' => $booking->id,
                        'user_id' => $booking->user_id,
                        'exception' => $e,
                    ]);
                }
            }

            // Update the message where the button was pressed.
            $message = $bot->callbackQuery()?->message;
            if ($message?->message_id) {
                $keyboard = InlineKeyboardMarkup::make()
                    ->addRow(
                        InlineKeyboardButton::make(
                            '🏁 Завершить поездку',
                            callback_data: "complete_journey:{$booking->id}"
                        )
                    );

                $bot->editMessageReplyMarkup(
                    chat_id: $message->chat->id,
                    message_id: $message->message_id,
                    reply_markup: $keyboard
                );
            }
        } catch (\Throwable $e) {
            Log::error('Driver arrived handler failed', ['exception' => $e]);
            try {
                $bot->answerCallbackQuery(null, '❌ Ошибка. Попробуйте ещё раз.', true);
            } catch (\Throwable $e2) {
                Log::warning('answerCallbackQuery failed (arrived handler error)', ['exception' => $e2]);
            }
        }
    }

    public function handleCompleteJourney(Nutgram $bot): void
    {
        try {
            $bot->answerCallbackQuery(null, '🏁 Завершаем…');
        } catch (\Throwable $e) {
            Log::warning('answerCallbackQuery failed (complete)', ['exception' => $e]);
        }

        try {
            $data = (string)($bot->callbackQuery()?->data ?? '');
            Log::info('Complete journey callback received', ['data' => $data]);
            $parts = explode(':', $data, 2);
            $bookingId = isset($parts[1]) ? (int)$parts[1] : 0;

            if ($bookingId <= 0) {
                try {
                    $bot->answerCallbackQuery(null, '❌ Некорректные данные', true);
                } catch (\Throwable $e) {
                    Log::warning('answerCallbackQuery failed (invalid complete data)', ['exception' => $e]);
                }
                return;
            }

            $telegramId = $bot->userId();
            $driver = User::where('telegram_id', $telegramId)
                ->where('role', UserRole::DRIVER)
                ->first();

            if (!$driver) {
                try {
                    $bot->answerCallbackQuery(null, '❌ У вас нет прав водителя', true);
                } catch (\Throwable $e) {
                    Log::warning('answerCallbackQuery failed (complete not driver)', ['exception' => $e]);
                }
                return;
            }

            /** @var Booking|null $booking */
            $booking = DB::transaction(function () use ($bookingId, $driver) {
                $booking = Booking::lockForUpdate()->find($bookingId);
                if (!$booking || (int)$booking->driver_id !== (int)$driver->id) {
                    return null;
                }

                if ($booking->status !== BookingStatus::IN_PROGRESS) {
                    return $booking;
                }

                $oldStatus = $booking->status;
                $booking->status = BookingStatus::COMPLETED;
                $booking->save();

                $booking->statusHistory()->create([
                    'old_status' => $oldStatus,
                    'new_status' => BookingStatus::COMPLETED,
                    'changed_by_user_id' => $driver->id,
                    'reason' => 'Driver completed journey',
                ]);

                return $booking;
            });

            if (!$booking) {
                try {
                    $bot->answerCallbackQuery(null, '❌ Заявка не найдена', true);
                } catch (\Throwable $e) {
                    Log::warning('answerCallbackQuery failed (complete booking not found)', ['exception' => $e]);
                }
                return;
            }

            $message = $bot->callbackQuery()?->message;
            if ($message?->message_id) {
                // Remove buttons (set reply_markup = null)
                $bot->editMessageReplyMarkup(
                    chat_id: $message->chat->id,
                    message_id: $message->message_id,
                    reply_markup: null
                );
            }

            $bot->sendMessage("✅ Поездка #{$booking->id} завершена.");
        } catch (\Throwable $e) {
            Log::error('Driver complete journey handler failed', ['exception' => $e]);
            try {
                $bot->answerCallbackQuery(null, '❌ Ошибка. Попробуйте ещё раз.', true);
            } catch (\Throwable $e2) {
                Log::warning('answerCallbackQuery failed (complete handler error)', ['exception' => $e2]);
            }
        }
    }

    /**
     * Escape Markdown special characters to prevent parsing errors
     */
    private function escapeMarkdown(string $text): string
    {
        $specialChars = ['_', '*', '[', ']', '(', ')', '~', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!'];
        foreach ($specialChars as $char) {
            $text = str_replace($char, '\\' . $char, $text);
        }
        return $text;
    }
}
