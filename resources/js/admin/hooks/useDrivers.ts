import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { driverService } from '@/api/driverService';
import { Driver, PaginationParams, PaginatedResponse } from '@/types';
import { toast } from 'sonner';

export const useDrivers = (params?: PaginationParams) => {
  const queryClient = useQueryClient();
  const queryKey = ['drivers', params];

  const { data, isLoading, error, refetch } = useQuery<PaginatedResponse<Driver>, Error>({
    queryKey,
    queryFn: () => driverService.getDrivers(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const createDriver = useMutation({
    mutationFn: (newDriver: Omit<Driver, 'id' | 'createdAt' | 'updatedAt'>) =>
      driverService.createDriver(newDriver),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
    },
  });

  const updateDriver = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Driver> }) =>
      driverService.updateDriver(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['drivers', id] });
    },
  });

  const deleteDriver = useMutation({
    mutationFn: (id: string) => driverService.deleteDriver(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success('Водитель успешно удален');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Ошибка при удалении водителя');
    },
  });

  const updateDriverStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Driver['status'] }) =>
      driverService.updateDriverStatus(id, status),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['drivers', id] });
    },
  });

  const updateDriverLocation = useMutation({
    mutationFn: ({ id, location }: { id: string; location: { lat: number; lng: number } }) =>
      driverService.updateDriverLocation(id, location),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['drivers', id] });
    },
  });

  return {
    drivers: data?.data || [],
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
    createDriver,
    updateDriver,
    deleteDriver,
    updateDriverStatus,
    updateDriverLocation,
  };
};

export const useDriver = (id: string) => {
  const queryClient = useQueryClient();
  const queryKey = ['drivers', id];

  const { data: driver, isLoading, error } = useQuery<Driver, Error>({
    queryKey,
    queryFn: () => driverService.getDriver(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const updateDriver = useMutation({
    mutationFn: (data: Partial<Driver>) => {
      if (!id) throw new Error('Driver ID is required');
      return driverService.updateDriver(id, data);
    },
    onSuccess: (updatedDriver) => {
      queryClient.setQueryData(queryKey, updatedDriver);
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
    },
  });

  return {
    driver,
    isLoading,
    error,
    updateDriver,
  };
};
