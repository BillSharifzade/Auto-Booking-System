<?php

/** @var SergiX44\Nutgram\Nutgram $bot */

use App\Telegram\Handlers\ClientHandler;
use App\Telegram\Handlers\DriverHandler;
use SergiX44\Nutgram\Nutgram;

/*
|--------------------------------------------------------------------------
| Nutgram Handlers
|--------------------------------------------------------------------------
|
| Here is where you can register telegram handlers for Nutgram.
|
*/

// Client handlers
$bot->onCommand('start', [ClientHandler::class, 'handleStart'])
    ->description('Welcome message');

// Driver handlers
$bot->onCommand('driver', [DriverHandler::class, 'handleDriverMenu'])
    ->description('Driver menu');

$bot->onText('🚗 Текущая поездка', [DriverHandler::class, 'handleCurrentTrip']);
$bot->onText('📅 Расписание', [DriverHandler::class, 'handleSchedule']);
$bot->onText('📋 Все заявки', [DriverHandler::class, 'handleAllBookings']);
$bot->onCallbackQueryData('driver_arrived:{id}', [DriverHandler::class, 'handleArrived']);
$bot->onCallbackQueryData('complete_journey:{id}', [DriverHandler::class, 'handleCompleteJourney']);
