import { httpClient } from './httpClient';
import { Position, PaginatedResponse } from '@/types';

export const positionService = {
    // Get all positions
    getPositions: async () => {
        return httpClient.get<PaginatedResponse<Position>>('/admin/positions');
    },

    // Get a single position by ID
    getPosition: async (id: string) => {
        return httpClient.get<Position>(`/admin/positions/${id}`);
    },

    // Create a new position
    createPosition: async (data: Omit<Position, 'id' | 'createdAt' | 'updatedAt'>) => {
        return httpClient.post<Position>('/admin/positions', data);
    },

    // Update a position
    updatePosition: async (id: string, data: Partial<Position>) => {
        return httpClient.put<Position>(`/admin/positions/${id}`, data);
    },

    // Delete a position
    deletePosition: async (id: string) => {
        return httpClient.delete<{ success: boolean }>(`/admin/positions/${id}`);
    },
};
