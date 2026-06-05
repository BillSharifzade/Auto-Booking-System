<?php

namespace App\Telegram\Handlers;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\User;
use SergiX44\Nutgram\Nutgram;
use SergiX44\Nutgram\Telegram\Types\Keyboard\KeyboardButton;
use SergiX44\Nutgram\Telegram\Types\Keyboard\ReplyKeyboardMarkup;

class ClientHandler
{
    public function handleStart(Nutgram $bot): void
    {
        $telegramId = $bot->userId();
        
        // Get or create user
        $user = User::where('telegram_id', $telegramId)->first();
        
        if (!$user) {
            // Check if user was created via WebApp with just a username
            $username = $bot->user()->username;
            if ($username) {
                $user = User::where('username', $username)->first();
                if ($user) {
                    $user->update(['telegram_id' => $telegramId]);
                }
            }
        }

        if (!$user) {
            $user = User::create([
                'telegram_id' => $telegramId,
                'username' => $bot->user()->username,
                'full_name' => $bot->user()->first_name . ' ' . ($bot->user()->last_name ?? ''),
                'role' => 'CLIENT',
                'is_active' => true,
            ]);
        }

        $bot->sendMessage(
            text: "👋 *Добро пожаловать в систему бронирования автомобилей\\!*\n\n" .
                  "🆔 Ваш Telegram ID: `{$telegramId}`\n\n" .
                  "🚗 Откройте приложение и создайте новую заявку\\.",
            parse_mode: 'MarkdownV2',
        );
    }
}
