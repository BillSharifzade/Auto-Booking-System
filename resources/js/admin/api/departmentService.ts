import { httpClient } from './httpClient';
import { Department, PaginatedResponse } from '@/types';

export const departmentService = {
    // Get all departments
    getDepartments: async () => {
        return httpClient.get<PaginatedResponse<Department>>('/admin/departments');
    },

    // Get a single department by ID
    getDepartment: async (id: string) => {
        return httpClient.get<Department>(`/admin/departments/${id}`);
    },

    // Create a new department
    createDepartment: async (data: Omit<Department, 'id' | 'createdAt' | 'updatedAt'>) => {
        return httpClient.post<Department>('/admin/departments', data);
    },

    // Update a department
    updateDepartment: async (id: string, data: Partial<Department>) => {
        return httpClient.put<Department>(`/admin/departments/${id}`, data);
    },

    // Delete a department
    deleteDepartment: async (id: string) => {
        return httpClient.delete<{ success: boolean }>(`/admin/departments/${id}`);
    },
};
