import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { requestTypeService } from '@/api/requestTypeService';
import { RequestType, PaginationParams, PaginatedResponse } from '@/types';

export const useRequestTypes = (params?: PaginationParams, options?: { enabled?: boolean }) => {
    const queryClient = useQueryClient();
    const queryKey = ['requestTypes', params];

    const { data, isLoading, error, refetch } = useQuery<PaginatedResponse<RequestType>, Error>({
        queryKey,
        queryFn: () => requestTypeService.getRequestTypes(params),
        staleTime: 5 * 60 * 1000, // 5 minutes
        enabled: options?.enabled ?? true,
    });

    const createRequestType = useMutation({
        mutationFn: (newType: Omit<RequestType, 'id' | 'createdAt' | 'updatedAt'>) =>
            requestTypeService.createRequestType(newType),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['requestTypes'] });
        },
    });

    const updateRequestType = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<RequestType> }) =>
            requestTypeService.updateRequestType(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: ['requestTypes'] });
            queryClient.invalidateQueries({ queryKey: ['requestTypes', id] });
        },
    });

    const deleteRequestType = useMutation({
        mutationFn: (id: string) => requestTypeService.deleteRequestType(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['requestTypes'] });
        },
    });

    return {
        requestTypes: data?.data || [],
        pagination: data
            ? {
                total: data.total,
                page: data.page,
                limit: data.limit,
                totalPages: data.totalPages,
            }
            : null,
        isLoading,
        error,
        refetch,
        createRequestType,
        updateRequestType,
        deleteRequestType,
    };
};

export const useRequestType = (id: string) => {
    const queryClient = useQueryClient();
    const queryKey = ['requestTypes', id];

    const { data: requestType, isLoading, error } = useQuery<RequestType, Error>({
        queryKey,
        queryFn: () => requestTypeService.getRequestType(id),
        enabled: !!id,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    const updateRequestType = useMutation({
        mutationFn: (data: Partial<RequestType>) => {
            if (!id) throw new Error('RequestType ID is required');
            return requestTypeService.updateRequestType(id, data);
        },
        onSuccess: (updatedType) => {
            queryClient.setQueryData(queryKey, updatedType);
            queryClient.invalidateQueries({ queryKey: ['requestTypes'] });
        },
    });

    return {
        requestType,
        isLoading,
        error,
        updateRequestType,
    };
};
