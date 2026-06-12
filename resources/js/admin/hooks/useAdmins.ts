import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  adminAccountService,
  AdminAccount,
  CreateAdminInput,
  UpdateAdminInput,
} from '@/api/adminAccountService';
import { PaginatedResponse } from '@/types';

export const useAdmins = () => {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<PaginatedResponse<AdminAccount>, Error>({
    queryKey: ['admins'],
    queryFn: () => adminAccountService.getAdmins(),
    staleTime: 60_000,
  });

  const createAdmin = useMutation({
    mutationFn: (payload: CreateAdminInput) => adminAccountService.createAdmin(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
    },
  });

  const updateAdmin = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAdminInput }) =>
      adminAccountService.updateAdmin(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
    },
  });

  const deleteAdmin = useMutation({
    mutationFn: (id: string) => adminAccountService.deleteAdmin(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
    },
  });

  return {
    admins: data?.data || [],
    isLoading,
    error,
    createAdmin,
    updateAdmin,
    deleteAdmin,
  } as const;
};
