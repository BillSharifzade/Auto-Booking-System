import { httpClient } from './httpClient';
import { Driver, PaginatedResponse, PaginationParams } from '@/types';

export const driverService = {
  // Get all drivers with pagination
  getDrivers: async (params?: PaginationParams) => {
    return httpClient.get<PaginatedResponse<Driver>>('/admin/drivers', { params });
  },

  // Get a single driver by ID
  getDriver: async (id: string) => {
    return httpClient.get<Driver>(`/admin/drivers/${id}`);
  },

  // Create a new driver
  createDriver: async (data: Omit<Driver, 'id' | 'createdAt' | 'updatedAt'>) => {
    return httpClient.post<Driver>('/admin/drivers', data);
  },

  // Update a driver
  updateDriver: async (id: string, data: Partial<Driver>) => {
    return httpClient.put<Driver>(`/admin/drivers/${id}`, data);
  },

  // Delete a driver
  deleteDriver: async (id: string) => {
    return httpClient.delete<{ success: boolean }>(`/admin/drivers/${id}`);
  },

  // Update driver status
  updateDriverStatus: async (id: string, status: Driver['status']) => {
    return httpClient.patch<Driver>(`/admin/drivers/${id}/status`, { status });
  },

  // Update driver location
  updateDriverLocation: async (id: string, location: { lat: number; lng: number }) => {
    return httpClient.patch<Driver>(`/admin/drivers/${id}/location`, { location });
  },
};
