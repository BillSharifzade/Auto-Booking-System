import { useQuery, useMutation, useQueryClient, QueryKey } from '@tanstack/react-query';
import { vehicleService } from '@/api/vehicleService';
import { Vehicle, PaginatedResponse, PaginationParams, VehicleStatus } from '@/types';
import { toast } from 'sonner';

export const useVehicles = (
  params?: PaginationParams,
  options?: { enabled?: boolean }
) => {
  const queryClient = useQueryClient();
  const queryKey: QueryKey = ['vehicles', params];

  const queryFn = async () => {
    const response = await vehicleService.getVehicles(params);
    return response;
  };


  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery<PaginatedResponse<Vehicle>, Error>({
    queryKey,
    queryFn,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: options?.enabled ?? true,
  });

  const createVehicle = useMutation({
    mutationFn: (newVehicle: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>) =>
      vehicleService.createVehicle(newVehicle),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
  });

  const updateVehicle = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Vehicle> }) =>
      vehicleService.updateVehicle(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles', id] });
    },
  });

  const deleteVehicle = useMutation({
    mutationFn: (id: string) => vehicleService.deleteVehicle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Автомобиль успешно удален');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Ошибка при удалении автомобиля');
    },
  });

  const updateVehicleStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: VehicleStatus }) =>
      vehicleService.updateVehicleStatus(id, status),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles', id] });
    },
  });

  const assignDriver = useMutation({
    mutationFn: ({ vehicleId, driverId }: { vehicleId: string; driverId: string | null }) =>
      vehicleService.assignDriver(vehicleId, driverId),
    onSuccess: (_, { vehicleId }) => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles', vehicleId] });
      // Also invalidate drivers query as driver assignment might affect driver status
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
    },
  });

  const createForceBlock = useMutation({
    mutationFn: (data: { carId: string; startTime: string; endTime: string; reason?: string }) =>
      vehicleService.createForceBlock(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
  });

  return {
    vehicles: data?.data || [],
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
    createVehicle,
    updateVehicle,
    deleteVehicle,
    updateVehicleStatus,
    assignDriver,
    createForceBlock,
  };
};

export const useVehicle = (id: string) => {
  const queryClient = useQueryClient();
  const queryKey = ['vehicles', id];

  const {
    data: vehicle,
    isLoading,
    error,
  } = useQuery<Vehicle, Error>({
    queryKey,
    queryFn: () => vehicleService.getVehicle(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const updateVehicle = useMutation({
    mutationFn: (data: Partial<Vehicle>) => {
      if (!id) throw new Error('Vehicle ID is required');
      return vehicleService.updateVehicle(id, data);
    },
    onSuccess: (updatedVehicle) => {
      queryClient.setQueryData(queryKey, updatedVehicle);
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
  });

  return {
    vehicle,
    isLoading,
    error,
    updateVehicle,
  };
};
