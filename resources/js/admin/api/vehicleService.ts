import { httpClient } from './httpClient';
import { Vehicle, PaginatedResponse, PaginationParams } from '@/types';

export const vehicleService = {
  // Get all vehicles with pagination
  getVehicles: async (params?: PaginationParams) => {
    return httpClient.get<PaginatedResponse<Vehicle>>('/admin/vehicles', { params });
  },

  // Get a single vehicle by ID
  getVehicle: async (id: string) => {
    return httpClient.get<Vehicle>(`/admin/vehicles/${id}`);
  },

  // Create a new vehicle
  createVehicle: async (data: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>) => {
    return httpClient.post<Vehicle>('/admin/vehicles', data);
  },

  // Update a vehicle
  updateVehicle: async (id: string, data: Partial<Vehicle>) => {
    return httpClient.put<Vehicle>(`/admin/vehicles/${id}`, data);
  },

  // Delete a vehicle
  deleteVehicle: async (id: string) => {
    return httpClient.delete<{ success: boolean }>(`/admin/vehicles/${id}`);
  },

  // Update vehicle status
  updateVehicleStatus: async (id: string, status: Vehicle['status']) => {
    return httpClient.patch<Vehicle>(`/admin/vehicles/${id}/status`, { status });
  },

  // Assign driver to vehicle
  assignDriver: async (vehicleId: string, driverId: string | null) => {
    return httpClient.patch<Vehicle>(`/admin/vehicles/${vehicleId}/assign-driver`, { driverId });
  },

  // Create force block
  createForceBlock: async (data: { carId: string; startTime: string; endTime: string; reason?: string }) => {
    return httpClient.post('/admin/force-blocks', data);
  },
};
