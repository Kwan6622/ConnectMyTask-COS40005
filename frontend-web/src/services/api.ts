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
          window.location.href = '/';
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
    update: (id: string, data: any) => this.api.patch(`/tasks/${id}`, data),
    delete: (id: string) => this.api.delete(`/tasks/${id}`),
    getByUser: (userId: string) => this.api.get(`/users/${userId}/tasks`),
    getRequesterMe: () => this.api.get('/tasks/requester/me'),
    getProviderAssignedMe: () => this.api.get('/tasks/provider/assigned/me'),
    getSuggestedMe: () => this.api.get('/tasks/suggested/me'),
    updateStatus: (id: string, status: string) => this.api.patch(`/tasks/${id}/status`, { status }),
    assignProvider: (id: string, bidId: number) => this.api.patch(`/tasks/${id}/assign-provider`, { bidId }),
    getProgress: (id: string) => this.api.get(`/tasks/${id}/progress`),
    addProgressUpdate: (
      id: string,
      data: {
        progressPercent: number;
        note: string;
        attachments?: string[];
        milestoneStatus?: string;
        estimatedCompletionDate?: string;
        markAsCompleted?: boolean;
      }
    ) => this.api.post(`/tasks/${id}/progress`, data),
    updateSubtaskStatus: (
      id: string,
      subtaskId: string | number,
      status: 'PENDING' | 'IN_PROGRESS' | 'DONE'
    ) => this.api.patch(`/tasks/${id}/subtasks/${subtaskId}`, { status }),
    confirmCompletion: (id: string) => this.api.post(`/tasks/${id}/confirm-completion`),
    getActivity: (id: string) => this.api.get(`/tasks/${id}/activity`),
    getDisputes: (id: string) => this.api.get(`/tasks/${id}/disputes`),
    openDispute: (
      id: string,
      data: {
        reason: 'PROVIDER_NOT_DELIVERING' | 'REQUESTER_NOT_CONFIRMING' | 'QUALITY_ISSUE' | 'PAYMENT_ISSUE' | 'OTHER';
        description: string;
        evidenceUrls?: string[];
      }
    ) => this.api.post(`/tasks/${id}/disputes`, data),
    cancel: (id: string, reason: string) => this.api.post(`/tasks/${id}/cancel`, { reason }),
    save: (id: string) => this.api.post(`/tasks/${id}/save`),
    unsave: (id: string) => this.api.delete(`/tasks/${id}/save`),
    getSavedMe: () => this.api.get('/tasks/saved/me'),
  };

  // Bid APIs
  bids = {
    getAll: (taskId: string) => this.api.get(`/tasks/${taskId}/bids`),
    create: (taskId: string, data: any) => this.api.post(`/tasks/${taskId}/bids`, data),
    getProviderMe: () => this.api.get('/bids/provider/me'),
  };

  // User APIs
  users = {
    getProfile: (id: string) => this.api.get(`/users/${id}`),
    updateProfile: (id: string, data: any) => this.api.put(`/users/${id}`, data),
    getRating: (id: string) => this.api.get(`/users/${id}/rating`),
    getReviews: (id: string) => this.api.get(`/users/${id}/reviews`),
    updateProfilePhoto: (profilePhotoUrl: string) =>
      this.api.patch('/users/me', { profilePhotoUrl }),
    updateProviderProfile: (data: {
      address?: string;
      district?: string;
      city?: string;
      specialties?: string[];
      safetyComplianceAgreed?: boolean;
      shortBio?: string;
    }) => this.api.patch('/users/me/provider-profile', data),
    uploadProviderCertificate: (data: {
      title: string;
      certificateType: string;
      fileUrl: string;
    }) => this.api.post('/users/me/provider-certificates', data),
    verifyProviderCertificate: (
      certificateId: string | number,
      data: { verificationStatus: 'VERIFIED' | 'REJECTED'; rejectionReason?: string }
    ) => this.api.patch(`/users/provider-certificates/${certificateId}/verification`, data),
    getProviderRatingSummary: (providerId: string | number) =>
      this.api.get(`/users/providers/${providerId}/rating-summary`),
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

  // Chat assistant API
  chat = {
    send: (data: {
      message: string;
      history?: Array<{ role: 'user' | 'assistant'; content: string }>;
    }) => this.api.post('/chat', data),
  };

  // Payment APIs
  payment = {
    create: (data: { taskId: number; method?: 'STRIPE'; flow?: 'ESCROW_DEPOSIT' | 'DIRECT_PAYMENT' }) =>
      this.api.post('/payments/create', data),
    confirmSession: (sessionId: string) => this.api.post('/payments/confirm-session', { sessionId }),
    getMine: () => this.api.get('/payments/me'),
    getTask: (taskId: string | number) => this.api.get(`/payments/task/${taskId}`),
  };

  // Review APIs
  reviews = {
    create: (taskId: string, data: any) => this.api.post(`/tasks/${taskId}/reviews`, data),
    getByTask: (taskId: string) => this.api.get(`/tasks/${taskId}/reviews`),
  };

  // Notification APIs
  notifications = {
    contactClient: (data: { taskId: number }) =>
      this.api.post('/notifications/contact', data),
    getMine: () => this.api.get('/notifications/me'),
    markRead: (id: string) => this.api.patch(`/notifications/${id}/read`),
  };

  // Rating APIs
  ratings = {
    create: (data: { taskId: number; toUserId?: number; rating: number; comment?: string }) =>
      this.api.post('/ratings', data),
    getUserRatings: (userId: string | number) => this.api.get(`/users/${userId}/ratings`),
    getProviderRatings: (providerId: string | number) => this.api.get(`/providers/${providerId}/ratings`),
    getMyTaskRatingStatus: (taskId: string | number) => this.api.get(`/tasks/${taskId}/ratings/me`),
  };

  // Admin APIs
  admin = {
    getStats: () => this.api.get('/admin/stats'),
    getTasks: () => this.api.get('/admin/tasks'),
    getSuspiciousTasks: () => this.api.get('/admin/tasks/suspicious'),
    deleteTask: (taskId: string | number) => this.api.delete(`/admin/tasks/${taskId}`),
    reviewTask: (taskId: string | number) => this.api.patch(`/admin/tasks/${taskId}/reviewed`),
    getCertificates: () => this.api.get('/admin/certificates'),
    verifyCertificate: (certificateId: string | number) => this.api.patch(`/admin/certificates/${certificateId}/verify`),
    rejectCertificate: (certificateId: string | number) => this.api.patch(`/admin/certificates/${certificateId}/reject`),
    getPayments: () => this.api.get('/admin/payments'),
    getEscrowPayments: () => this.api.get('/admin/payments/escrow'),
    releasePayment: (paymentId: string | number) => this.api.patch(`/admin/payments/${paymentId}/release`),
  };

  // Platform public stats APIs
  platform = {
    getStats: () => this.api.get('/platform/stats'),
  };
}

export const api = new ApiService();
