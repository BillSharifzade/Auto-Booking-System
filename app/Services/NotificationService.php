<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use SergiX44\Nutgram\Nutgram;

class NotificationService
{
    /**
     * Notify driver about a new booking assignment
     */
    public function notifyDriverNewBooking(Booking $booking, Nutgram $bot): void
    {
        if (!$booking->driver || !$booking->driver->telegram_id) {
            return;
        }

        try {
            $startLocal = $this->escapeMarkdown($booking->start_time->timezone('Asia/Dushanbe')->format('d.m.Y H:i'));
            $endLocal = $this->escapeMarkdown($booking->end_time->timezone('Asia/Dushanbe')->format('H:i'));
            
            $carModel = $this->escapeMarkdown($booking->car->model);
            $clientName = $this->escapeMarkdown($booking->user->full_name);
            
            $message = "🚗 *Новая заявка \\#{$booking->id}*\n\n";
            $message .= "Вам назначена новая поездка\\.\n\n";
            $message .= "📅 *Время:* {$startLocal} — {$endLocal}\n";
            $message .= "🚙 *Автомобиль:* {$carModel}\n";
            $message .= "👤 *Клиент:* {$clientName}\n";
            $message .= "📌 *Статус:* Новая заявка\n\n";
            $message .= "⏰ Пожалуйста, будьте готовы к поездке\\.";

            $bot->sendMessage(
                text: $message,
                chat_id: $booking->driver->telegram_id,
                parse_mode: 'MarkdownV2'
            );

            Log::info("Notified driver {$booking->driver->id} about new booking {$booking->id}");
        } catch (\Exception $e) {
            Log::error("Failed to notify driver about new booking: " . $e->getMessage());
        }
    }

    /**
     * Notify driver about booking approval
     */
    public function notifyDriverBookingApproved(Booking $booking, Nutgram $bot): void
    {
        if (!$booking->driver || !$booking->driver->telegram_id) {
            return;
        }

        try {
            $startLocal = $this->escapeMarkdown($booking->start_time->timezone('Asia/Dushanbe')->format('d.m.Y H:i'));
            $endLocal = $this->escapeMarkdown($booking->end_time->timezone('Asia/Dushanbe')->format('H:i'));
            
            $carModel = $this->escapeMarkdown($booking->car->model);
            $clientName = $this->escapeMarkdown($booking->user->full_name);
            
            $message = "✅ *Заявка \\#{$booking->id} одобрена\\!*\n\n";
            $message .= "Ваша поездка подтверждена\\.\n\n";
            $message .= "📅 *Время:* {$startLocal} — {$endLocal}\n";
            $message .= "🚙 *Автомобиль:* {$carModel}\n";
            $message .= "👤 *Клиент:* {$clientName}\n\n";
            $message .= "🔔 Не забудьте прибыть вовремя\\!";

            $keyboard = \SergiX44\Nutgram\Telegram\Types\Keyboard\InlineKeyboardMarkup::make()
                ->addRow(
                    \SergiX44\Nutgram\Telegram\Types\Keyboard\InlineKeyboardButton::make(
                        '📍 На месте',
                        callback_data: "driver_arrived:{$booking->id}"
                    )
                );

            $bot->sendMessage(
                text: $message,
                chat_id: $booking->driver->telegram_id,
                parse_mode: 'MarkdownV2',
                reply_markup: $keyboard
            );

            Log::info("Notified driver {$booking->driver->id} about booking approval {$booking->id}");
        } catch (\Exception $e) {
            Log::error("Failed to notify driver about booking approval: " . $e->getMessage());
        }
    }

