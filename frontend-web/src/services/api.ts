import axios from "axios";
import Constants from "expo-constants";
import { Platform } from "react-native";

function isLoopbackHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0" || host === "::1";
}

function getExpoDebugHost(): string | null {
  const expoHostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as unknown as { manifest?: { debuggerHost?: string } }).manifest?.debuggerHost ||
    (Constants as unknown as { manifest2?: { extra?: { expoGo?: { debuggerHost?: string } } } }).manifest2?.extra
      ?.expoGo?.debuggerHost;

  if (!expoHostUri) return null;
  return expoHostUri.split(":")[0] || null;
}

function rewriteUrlHost(rawUrl: string, nextHost: string): string {
  try {
    const url = new URL(rawUrl);
    url.hostname = nextHost;
    return url.toString().replace(/\/$/, "");
  } catch {
    return rawUrl;
  }
}

function resolveApiBaseUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  const expoHost = getExpoDebugHost();
  const isAndroidEmulator = Platform.OS === "android" && Constants.isDevice === false;

  if (envUrl) {
    try {
      const envParsed = new URL(envUrl);
      if (!isLoopbackHost(envParsed.hostname)) return envUrl;

      // Android emulators cannot reach localhost of host machine directly.
      if (isAndroidEmulator) {
        return `http://10.0.2.2:${envParsed.port || "4000"}/api`;
      }

      // If env uses localhost but we have Expo debug host (physical device/LAN),
      // rewrite host so mobile can reach the backend on the dev machine.
      if (expoHost) {
        return rewriteUrlHost(envUrl, expoHost);
      }

      if (Platform.OS === "android") {
        return `http://10.0.2.2:${envParsed.port || "4000"}/api`;
      }
      return envUrl;
    } catch {
      return envUrl;
    }
  }

  if (expoHost) {
    return `http://${expoHost}:4000/api`;
  }

  if (isAndroidEmulator || Platform.OS === "android") {
    return "http://10.0.2.2:4000/api";
  }

  return "http://127.0.0.1:4000/api";
}

const API_BASE_URL = resolveApiBaseUrl();
let accessToken: string | null = null;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

export function setApiAccessToken(token: string | null): void {
  accessToken = token;
}

apiClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  } else if (config.headers.Authorization) {
    delete config.headers.Authorization;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

class ApiService {
  auth = {
    login: (email: string, password: string) => apiClient.post("/auth/login", { email, password }),
    signup: (data: any) => apiClient.post("/auth/signup", data),
    logout: () => apiClient.post("/auth/logout"),
    refreshToken: () => apiClient.post("/auth/refresh"),
    getCurrentUser: () => apiClient.get("/auth/me"),
  };

  tasks = {
    getAll: (filters?: any) => apiClient.get("/tasks", { params: filters }),
    getById: (id: string | number) => apiClient.get(`/tasks/${id}`),
    create: (data: any) => apiClient.post("/tasks", data),
    update: (id: string | number, data: any) => apiClient.patch(`/tasks/${id}`, data),
    delete: (id: string | number) => apiClient.delete(`/tasks/${id}`),
    getRequesterMe: () => apiClient.get("/tasks/requester/me"),
    getProviderAssignedMe: () => apiClient.get("/tasks/provider/assigned/me"),
    getSuggestedMe: () => apiClient.get("/tasks/suggested/me"),
    updateStatus: (id: string | number, status: string) => apiClient.patch(`/tasks/${id}/status`, { status }),
    assignProvider: (id: string | number, bidId: number) => apiClient.patch(`/tasks/${id}/assign-provider`, { bidId }),
    getProgress: (id: string | number) => apiClient.get(`/tasks/${id}/progress`),
    updateSubtaskStatus: (
      id: string | number,
      subtaskId: string | number,
      status: "PENDING" | "IN_PROGRESS" | "DONE"
    ) => apiClient.patch(`/tasks/${id}/subtasks/${subtaskId}`, { status }),
    addProgressUpdate: (
      id: string | number,
      data: {
        progressPercent: number;
        note: string;
        attachments?: string[];
        milestoneStatus?: string;
        estimatedCompletionDate?: string;
        markAsCompleted?: boolean;
      }
    ) => apiClient.post(`/tasks/${id}/progress`, data),
    confirmCompletion: (id: string | number) => apiClient.post(`/tasks/${id}/confirm-completion`),
    openDispute: (
      id: string | number,
      data: {
        reason: "PROVIDER_NOT_DELIVERING" | "REQUESTER_NOT_CONFIRMING" | "QUALITY_ISSUE" | "PAYMENT_ISSUE" | "OTHER";
        description: string;
        evidenceUrls?: string[];
      }
    ) => apiClient.post(`/tasks/${id}/disputes`, data),
    cancel: (id: string | number, reason: string) => apiClient.post(`/tasks/${id}/cancel`, { reason }),
    save: (id: string | number) => apiClient.post(`/tasks/${id}/save`),
    unsave: (id: string | number) => apiClient.delete(`/tasks/${id}/save`),
    getSavedMe: () => apiClient.get("/tasks/saved/me"),
  };

  bids = {
    getAll: (taskId: string | number) => apiClient.get(`/tasks/${taskId}/bids`),
    create: (taskId: string | number, data: any) => apiClient.post(`/tasks/${taskId}/bids`, data),
    getProviderMe: () => apiClient.get("/bids/provider/me"),
  };

  users = {
    getProfile: (id: string | number) => apiClient.get(`/users/${id}`),
    updateProfilePhoto: (profilePhotoUrl: string) => apiClient.patch("/users/me", { profilePhotoUrl }),
    updateProviderProfile: (data: {
      address?: string;
      district?: string;
      city?: string;
      specialties?: string[];
      safetyComplianceAgreed?: boolean;
      shortBio?: string;
    }) => apiClient.patch("/users/me/provider-profile", data),
    uploadProviderCertificate: (data: {
      title: string;
      certificateType: string;
      fileUrl: string;
    }) => apiClient.post("/users/me/provider-certificates", data),
  };

  notifications = {
    contactClient: (data: { taskId: number }) => apiClient.post("/notifications/contact", data),
    getMine: () => apiClient.get("/notifications/me"),
    markRead: (id: string | number) => apiClient.patch(`/notifications/${id}/read`),
  };

  payments = {
    create: (data: {
      taskId: number;
      method?: "STRIPE";
      flow?: "ESCROW_DEPOSIT" | "DIRECT_PAYMENT";
    }) => apiClient.post("/payments/create", data),
    confirmSession: (sessionId: string) => apiClient.post("/payments/confirm-session", { sessionId }),
    getMine: () => apiClient.get("/payments/me"),
    getByTask: (taskId: string | number) => apiClient.get(`/payments/task/${taskId}`),
  };

  chat = {
    send: (data: {
      message: string;
      history?: Array<{ role: "user" | "assistant"; content: string }>;
    }) => apiClient.post("/chat", data),
  };

  ai = {
    predictPrice: (data: {
      title?: string;
      category: string;
      location: string;
      budget?: number;
      description?: string;
      complexity?: "LOW" | "MEDIUM" | "HIGH";
      urgency?: "LOW" | "NORMAL" | "HIGH";
    }) => apiClient.post("/ai/predict-price", data),
  };

  ratings = {
    create: (data: { taskId: number; toUserId?: number; rating: number; comment?: string }) =>
      apiClient.post("/ratings", data),
    getUserRatings: (userId: string | number) => apiClient.get(`/users/${userId}/ratings`),
    getMyTaskRatingStatus: (taskId: string | number) => apiClient.get(`/tasks/${taskId}/ratings/me`),
  };

  admin = {
    getStats: () => apiClient.get("/admin/stats"),
    getTasks: () => apiClient.get("/admin/tasks"),
    getSuspiciousTasks: () => apiClient.get("/admin/tasks/suspicious"),
    deleteTask: (taskId: string | number) => apiClient.delete(`/admin/tasks/${taskId}`),
    reviewTask: (taskId: string | number) => apiClient.patch(`/admin/tasks/${taskId}/reviewed`),
    getCertificates: () => apiClient.get("/admin/certificates"),
    verifyCertificate: (certificateId: string | number) => apiClient.patch(`/admin/certificates/${certificateId}/verify`),
    rejectCertificate: (certificateId: string | number) => apiClient.patch(`/admin/certificates/${certificateId}/reject`),
    getPayments: () => apiClient.get("/admin/payments"),
    getEscrowPayments: () => apiClient.get("/admin/payments/escrow"),
    releasePayment: (paymentId: string | number) => apiClient.patch(`/admin/payments/${paymentId}/release`),
  };
}

export const api = new ApiService();
export default apiClient;
