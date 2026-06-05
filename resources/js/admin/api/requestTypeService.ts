import { httpClient } from './httpClient';
import { RequestType, PaginatedResponse, PaginationParams } from '@/types';

export const requestTypeService = {
  getRequestTypes: async (params?: PaginationParams) => {
    return httpClient.get<PaginatedResponse<RequestType>>('/admin/request-types', { params });
  },

  getRequestType: async (id: string) => {
    return httpClient.get<RequestType>(`/admin/request-types/${id}`);
  },

  createRequestType: async (data: Omit<RequestType, 'id' | 'createdAt' | 'updatedAt'>) => {
    return httpClient.post<RequestType>('/admin/request-types', data);
  },

  updateRequestType: async (id: string, data: Partial<RequestType>) => {
    return httpClient.put<RequestType>(`/admin/request-types/${id}`, data);
  },

  deleteRequestType: async (id: string) => {
    return httpClient.delete<{ success: boolean }>(`/admin/request-types/${id}`);
  },
};
