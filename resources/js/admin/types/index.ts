// Common types for the application

export interface Driver {
  id: string;
  name: string;
  fullName: string;
  phone?: string;
  email?: string;
  telegramId?: number;
  status: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
}

export type VehicleStatus = 'available' | 'in_use' | 'maintenance' | 'out_of_service';

export interface Vehicle {
  id: string;
  name: string;
  make: string;
  model: string;
  year?: number;
  licensePlate: string;
  color?: string;
  status: VehicleStatus;
  driverId?: string;
  driverName?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type PaginationParams = {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
};

// Booking domain (admin bookings/requests)
export type BookingStatus =
  | 'NEW'
  | 'PENDING'
  | 'APPROVED'
  | 'DECLINED'
  | 'CANCELED'
  | 'IN_PROGRESS'
  | 'COMPLETED';

export interface Booking {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  client: string;
  carId: string;
  carName?: string;
  driverId?: string;
  driverName?: string;
  requestTypeName?: string;
  priority?: number;
  priorityLabel?: string;
  status: string;
  hasLuggage?: boolean;
  passengerCount?: number;
  isWaitMode?: boolean;
  clientName?: string;
  fromLocation?: string;
  toLocation?: string;
  comment?: string;
}

// Request types (business-specific types tied to vehicles)
export interface RequestType {
  id: string;
  name: string;
  title?: string;
  priority: number;
  carId?: string;
  carName?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Force-majeure blocks for vehicles
export interface ForceMajorBlock {
  id: string;
  vehicleId: string;
  startAt: string; // ISO (UTC)
  endAt: string;   // ISO (UTC)
  reason: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

// Department entity
export interface Department {
  id: string;
  shortName: string;
  fullName: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Position entity
export interface Position {
  id: string;
  title: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}
