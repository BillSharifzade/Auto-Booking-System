import { httpClient } from './httpClient';
import { Booking, BookingStatus, PaginatedResponse, PaginationParams } from '@/types';

export type BookingListParams = PaginationParams & {
  date?: string;
  vehicleId?: string;
  driverId?: string;
  status?: BookingStatus;
};

export type CreateBookingInput = {
  requestTypeId: string;
  vehicleId: string;
  driverId?: string;
  departmentId?: string;
  positionId?: string;
  datetimeFrom: string; // ISO string (UTC)
  datetimeTo: string;   // ISO string (UTC)
  hasLuggage?: boolean;
  passengerCount?: number;
  isWaitMode?: boolean;
  clientName?: string;
  clientTelegramId?: string;
  fromLocation?: string;
  toLocation?: string;
  comment?: string;
};

export type UpdateBookingInput = Partial<CreateBookingInput> & {
  status?: BookingStatus;
};

export const bookingService = {
  // Get all bookings with filters/pagination
  getBookings: async (params?: BookingListParams) => {
    return httpClient.get<PaginatedResponse<Booking>>('/admin/bookings', { params });
  },

  // Get single booking
  getBooking: async (id: string) => {
    return httpClient.get<Booking>(`/admin/bookings/${id}`);
  },

  // Create booking
  createBooking: async (data: CreateBookingInput) => {
    // Transform to backend format
    const startDate = new Date(data.datetimeFrom);
    const endDate = new Date(data.datetimeTo);

    // Format date as YYYY-MM-DD
    const date = startDate.toISOString().split('T')[0];

    // Format time as HH:MM
    const timeFrom = startDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    const timeTo = endDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

    const payload = {
      carId: data.vehicleId,
      requestTypeId: data.requestTypeId,
      driverId: data.driverId === 'none' || !data.driverId ? undefined : data.driverId,
      departmentId: data.departmentId === 'none' || !data.departmentId ? undefined : data.departmentId,
      positionId: data.positionId === 'none' || !data.positionId ? undefined : data.positionId,
      userId: undefined, // Will be handled by backend if clientName is present
      clientName: data.clientName,
      date,
      timeFrom,
      timeTo,
      waitingMode: data.isWaitMode ? 'WAIT_ON_SITE' : 'RETURN_AT_TIME',
      hasLuggage: data.hasLuggage ? 1 : 0,
      hasPassengers: (data.passengerCount || 0) > 0 ? 1 : 0,
      fromLocation: data.fromLocation,
      toLocation: data.toLocation,
      comment: data.comment,
    };
    return httpClient.post<Booking>('/admin/bookings', payload);
  },

  // Update booking
  updateBooking: async (id: string, data: UpdateBookingInput) => {
    return httpClient.put<Booking>(`/admin/bookings/${id}`, data);
  },

  // Delete booking
  deleteBooking: async (id: string) => {
    return httpClient.delete<{ success: boolean }>(`/admin/bookings/${id}`);
  },

  // Update status helpers
  approve: async (id: string) => {
    return httpClient.post<Booking>(`/admin/bookings/${id}/approve`, {});
  },
  decline: async (id: string, reason: string) => {
    return httpClient.post<Booking>(`/admin/bookings/${id}/decline`, { reason });
  },
  cancel: async (id: string, reason: string) => {
    return httpClient.post<{ success: boolean }>(`/admin/bookings/${id}/cancel`, { reason });
  },
};
