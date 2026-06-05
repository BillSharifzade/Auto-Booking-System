import { Car, Driver, RequestType, Booking, BookingStatus, DriverStatus, WaitingMode } from '../types';

// ============ MOCK DATA ============

export const mockCars: Car[] = [
    {
        id: 'car-1',
        name: 'Toyota Camry',
        model: '2023',
        licensePlate: '01 ABC 123',
        description: 'Комфортный седан для деловых поездок',
        isActive: true,
        driverId: 'driver-1',
        color: '#3b82f6',
    },
    {
        id: 'car-2',
        name: 'Mercedes-Benz E-Class',
        model: '2024',
        licensePlate: '01 XYZ 456',
        description: 'Премиум автомобиль для VIP гостей',
        isActive: true,
        driverId: 'driver-2',
        color: '#8b5cf6',
    },
    {
        id: 'car-3',
        name: 'Toyota Land Cruiser',
        model: '2023',
        licensePlate: '01 DEF 789',
        description: 'Внедорожник для дальних поездок',
        isActive: true,
        driverId: 'driver-3',
        color: '#10b981',
    },
];

export const mockDrivers: Driver[] = [
    {
        id: 'driver-1',
        fullName: 'Иванов Иван Иванович',
        phone: '+992 900 123 456',
        telegramUserId: 123456789,
        carId: 'car-1',
        status: DriverStatus.ACTIVE,
    },
    {
        id: 'driver-2',
        fullName: 'Петров Петр Петрович',
        phone: '+992 900 234 567',
        telegramUserId: 234567890,
        carId: 'car-2',
        status: DriverStatus.ACTIVE,
    },
    {
        id: 'driver-3',
        fullName: 'Сидоров Сидор Сидорович',
        phone: '+992 900 345 678',
        telegramUserId: 345678901,
        carId: 'car-3',
        status: DriverStatus.ACTIVE,
    },
];

export const mockRequestTypes: RequestType[] = [
    {
        id: 'req-type-1',
        name: 'Встреча гостя из аэропорта',
        description: 'Трансфер из аэропорта в офис/отель',
        priority: 5,
        carId: 'car-2', // Mercedes for VIP
        color: '#8b5cf6',
        icon: '✈️',
    },
    {
        id: 'req-type-2',
        name: 'Поездка по городу',
        description: 'Деловые встречи в пределах города',
        priority: 3,
        carId: 'car-1', // Camry for city trips
        color: '#3b82f6',
        icon: '🏙️',
    },
    {
        id: 'req-type-3',
        name: 'Трансфер в другой город',
        description: 'Междугородние поездки',
        priority: 4,
        carId: 'car-3', // Land Cruiser for long trips
        color: '#10b981',
        icon: '🛣️',
    },
    {
        id: 'req-type-4',
        name: 'Задача от учредителя',
        description: 'Высокоприоритетная задача',
        priority: 10,
        carId: 'car-2',
        color: '#ef4444',
        icon: '⭐',
    },
];

// Mock bookings for today and tomorrow
const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);

export const mockBookings: Booking[] = [
    {
        id: 'booking-1',
        userId: 111111111,
        userName: 'Алексей Смирнов',
        userUsername: 'alexey_s',
        requestTypeId: 'req-type-2',
        carId: 'car-1',
        driverId: 'driver-1',
        dateTimeFrom: new Date(today.setHours(10, 0, 0, 0)).toISOString(),
        dateTimeTo: new Date(today.setHours(11, 30, 0, 0)).toISOString(),
        hasPassengers: true,
        hasLuggage: false,
        waitingMode: WaitingMode.DRIVER_WAITS,
        status: BookingStatus.APPROVED,
        source: 'WEB_APP',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: 'booking-2',
        userId: 222222222,
        userName: 'Мария Иванова',
        userUsername: 'maria_i',
        requestTypeId: 'req-type-1',
        carId: 'car-2',
        driverId: 'driver-2',
        dateTimeFrom: new Date(today.setHours(14, 0, 0, 0)).toISOString(),
        dateTimeTo: new Date(today.setHours(16, 0, 0, 0)).toISOString(),
        hasPassengers: false,
        hasLuggage: true,
        waitingMode: WaitingMode.DRIVER_RETURNS,
        returnTime: new Date(today.setHours(16, 30, 0, 0)).toISOString(),
        status: BookingStatus.PENDING,
        source: 'BOT',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: 'booking-3',
        userId: 111111111,
        userName: 'Алексей Смирнов',
        userUsername: 'alexey_s',
        requestTypeId: 'req-type-3',
        carId: 'car-3',
        driverId: 'driver-3',
        dateTimeFrom: new Date(tomorrow.setHours(9, 0, 0, 0)).toISOString(),
        dateTimeTo: new Date(tomorrow.setHours(18, 0, 0, 0)).toISOString(),
        hasPassengers: true,
        hasLuggage: true,
        waitingMode: WaitingMode.DRIVER_WAITS,
        status: BookingStatus.APPROVED,
        source: 'WEB_APP',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
];

// Current user (mock Telegram user)
export const mockCurrentUser = {
    id: 111111111,
    firstName: 'Алексей',
    lastName: 'Смирнов',
    username: 'alexey_s',
};
