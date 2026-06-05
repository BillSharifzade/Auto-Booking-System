import { httpClient } from './httpClient';
import { ForceMajorBlock, PaginatedResponse, PaginationParams } from '@/types';

export const forceMajorService = {
  getBlocks: async (params?: PaginationParams & { vehicleId?: string; date?: string }) => {
    return httpClient.get<PaginatedResponse<ForceMajorBlock>>('/force-majors', { params });
  },

  getBlock: async (id: string) => {
    return httpClient.get<ForceMajorBlock>(`/force-majors/${id}`);
  },

  createBlock: async (data: Omit<ForceMajorBlock, 'id' | 'createdAt' | 'updatedAt'>) => {
    return httpClient.post<ForceMajorBlock>('/force-majors', data);
  },

  deleteBlock: async (id: string) => {
    return httpClient.delete<{ success: boolean }>(`/force-majors/${id}`);
  },
};
