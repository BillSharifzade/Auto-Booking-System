// ============ ENUMS ============

export enum BookingStatus {
    NEW = 'NEW',
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    DECLINED = 'DECLINED',
    CANCELED = 'CANCELED',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
}

export enum DriverStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    ON_LEAVE = 'ON_LEAVE',
}

export enum WaitingMode {
    DRIVER_WAITS = 'DRIVER_WAITS',
    DRIVER_RETURNS = 'DRIVER_RETURNS',
}

// ============ MODELS ============

export interface Car {
    id: string;
    name: string;
    model: string;
    licensePlate: string;
    description: string;
    isActive: boolean;
    driverId?: string;
    color?: string; // for calendar UI
}

export interface Driver {
    id: string;
    fullName: string;
    phone: string;
    telegramUserId?: number;
    carId?: string;
    status: DriverStatus;
}

export interface Department {
    id: string;
    shortName: string;
    fullName: string;
    isActive: boolean;
}

export interface Position {
    id: string;
    title: string;
    isActive: boolean;
}

export interface RequestType {
    id: string;
    name: string;
    description: string;
    priority: number; // higher number = higher priority
    carId: string;
    carName?: string;
    color?: string;
    icon?: string;
}

export interface Booking {
    id: string;
    userId: number; // Telegram user_id
    userName: string;
    userUsername?: string;
    requestTypeId: string;
    carId: string;
    carName?: string;
    driverId?: string;
    departmentId?: string;
    departmentName?: string;
    positionId?: string;
    positionName?: string;
    clientName?: string;
    fromLocation?: string;
    toLocation?: string;
    comment?: string;
    dateTimeFrom: string; // ISO string
    dateTimeTo: string; // ISO string
    hasPassengers: boolean;
    hasLuggage: boolean;
    waitingMode: WaitingMode;
    returnTime?: string; // ISO string, if DRIVER_RETURNS
    status: BookingStatus;
    declineReason?: string;
    source: 'BOT' | 'WEB_APP' | 'ADMIN';
    metadata?: Record<string, any>;
    createdAt: string;
    updatedAt: string;
    formattedStartTime?: string;
    formattedEndTime?: string;
    formattedTimeRange?: string;
}

export interface ForceMajorBlock {
    id: string;
    carId: string;
    dateTimeFrom: string;
    dateTimeTo: string;
    reason: string;
    createdBy: string; // admin id
    createdAt: string;
}

// ============ TIME SLOT ============

export interface TimeSlot {
    time: string; // HH:mm format
    datetime: Date;
    isAvailable: boolean;
    isBlocked: boolean;
    isSelected: boolean;
    bookingId?: string;
    blockId?: string;
}

// ============ API RESPONSES ============

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface BookingFormData {
    requestTypeId: string;
    date: string;
    timeFrom: string;
    timeTo: string;
    departmentId?: string;
    positionId?: string;
    hasPassengers: boolean;
    hasLuggage: boolean;
    waitingMode: WaitingMode;
    returnTime?: string;
    clientName?: string;
    fromLocation?: string;
    toLocation?: string;
    comment?: string;
}

// ============ UI STATE ============

export interface ToastMessage {
    id: string;
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
    duration?: number;
}
