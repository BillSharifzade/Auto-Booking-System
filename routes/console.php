<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('admin:create {email} {password} {--name=Администратор}', function (string $email, string $password) {
    $user = \App\Models\User::firstOrNew(['email' => $email]);
    $user->fill([
        'full_name' => $user->full_name ?? $this->option('name'),
        'username' => $user->username ?? 'admin',
        'role' => \App\Enums\UserRole::ADMIN,
        'is_active' => true,
        'password' => $password,
    ])->save();

    $this->info(($user->wasRecentlyCreated ? 'Created' : 'Updated') . " admin account {$email}");
})->purpose('Create or update an admin panel account (sets password and ADMIN role)');
