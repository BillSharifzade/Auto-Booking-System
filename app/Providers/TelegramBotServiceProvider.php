<?php

namespace App\Providers;

use App\Telegram\Handlers\ClientHandler;
use App\Telegram\Handlers\DriverHandler;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Log;
use SergiX44\Nutgram\Nutgram;

class TelegramBotServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(Nutgram::class, function () {
            $bot = new Nutgram(config('services.telegram.token'));

            $bot->onCommand('start', [ClientHandler::class, 'handleStart']);
            $bot->onText('📋 Мои заявки', [ClientHandler::class, 'handleMyBookings']);
            $bot->onCallbackQueryData('/^cancel_booking:/', [ClientHandler::class, 'handleCancelBooking']);

            $bot->onCommand('driver', [DriverHandler::class, 'handleDriverMenu']);
            $bot->onText('🚗 Текущая поездка', [DriverHandler::class, 'handleCurrentTrip']);
            $bot->onText('📅 Расписание', [DriverHandler::class, 'handleSchedule']);
            $bot->onText('📋 Все заявки', [DriverHandler::class, 'handleAllBookings']);
            // Nutgram patterns are NOT raw regex. Use "{id}" placeholders instead.
            $bot->onCallbackQueryData('driver_arrived:{id}', [DriverHandler::class, 'handleArrived']);
            $bot->onCallbackQueryData('complete_journey:{id}', [DriverHandler::class, 'handleCompleteJourney']);

            // Fallback for any unhandled callback queries to avoid "stuck" loading state in Telegram UI.
            $bot->onCallbackQuery(function (Nutgram $bot): void {
                $data = (string)($bot->callbackQuery()?->data ?? '');
                Log::warning('Unhandled callback query', ['data' => $data]);

                try {
                    $bot->answerCallbackQuery(null, '⚠️ Действие не поддерживается');
                } catch (\Throwable $e) {
                    Log::warning('answerCallbackQuery failed (fallback)', ['exception' => $e]);
                }
            });

            return $bot;
        });
    }

    public function boot(): void
    {
        //
    }
}
