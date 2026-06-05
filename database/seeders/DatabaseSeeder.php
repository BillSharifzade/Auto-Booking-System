<?php

namespace Database\Seeders;

use App\Enums\BookingStatus;
use App\Enums\CarStatus;
use App\Enums\UserRole;
use App\Enums\WaitMode;
use App\Models\Booking;
use App\Models\Car;
use App\Models\ForceBlock;
use App\Models\RequestType;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Create Admin
        $admin = User::create([
            'telegram_id' => 100000001,
            'username' => 'admin',
            'full_name' => 'Администратор',
            'email' => 'admin@carbooking.tj',
            'role' => UserRole::ADMIN,
            'phone_number' => '+992900000001',
            'is_active' => true,
            'password' => Hash::make('password'),
        ]);

        // Create Drivers
        $driver1 = User::create([
            'telegram_id' => 100000002,
            'username' => 'driver1',
            'full_name' => 'Иван Петров',
            'email' => 'driver1@carbooking.tj',
            'role' => UserRole::DRIVER,
            'phone_number' => '+992900000002',
            'is_active' => true,
        ]);

        $driver2 = User::create([
            'telegram_id' => 100000003,
            'username' => 'driver2',
            'full_name' => 'Сергей Иванов',
            'email' => 'driver2@carbooking.tj',
            'role' => UserRole::DRIVER,
            'phone_number' => '+992900000003',
            'is_active' => true,
        ]);

        // Create Clients
        $client1 = User::create([
            'telegram_id' => 100000004,
            'username' => 'client1',
            'full_name' => 'Алия Каримова',
            'role' => UserRole::CLIENT,
            'phone_number' => '+992900000004',
            'is_active' => true,
        ]);

        $client2 = User::create([
            'telegram_id' => 100000005,
            'username' => 'client2',
            'full_name' => 'Рустам Ахмедов',
            'role' => UserRole::CLIENT,
            'phone_number' => '+992900000005',
            'is_active' => true,
        ]);

        // Create Cars
        $car1 = Car::create([
            'model' => 'Toyota Camry',
            'license_plate' => '01 A 001 TJ',
            'description' => 'Седан бизнес-класса',
            'status' => CarStatus::ACTIVE,
            'color_hex' => '#1a1a1a',
            'default_driver_id' => $driver1->id,
        ]);

        $car2 = Car::create([
            'model' => 'Mercedes S-Class',
            'license_plate' => '01 A 002 TJ',
            'description' => 'Представительский седан',
            'status' => CarStatus::ACTIVE,
            'color_hex' => '#2c3e50',
            'default_driver_id' => $driver2->id,
        ]);

        $car3 = Car::create([
            'model' => 'Toyota Land Cruiser',
            'license_plate' => '01 A 003 TJ',
            'description' => 'Внедорожник премиум-класса',
            'status' => CarStatus::ACTIVE,
            'color_hex' => '#f5f5f5',
            'default_driver_id' => $driver1->id,
        ]);

        // Create Request Types with different priorities
        // Car 1: Toyota Camry
        RequestType::create([
            'title' => 'Обычная поездка',
            'priority' => 1,
            'car_id' => $car1->id,
            'is_active' => true,
        ]);
        RequestType::create([
            'title' => 'Деловая встреча',
            'priority' => 5,
            'car_id' => $car1->id,
            'is_active' => true,
        ]);
        RequestType::create([
            'title' => 'VIP поездка',
            'priority' => 10,
            'car_id' => $car1->id,
            'is_active' => true,
        ]);

        // Car 2: Mercedes S-Class
        RequestType::create([
            'title' => 'Стандарт',
            'priority' => 1,
            'car_id' => $car2->id,
            'is_active' => true,
        ]);
        RequestType::create([
            'title' => 'Руководство',
            'priority' => 8,
            'car_id' => $car2->id,
            'is_active' => true,
        ]);
        RequestType::create([
            'title' => 'Директор',
            'priority' => 15,
            'car_id' => $car2->id,
            'is_active' => true,
        ]);

        // Car 3: Land Cruiser
        RequestType::create([
            'title' => 'Загородная поездка',
            'priority' => 3,
            'car_id' => $car3->id,
            'is_active' => true,
        ]);
        RequestType::create([
            'title' => 'Командировка',
            'priority' => 7,
            'car_id' => $car3->id,
            'is_active' => true,
        ]);

        // Create sample bookings
        $tomorrow = Carbon::tomorrow()->setTimezone('Asia/Dushanbe');

        Booking::create([
            'user_id' => $client1->id,
            'car_id' => $car1->id,
            'driver_id' => $driver1->id,
            'request_type_id' => 1, // Обычная поездка
            'start_time' => $tomorrow->copy()->setTime(9, 0),
            'end_time' => $tomorrow->copy()->setTime(11, 0),
            'has_passengers' => true,
            'has_luggage' => false,
            'wait_mode' => WaitMode::WAIT_ON_SITE,
            'status' => BookingStatus::APPROVED,
        ]);

        Booking::create([
            'user_id' => $client2->id,
            'car_id' => $car2->id,
            'driver_id' => $driver2->id,
            'request_type_id' => 4, // Стандарт
            'start_time' => $tomorrow->copy()->setTime(14, 0),
            'end_time' => $tomorrow->copy()->setTime(16, 0),
            'has_passengers' => false,
            'has_luggage' => true,
            'wait_mode' => WaitMode::RETURN_AT_TIME,
            'status' => BookingStatus::NEW,
        ]);

        // Create a force block (maintenance)
        ForceBlock::create([
            'car_id' => $car3->id,
            'start_time' => $tomorrow->copy()->addDays(2)->setTime(8, 0),
            'end_time' => $tomorrow->copy()->addDays(2)->setTime(18, 0),
            'reason' => 'Техническое обслуживание',
            'created_by' => $admin->id,
        ]);

        $this->command->info('✅ Seeded: 1 Admin, 2 Drivers, 2 Clients');
        $this->command->info('✅ Seeded: 3 Cars with 8 Request Types');
        $this->command->info('✅ Seeded: 2 Sample Bookings, 1 Force Block');
    }
}
