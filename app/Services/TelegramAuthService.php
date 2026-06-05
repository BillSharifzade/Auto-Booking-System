<?php

namespace App\Services;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class TelegramAuthService
{
    /**
     * Validate Telegram WebApp initData signature.
     */
    public function validateInitData(string $initData): ?array
    {
        if (empty($initData)) {
            return null;
        }

        $botToken = config('services.telegram.token');
        if (empty($botToken)) {
            return null;
        }

        // Parse the init data
        parse_str($initData, $data);

        if (!isset($data['hash'])) {
            return null;
        }

        $hash = $data['hash'];
        unset($data['hash']);

        // Sort the data
        ksort($data);

        // Create the data check string
        $dataCheckString = collect($data)
            ->map(fn($value, $key) => "$key=$value")
            ->implode("\n");

        // Calculate the secret key
        $secretKey = hash_hmac('sha256', $botToken, 'WebAppData', true);

        // Calculate the hash
        $calculatedHash = hash_hmac('sha256', $dataCheckString, $secretKey);

        // Validate
        if (!hash_equals($calculatedHash, $hash)) {
            return null;
        }

        // Check auth_date (valid for 24 hours)
        if (isset($data['auth_date'])) {
            $authDate = (int) $data['auth_date'];
            if (time() - $authDate > 86400) {
                return null;
            }
        }

        // Parse user data
        if (isset($data['user'])) {
            $userData = json_decode($data['user'], true);
            return $userData;
        }

        return $data;
    }

    /**
     * Get or create user from Telegram data.
     */
    public function getOrCreateUser(array $telegramUser): User
    {
        $telegramId = $telegramUser['id'];

        $user = User::where('telegram_id', $telegramId)->first();

        if (!$user) {
            $user = User::create([
                'telegram_id' => $telegramId,
                'username' => $telegramUser['username'] ?? null,
                'full_name' => trim(($telegramUser['first_name'] ?? '') . ' ' . ($telegramUser['last_name'] ?? '')),
                'role' => UserRole::CLIENT,
                'is_active' => true,
            ]);
        } else {
            // Update user info if changed
            $user->update([
                'username' => $telegramUser['username'] ?? $user->username,
                'full_name' => trim(($telegramUser['first_name'] ?? '') . ' ' . ($telegramUser['last_name'] ?? '')) ?: $user->full_name,
            ]);
        }

        return $user;
    }
}
