<?php

use App\Livewire\BookingWizard;
use App\Livewire\MyBookings;
use Illuminate\Support\Facades\Route;
use SergiX44\Nutgram\Nutgram;
use SergiX44\Nutgram\RunningMode\Webhook;

// Client App (React)
Route::get('/', function () {
    return view('client');
});

Route::get('/booking/{any?}', function () {
    return view('client');
})->where('any', '.*');

Route::get('/my-requests', function () {
    return view('client');
});

// Telegram Bot Webhook
Route::post('/telegram/webhook', function (Nutgram $bot) {
    // Nutgram defaults to Polling mode (CLI-only). For Telegram webhooks we must use Webhook mode.
    $bot->setRunningMode(Webhook::class);
    try {
        $bot->run();
    } catch (\Throwable $e) {
        \Illuminate\Support\Facades\Log::error('Telegram webhook processing failed', ['exception' => $e]);
        // Always return 200 to prevent Telegram retries causing "query is too old" and stuck buttons.
    }
    return response('OK', 200);
})->withoutMiddleware([\Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class]);

// React Admin Panel
Route::get('/admin/{any?}', function () {
    return view('admin');
})->where('any', '.*');
