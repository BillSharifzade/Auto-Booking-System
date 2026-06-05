import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { departmentService } from '@/api/departmentService';
import { Department, PaginatedResponse } from '@/types';
import { toast } from 'sonner';

export const useDepartments = () => {
    const queryClient = useQueryClient();
    const queryKey = ['departments'];

    const { data, isLoading, error, refetch } = useQuery<PaginatedResponse<Department>, Error>({
        queryKey,
        queryFn: () => departmentService.getDepartments(),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    const createDepartment = useMutation({
        mutationFn: (newDepartment: Omit<Department, 'id' | 'createdAt' | 'updatedAt'>) =>
            departmentService.createDepartment(newDepartment),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['departments'] });
            toast.success('Отдел успешно создан');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || 'Ошибка при создании отдела');
        },
    });

    const updateDepartment = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Department> }) =>
            departmentService.updateDepartment(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['departments'] });
            toast.success('Отдел успешно обновлен');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || 'Ошибка при обновлении отдела');
        },
    });

    const deleteDepartment = useMutation({
        mutationFn: (id: string) => departmentService.deleteDepartment(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['departments'] });
            toast.success('Отдел успешно удален');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || 'Ошибка при удалении отдела');
        },
    });

    return {
        departments: data?.data || [],
        isLoading,
        error,
        refetch,
        createDepartment,
        updateDepartment,
        deleteDepartment,
    };
};
