import { httpClient } from './httpClient';
import { PaginatedResponse } from '@/types';

export type AdminAccount = {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateAdminInput = {
  name: string;
  email: string;
  password: string;
};

export type UpdateAdminInput = {
  name?: string;
  email?: string;
  password?: string;
};

export const adminAccountService = {
  getAdmins: async () => {
    return httpClient.get<PaginatedResponse<AdminAccount>>('/admin/admins');
  },

  createAdmin: async (data: CreateAdminInput) => {
    return httpClient.post<AdminAccount>('/admin/admins', data);
  },

  updateAdmin: async (id: string, data: UpdateAdminInput) => {
    return httpClient.put<AdminAccount>(`/admin/admins/${id}`, data);
  },

  deleteAdmin: async (id: string) => {
    return httpClient.delete<{ success: boolean }>(`/admin/admins/${id}`);
  },
};
