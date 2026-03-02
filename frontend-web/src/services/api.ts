import axios from 'axios';
import type { AxiosError, AxiosInstance } from 'axios';
import { API_BASE_URL, API_TIMEOUT } from '../constants';
import { storage } from '../utils';

function getAccessToken(): string | null {
  const rawToken = localStorage.getItem('accessToken');
  if (rawToken) return rawToken;
  const legacyToken = storage.get('auth_token');
  return typeof legacyToken === 'string' ? legacyToken : null;
}

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        const token = getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        const requestUrl = error.config?.url || '';
        const isAuthRequest = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/signup');

        if (error.response?.status === 401 && !isAuthRequest) {
          // Handle unauthorized
          storage.remove('auth_token');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('auth-storage');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth APIs
  auth = {
    login: (email: string, password: string) =>
      this.api.post('/auth/login', { email, password }),
    signup: (data: any) => this.api.post('/auth/signup', data),
    logout: () => this.api.post('/auth/logout'),
    refreshToken: () => this.api.post('/auth/refresh'),
    getCurrentUser: () => this.api.get('/auth/me'),
  };

  // Task APIs
  tasks = {
    getAll: (filters?: any) => this.api.get('/tasks', { params: filters }),
    getById: (id: string) => this.api.get(`/tasks/${id}`),
    create: (data: any) => this.api.post('/tasks', data),
    update: (id: string, data: any) => this.api.put(`/tasks/${id}`, data),
    delete: (id: string) => this.api.delete(`/tasks/${id}`),
    getByUser: (userId: string) => this.api.get(`/users/${userId}/tasks`),
  };

  // Bid APIs
  bids = {
    getAll: (taskId: string) => this.api.get(`/tasks/${taskId}/bids`),
    create: (taskId: string, data: any) => this.api.post(`/tasks/${taskId}/bids`, data),
    accept: (taskId: string, bidId: string) =>
      this.api.put(`/tasks/${taskId}/bids/${bidId}/accept`),
    reject: (taskId: string, bidId: string) =>
      this.api.put(`/tasks/${taskId}/bids/${bidId}/reject`),
  };

  // User APIs
  users = {
    getProfile: (id: string) => this.api.get(`/users/${id}`),
    updateProfile: (id: string, data: any) => this.api.put(`/users/${id}`, data),
    getRating: (id: string) => this.api.get(`/users/${id}/rating`),
    getReviews: (id: string) => this.api.get(`/users/${id}/reviews`),
    updateProfilePhoto: (profilePhotoUrl: string) =>
      this.api.patch('/users/me', { profilePhotoUrl }),
  };

  // Tracking APIs
  tracking = {
    getTracking: (taskId: string) => this.api.get(`/tracking/${taskId}`),
    updateLocation: (data: any) => this.api.post('/tracking/update', data),
    getHistory: (taskId: string) => this.api.get(`/tracking/${taskId}/history`),
  };

  // AI APIs
  ai = {
    predictPrice: (data: any) => this.api.post('/ai/predict-price', data),
    matchProviders: (data: any) => this.api.post('/ai/match-providers', data),
    analyzeSentiment: (text: string) => this.api.post('/ai/analyze-sentiment', { text }),
  };

  // Payment APIs
  payment = {
    createPaymentIntent: (data: any) => this.api.post('/payments/intent', data),
    confirmPayment: (paymentId: string) => this.api.post(`/payments/${paymentId}/confirm`),
    getTransactionHistory: () => this.api.get('/payments/history'),
  };

  // Review APIs
  reviews = {
    create: (taskId: string, data: any) => this.api.post(`/tasks/${taskId}/reviews`, data),
    getByTask: (taskId: string) => this.api.get(`/tasks/${taskId}/reviews`),
  };
}

export const api = new ApiService();