    /**
     * Notify driver about booking decline
     */
    public function notifyDriverBookingDeclined(Booking $booking, string $reason, Nutgram $bot): void
    {
        if (!$booking->driver || !$booking->driver->telegram_id) {
            return;
        }

        try {
            $startLocal = $this->escapeMarkdown($booking->start_time->timezone('Asia/Dushanbe')->format('d.m.Y H:i'));
            
            $carModel = $this->escapeMarkdown($booking->car->model);
            $reasonEscaped = $this->escapeMarkdown($reason);
            
            $message = "❌ *Заявка \\#{$booking->id} отклонена*\n\n";
            $message .= "📅 *Время:* {$startLocal}\n";
            $message .= "🚙 *Автомобиль:* {$carModel}\n\n";
            $message .= "📝 *Причина:* {$reasonEscaped}";

            $bot->sendMessage(
                text: $message,
                chat_id: $booking->driver->telegram_id,
                parse_mode: 'MarkdownV2'
            );

            Log::info("Notified driver {$booking->driver->id} about booking decline {$booking->id}");
        } catch (\Exception $e) {
            Log::error("Failed to notify driver about booking decline: " . $e->getMessage());
        }
    }

    /**
     * Notify driver about booking cancellation
     */
    public function notifyDriverBookingCanceled(Booking $booking, string $canceledBy, Nutgram $bot, ?string $reason = null): void
    {
        if (!$booking->driver || !$booking->driver->telegram_id) {
            return;
        }

        try {
            $startLocal = $this->escapeMarkdown($booking->start_time->timezone('Asia/Dushanbe')->format('d.m.Y H:i'));

            $carModel = $this->escapeMarkdown($booking->car->model);
            $clientName = $this->escapeMarkdown($booking->user->full_name);
            $canceledByText = $canceledBy === 'administrator' ? 'Администратор отменил поездку' : 'Клиент отменил поездку';

            $message = "🚫 *Заявка \\#{$booking->id} отменена*\n\n";
            $message .= "{$canceledByText}\\.\n\n";
            $message .= "📅 *Время:* {$startLocal}\n";
            $message .= "🚙 *Автомобиль:* {$carModel}\n";
            $message .= "👤 *Клиент:* {$clientName}\n";
            if ($reason !== null && trim($reason) !== '') {
                $reasonEscaped = $this->escapeMarkdown($reason);
                $message .= "📝 *Причина:* {$reasonEscaped}\n";
            }
            $message .= "\nℹ️ Вы освобождены от этой поездки\\.";

            $bot->sendMessage(
                text: $message,
                chat_id: $booking->driver->telegram_id,
                parse_mode: 'MarkdownV2'
            );

            Log::info("Notified driver {$booking->driver->id} about booking cancellation {$booking->id}");
        } catch (\Exception $e) {
            Log::error("Failed to notify driver about booking cancellation: " . $e->getMessage());
        }
    }

    /**
     * Notify driver about booking deletion
     */
    public function notifyDriverBookingDeleted(Booking $booking, Nutgram $bot): void
    {
        if (!$booking->driver || !$booking->driver->telegram_id) {
            return;
        }

        try {
            $startLocal = $this->escapeMarkdown($booking->start_time->timezone('Asia/Dushanbe')->format('d.m.Y H:i'));
            
            $carModel = $this->escapeMarkdown($booking->car->model);
            
            $message = "⚠️ *Заявка \\#{$booking->id} удалена*\n\n";
            $message .= "Администратор удалил заявку\\.\n\n";
            $message .= "📅 *Время:* {$startLocal}\n";
            $message .= "🚙 *Автомобиль:* {$carModel}\n\n";
            $message .= "ℹ️ Вы освобождены от этой поездки\\.";

            $bot->sendMessage(
                text: $message,
                chat_id: $booking->driver->telegram_id,
                parse_mode: 'MarkdownV2'
            );

            Log::info("Notified driver {$booking->driver->id} about booking deletion {$booking->id}");
        } catch (\Exception $e) {
            Log::error("Failed to notify driver about booking deletion: " . $e->getMessage());
        }
    }

