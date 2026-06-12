import { httpClient } from './httpClient';

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export const authService = {
  login: async (email: string, password: string) => {
    return httpClient.post<{ user: AdminUser }>('/admin/login', { email, password });
  },

  logout: async () => {
    return httpClient.post<{ success: boolean }>('/admin/logout', {});
  },

  me: async () => {
    return httpClient.get<{ user: AdminUser }>('/admin/me');
  },
};
