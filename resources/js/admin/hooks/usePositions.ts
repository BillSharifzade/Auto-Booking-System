import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { positionService } from '@/api/positionService';
import { Position, PaginatedResponse } from '@/types';
import { toast } from 'sonner';

export const usePositions = () => {
    const queryClient = useQueryClient();
    const queryKey = ['positions'];

    const { data, isLoading, error, refetch } = useQuery<PaginatedResponse<Position>, Error>({
        queryKey,
        queryFn: () => positionService.getPositions(),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    const createPosition = useMutation({
        mutationFn: (newPosition: Omit<Position, 'id' | 'createdAt' | 'updatedAt'>) =>
            positionService.createPosition(newPosition),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['positions'] });
            toast.success('Должность успешно создана');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || 'Ошибка при создании должности');
        },
    });

    const updatePosition = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Position> }) =>
            positionService.updatePosition(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['positions'] });
            toast.success('Должность успешно обновлена');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || 'Ошибка при обновлении должности');
        },
    });

    const deletePosition = useMutation({
        mutationFn: (id: string) => positionService.deletePosition(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['positions'] });
            toast.success('Должность успешно удалена');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || 'Ошибка при удалении должности');
        },
    });

    return {
        positions: data?.data || [],
        isLoading,
        error,
        refetch,
        createPosition,
        updatePosition,
        deletePosition,
    };
};
