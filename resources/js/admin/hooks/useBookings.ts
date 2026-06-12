import { useQuery, useMutation, useQueryClient, QueryKey } from '@tanstack/react-query';
import { bookingService, CreateBookingInput, UpdateBookingInput, BookingListParams } from '@/api/bookingService';
import { Booking, PaginatedResponse } from '@/types';

export const useBookings = (
  params?: BookingListParams,
  options?: { enabled?: boolean }
) => {
  const queryClient = useQueryClient();
  const queryKey: QueryKey = ['bookings', params];

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery<PaginatedResponse<Booking>, Error>({
    queryKey,
    queryFn: () => bookingService.getBookings(params),
    staleTime: 60_000,
    enabled: options?.enabled ?? true,
  });

  const createBooking = useMutation({
    mutationFn: (payload: CreateBookingInput) => bookingService.createBooking(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });

  const updateBooking = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBookingInput }) => bookingService.updateBooking(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['bookings', id] });
    },
  });

  const deleteBooking = useMutation({
    mutationFn: (id: string) => bookingService.deleteBooking(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });

  const approve = useMutation({
    mutationFn: (id: string) => bookingService.approve(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['bookings', id] });
    },
  });

  const decline = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => bookingService.decline(id, reason),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['bookings', id] });
    },
  });

  const cancel = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => bookingService.cancel(id, reason),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['bookings', id] });
    },
  });

  return {
    bookings: data?.data || [],
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
    createBooking,
    updateBooking,
    deleteBooking,
    approve,
    decline,
    cancel,
  } as const;
};

export const useBooking = (id: string) => {
  const queryClient = useQueryClient();
  const queryKey = ['bookings', id];

  const { data: booking, isLoading, error } = useQuery<Booking, Error>({
    queryKey,
    queryFn: () => bookingService.getBooking(id),
    enabled: !!id,
    staleTime: 60_000,
  });

  const updateBooking = useMutation({
    mutationFn: (data: UpdateBookingInput) => bookingService.updateBooking(id, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKey, updated);
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });

  return { booking, isLoading, error, updateBooking } as const;
};
