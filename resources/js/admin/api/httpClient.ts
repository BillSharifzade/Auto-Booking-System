import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

class HttpClient {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    this.initializeInterceptors();
  }

  private initializeInterceptors() {
    // Request interceptor.
    // CSRF: axios automatically mirrors Laravel's XSRF-TOKEN cookie into the
    // X-XSRF-TOKEN header, which stays fresh across login/logout.
    this.instance.interceptors.request.use(
      (config) => config,
      (error: AxiosError) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        return response.data;
      },
      (error: AxiosError) => {
        // Handle errors globally
        if (error.response) {
          // Session expired or not logged in — let the auth gate show the login screen
          if (error.response.status === 401 && !error.config?.url?.includes('/admin/login') && !error.config?.url?.includes('/admin/me')) {
            window.dispatchEvent(new CustomEvent('admin:unauthorized'));
          }
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.error('Response error:', error.response.data);
          return Promise.reject({
            status: error.response.status,
            message: (error.response.data as any)?.message || 'An error occurred',
            data: error.response.data,
          });
        } else if (error.request) {
          // The request was made but no response was received
          console.error('Request error:', error.request);
          return Promise.reject({
            status: 0,
            message: 'No response received from server',
          });
        } else {
          // Something happened in setting up the request that triggered an Error
          console.error('Error:', error.message);
          return Promise.reject({
            status: 0,
            message: error.message || 'An error occurred',
          });
        }
      }
    );
  }

  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.get<T>(url, config) as unknown as Promise<T>;
  }

  public async post<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.instance.post<T>(url, data, config) as unknown as Promise<T>;
  }

  public async put<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.instance.put<T>(url, data, config) as unknown as Promise<T>;
  }

  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.delete<T>(url, config) as unknown as Promise<T>;
  }

  public async patch<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.instance.patch<T>(url, data, config) as unknown as Promise<T>;
  }
}

export const httpClient = new HttpClient();
