import axios from 'axios';
import {
    ApiResponse,
    Booking,
    BookingFormData,
    Car,
    Department,
    Position,
    RequestType,
} from '../types';
import { telegramService } from './telegram';

// Create axios instance with base URL
const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// Add Telegram user ID to all requests
api.interceptors.request.use((config) => {
    let user = telegramService.getUser();

    // Emergency fallback if telegramService fails to return a user
    if (!user || user.id === undefined) {
        console.warn('API: No user found in telegramService, using dev fallback');
        user = {
            id: 77777,
            first_name: 'Fallback',
            last_name: 'User',
            username: 'fallback_user'
        };
    }

    if (user?.id) {
        config.headers['X-Telegram-User-Id'] = user.id.toString();
        config.headers['X-Telegram-First-Name'] = encodeURIComponent(user.first_name || '');
        config.headers['X-Telegram-Last-Name'] = encodeURIComponent(user.last_name || '');
        config.headers['X-Telegram-Username'] = user.username || '';
    }
    return config;
});

// ============ REQUEST TYPES API ============

export const getRequestTypes = async (): Promise<ApiResponse<RequestType[]>> => {
    try {
        const response = await api.get('/request-types');
        return response.data;
    } catch (error: any) {
        console.error('Error fetching request types:', error);
        return {
            success: false,
            error: error.response?.data?.message || 'Failed to fetch request types',
        };
    }
};

export const getRequestTypeById = async (id: string): Promise<ApiResponse<RequestType>> => {
    // We can fetch all and find, or implement specific endpoint. 
    // For now, let's fetch all and find to save an endpoint, or just use the list we likely already have.
    // But to be safe, let's fetch all.
    try {
        const response = await api.get('/request-types');
        if (response.data.success) {
            const type = response.data.data.find((t: RequestType) => t.id === id);
            if (type) {
                return { success: true, data: type };
            }
        }
        return { success: false, error: 'Request type not found' };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

// ============ DEPARTMENTS API ============

export const getDepartments = async (): Promise<ApiResponse<Department[]>> => {
    try {
        const response = await api.get('/departments');
        return { success: true, data: response.data.data || [] };
    } catch (error: any) {
        console.error('Error fetching departments:', error);
        return {
            success: false,
            error: error.response?.data?.message || 'Failed to fetch departments',
        };
    }
};

// ============ POSITIONS API ============

export const getPositions = async (): Promise<ApiResponse<Position[]>> => {
    try {
        const response = await api.get('/positions');
        return { success: true, data: response.data.data || [] };
    } catch (error: any) {
        console.error('Error fetching positions:', error);
        return {
            success: false,
            error: error.response?.data?.message || 'Failed to fetch positions',
        };
    }
};

// ============ CARS API ============

export const getCarById = async (id: string): Promise<ApiResponse<Car>> => {
    try {
        const response = await api.get(`/cars/${id}`);
        return response.data;
    } catch (error: any) {
        return {
            success: false,
            error: error.response?.data?.message || 'Failed to fetch car',
        };
    }
};

// ============ BOOKINGS API ============

export const getUserBookings = async (_userId?: number): Promise<ApiResponse<Booking[]>> => {
    try {
        const response = await api.get('/bookings/my');
        return response.data;
    } catch (error: any) {
        return {
            success: false,
            error: error.response?.data?.message || 'Failed to fetch bookings',
        };
    }
};

export const getCarBookings = async (
    carId: string,
    date: string
): Promise<ApiResponse<Booking[]>> => {
    try {
        const response = await api.get(`/bookings/car/${carId}?date=${date}`);
        return response.data;
    } catch (error: any) {
        return {
            success: false,
            error: error.response?.data?.message || 'Failed to fetch car bookings',
        };
    }
};

export const createBooking = async (
    formData: BookingFormData
): Promise<ApiResponse<Booking>> => {
    try {
        const response = await api.post('/bookings', formData);
        return response.data;
    } catch (error: any) {
        return {
            success: false,
            error: error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to create booking',
        };
    }
};

export const cancelBooking = async (bookingId: string): Promise<ApiResponse<Booking>> => {
    try {
        const response = await api.post(`/bookings/${bookingId}/cancel`);
        return response.data;
    } catch (error: any) {
        return {
            success: false,
            error: error.response?.data?.message || 'Failed to cancel booking',
        };
    }
};

// ============ AVAILABILITY CHECK ============

export const checkAvailability = async (
    carId: string,
    dateTimeFrom: string,
    dateTimeTo: string
): Promise<ApiResponse<{ available: boolean; conflictingBookings?: Booking[] }>> => {
    try {
        const response = await api.get('/availability/check', {
            params: { carId, from: dateTimeFrom, to: dateTimeTo }
        });
        return response.data;
    } catch (error: any) {
        return {
            success: false,
            error: error.response?.data?.message || 'Failed to check availability',
        };
    }
};
