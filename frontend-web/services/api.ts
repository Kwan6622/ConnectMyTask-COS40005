import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiService {
  private api: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => response.data,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('accessToken');
          window.location.href = '/login';
        }
        return Promise.reject(error.response?.data || error);
      }
    );
  }

  // Auth APIs
  auth = {
    login: (email: string, password: string) =>
      this.api.post('/auth/login', { email, password }),
    
    register: (data: {
      email: string;
      password: string;
      fullName: string;
      role: 'CLIENT' | 'PROVIDER';
      phone?: string;
    }) => this.api.post('/auth/register', data),
    
    logout: () => this.api.post('/auth/logout'),
    
    refreshToken: () => this.api.post('/auth/refresh'),
    
    forgotPassword: (email: string) =>
      this.api.post('/auth/forgot-password', { email }),
    
    resetPassword: (token: string, newPassword: string) =>
      this.api.post('/auth/reset-password', { token, newPassword }),
  };

  // Task APIs
  task = {
    // Create task
    create: (data: {
      title: string;
      description: string;
      category: string;
      location: string;
      latitude?: number;
      longitude?: number;
      budget?: number;
      deadline?: string;
    }) => this.api.post('/tasks', data),
    
    // Get tasks with filters
    getAll: (params?: {
      page?: number;
      limit?: number;
      category?: string;
      status?: string;
      location?: string;
      minBudget?: number;
      maxBudget?: number;
      sortBy?: string;
    }) => this.api.get('/tasks', { params }),
    
    // Get single task
    getById: (taskId: string) => this.api.get(`/tasks/${taskId}`),
    
    // Update task
    update: (taskId: string, data: Partial<Task>) =>
      this.api.put(`/tasks/${taskId}`, data),
    
    // Delete task
    delete: (taskId: string) => this.api.delete(`/tasks/${taskId}`),
    
    // Get user's tasks
    getMyTasks: (params?: {
      role?: 'client' | 'provider';
      status?: string;
    }) => this.api.get('/tasks/my-tasks', { params }),
  };

  // Bid APIs
  bid = {
    create: (taskId: string, data: { amount: number; message?: string; estimatedTime?: string }) =>
      this.api.post(`/tasks/${taskId}/bids`, data),
    
    getTaskBids: (taskId: string) =>
      this.api.get(`/tasks/${taskId}/bids`),
    
    acceptBid: (taskId: string, bidId: string) =>
      this.api.post(`/tasks/${taskId}/bids/${bidId}/accept`),
    
    rejectBid: (taskId: string, bidId: string) =>
      this.api.post(`/tasks/${taskId}/bids/${bidId}/reject`),
  };

  // AI Service APIs
  ai = {
    predictPrice: (data: {
      category: string;
      location: string;
      budget?: number;
      complexity?: 'LOW' | 'MEDIUM' | 'HIGH';
      urgency?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    }) => this.api.post('/ai/predict-price', data),
    
    matchProviders: (taskId: string) =>
      this.api.get(`/ai/tasks/${taskId}/matches`),
    
    analyzeSentiment: (text: string) =>
      this.api.post('/ai/analyze-sentiment', { text }),
  };

  // Tracking APIs
  tracking = {
    updateLocation: (data: {
      taskId: string;
      latitude: number;
      longitude: number;
      accuracy: number;
    }) => this.api.post('/tracking/update', data),
    
    getTaskTracking: (taskId: string) =>
      this.api.get(`/tracking/tasks/${taskId}`),
    
    verifyLocation: (taskId: string) =>
      this.api.post(`/tracking/tasks/${taskId}/verify`),
  };

  // User APIs
  user = {
    getProfile: () => this.api.get('/users/profile'),
    
    updateProfile: (data: Partial<User>) =>
      this.api.put('/users/profile', data),
    
    uploadAvatar: (file: File) => {
      const formData = new FormData();
      formData.append('avatar', file);
      return this.api.post('/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    
    updateSkills: (skills: string[]) =>
      this.api.put('/users/skills', { skills }),
    
    getProviderStats: () => this.api.get('/users/provider-stats'),
  };

  // Review APIs
  review = {
    create: (taskId: string, data: {
      rating: number;
      comment: string;
    }) => this.api.post(`/reviews/tasks/${taskId}`, data),
    
    getTaskReviews: (taskId: string) =>
      this.api.get(`/reviews/tasks/${taskId}`),
    
    getUserReviews: (userId: string) =>
      this.api.get(`/reviews/users/${userId}`),
  };

  // Payment APIs
  payment = {
    createPaymentIntent: (taskId: string, amount: number) =>
      this.api.post('/payments/create-intent', { taskId, amount }),
    
    confirmPayment: (paymentIntentId: string) =>
      this.api.post('/payments/confirm', { paymentIntentId }),
    
    getTransactionHistory: (params?: {
      page?: number;
      limit?: number;
    }) => this.api.get('/payments/history', { params }),
  };

  // Admin APIs
  admin = {
    getDashboard: () => this.api.get('/admin/dashboard'),
    
    getAllUsers: (params?: {
      page?: number;
      limit?: number;
      role?: string;
      status?: string;
    }) => this.api.get('/admin/users', { params }),
    
    updateUserStatus: (userId: string, status: string) =>
      this.api.put(`/admin/users/${userId}/status`, { status }),
    
    getAllTasks: (params?: {
      page?: number;
      limit?: number;
      status?: string;
      category?: string;
    }) => this.api.get('/admin/tasks', { params }),
    
    getAnalytics: (period?: 'day' | 'week' | 'month' | 'year') =>
      this.api.get('/admin/analytics', { params: { period } }),
  };
}

export const api = new ApiService();