    /**
     * Notify the client (booking owner) that their booking was declined, with reason.
     */
    public function notifyClientBookingDeclined(Booking $booking, string $reason, Nutgram $bot): void
    {
        if (!$booking->user || !$booking->user->telegram_id) {
            return;
        }

        try {
            $startLocal = $this->escapeMarkdown($booking->start_time->timezone('Asia/Dushanbe')->format('d.m.Y H:i'));

            $carModel = $this->escapeMarkdown($booking->car->model ?? '—');
            $reasonEscaped = $this->escapeMarkdown($reason);

            $message = "❌ *Ваша заявка \\#{$booking->id} отклонена*\n\n";
            $message .= "📅 *Время:* {$startLocal}\n";
            $message .= "🚙 *Автомобиль:* {$carModel}\n\n";
            $message .= "📝 *Причина отказа:* {$reasonEscaped}\n\n";
            $message .= "💡 Вы можете создать новую заявку на другое время\\.";

            $bot->sendMessage(
                text: $message,
                chat_id: $booking->user->telegram_id,
                parse_mode: 'MarkdownV2'
            );

            Log::info("Notified client {$booking->user->id} about declined booking {$booking->id}");
        } catch (\Exception $e) {
            Log::error("Failed to notify client about declined booking: " . $e->getMessage());
        }
    }

    /**
     * Notify the client (booking owner) that their booking was canceled by the admin, with reason.
     */
    public function notifyClientBookingCanceled(Booking $booking, string $reason, Nutgram $bot): void
    {
        if (!$booking->user || !$booking->user->telegram_id) {
            return;
        }

        try {
            $startLocal = $this->escapeMarkdown($booking->start_time->timezone('Asia/Dushanbe')->format('d.m.Y H:i'));

            $carModel = $this->escapeMarkdown($booking->car->model ?? '—');
            $reasonEscaped = $this->escapeMarkdown($reason);

            $message = "❌ *Ваша заявка \\#{$booking->id} отменена*\n\n";
            $message .= "📅 *Время:* {$startLocal}\n";
            $message .= "🚙 *Автомобиль:* {$carModel}\n\n";
            $message .= "📝 *Причина отмены:* {$reasonEscaped}\n\n";
            $message .= "💡 Вы можете создать новую заявку на другое время\\.";

            $bot->sendMessage(
                text: $message,
                chat_id: $booking->user->telegram_id,
                parse_mode: 'MarkdownV2'
            );

            Log::info("Notified client {$booking->user->id} about canceled booking {$booking->id}");
        } catch (\Exception $e) {
            Log::error("Failed to notify client about canceled booking: " . $e->getMessage());
        }
    }

    /**
     * Notify users about preempted booking
     */
    public function notifyBookingPreempted(Booking $booking, Nutgram $bot): void
    {
        if (!$booking->user || !$booking->user->telegram_id) {
            return;
        }

        try {
            $startLocal = $this->escapeMarkdown($booking->start_time->timezone('Asia/Dushanbe')->format('d.m.Y H:i'));
            
            $carModel = $this->escapeMarkdown($booking->car->model);
            
            $message = "❌ *Ваша заявка \\#{$booking->id} отменена*\n\n";
            $message .= "К сожалению, ваша заявка была отменена из\\-за более приоритетной заявки\\.\n\n";
            $message .= "📅 *Время:* {$startLocal}\n";
            $message .= "🚙 *Автомобиль:* {$carModel}\n\n";
            $message .= "💡 Пожалуйста, создайте новую заявку или выберите другое время\\.";

            $bot->sendMessage(
                text: $message,
                chat_id: $booking->user->telegram_id,
                parse_mode: 'MarkdownV2'
            );

            Log::info("Notified user {$booking->user->id} about preempted booking {$booking->id}");
        } catch (\Exception $e) {
            Log::error("Failed to notify user about preempted booking: " . $e->getMessage());
        }
    }

    /**
     * Escape Markdown V2 special characters
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
