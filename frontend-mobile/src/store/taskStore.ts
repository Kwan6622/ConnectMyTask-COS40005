import { create } from "zustand";
import axios from "axios";
import { api } from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import {
  Dispute,
  Notification,
  PaymentTransaction,
  SavedTask,
  Task,
  TaskActivityLog,
  TaskProgressSummary,
  TaskProgressUpdate,
  TaskSubtask,
  User,
} from "@/types";
import { normalizeTaskStatus } from "@/utils/taskUtils";

interface TaskStore {
  tasks: Task[];
  currentTask: Task | null;
  requesterTasks: Task[];
  assignedTasks: Task[];
  suggestedTasks: Task[];
  savedTaskIds: Array<string | number>;
  savedTasks: SavedTask[];
  notifications: Notification[];
  taskProgressUpdates: TaskProgressUpdate[];
  taskSubtasks: TaskSubtask[];
  taskProgressSummary: TaskProgressSummary | null;
  taskDisputes: Dispute[];
  taskActivityLogs: TaskActivityLog[];
  taskPaymentTransactions: PaymentTransaction[];
  taskPaymentSummary: {
    escrowStatus?: string;
    paymentStatus?: string;
    escrowAmount?: number;
    escrowHeldAt?: string | null;
    escrowReleasedAt?: string | null;
  } | null;
  isLoading: boolean;
  error: string | null;
  fetchTasks: () => Promise<void>;
  fetchSuggestedTasks: () => Promise<void>;
  fetchTaskById: (taskId: string | number) => Promise<void>;
  createTask: (payload: {
    title: string;
    description: string;
    category: string;
    budget: number;
    maxBids?: number;
    aiSuggestedPrice?: number;
    location: string;
    createdById: number;
    imageUrls?: string[];
    dueDate?: string;
  }) => Promise<Task>;
  fetchRequesterTasks: () => Promise<void>;
  fetchAssignedTasks: () => Promise<void>;
  fetchSavedTasks: () => Promise<void>;
  saveTask: (taskId: string | number) => Promise<void>;
  unsaveTask: (taskId: string | number) => Promise<void>;
  fetchNotifications: () => Promise<void>;
  markNotificationRead: (notificationId: string | number) => Promise<void>;
  fetchTaskProgress: (taskId: string | number) => Promise<void>;
  updateTaskSubtaskStatus: (
    taskId: string | number,
    subtaskId: string | number,
    status: "PENDING" | "IN_PROGRESS" | "DONE"
  ) => Promise<void>;
  addTaskProgressUpdate: (
    taskId: string | number,
    payload: {
      progressPercent: number;
      note: string;
      attachments?: string[];
      milestoneStatus?: string;
      estimatedCompletionDate?: string;
      markAsCompleted?: boolean;
    }
  ) => Promise<void>;
  confirmTaskCompletion: (taskId: string | number) => Promise<void>;
  openTaskDispute: (
    taskId: string | number,
    payload: {
      reason: "PROVIDER_NOT_DELIVERING" | "REQUESTER_NOT_CONFIRMING" | "QUALITY_ISSUE" | "PAYMENT_ISSUE" | "OTHER";
      description: string;
      evidenceUrls?: string[];
    }
  ) => Promise<void>;
  cancelTaskByRequester: (taskId: string | number, reason: string) => Promise<void>;
  setTasks: (tasks: Task[]) => void;
  getTaskById: (id: string | number) => Task | undefined;
  clearCurrentTask: () => void;
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function hasAuthToken(): boolean {
  const token = useAuthStore.getState().token;
  return typeof token === "string" && token.trim().length > 0;
}

function isUnauthorizedError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 401;
}

function resetAuthSessionOnUnauthorized(error: unknown): void {
  if (!isUnauthorizedError(error)) return;
  const auth = useAuthStore.getState();
  if (auth.isAuthenticated) {
    auth.logout();
  }
}

function normalizeUser(raw: any): User | undefined {
  if (!raw) return undefined;

  const role = String(raw.role || "").toUpperCase() || "REQUESTER";
  return {
    id: raw.id,
    email: raw.email || "",
    fullName: raw.fullName || raw.name || "User",
    name: raw.name || raw.fullName || "User",
    role,
    accountType: role === "PROVIDER" ? "service_provider" : "client",
    phone: raw.phone || undefined,
    phoneNumber: raw.phone || undefined,
    location: raw.location || undefined,
    rating: raw.rating != null ? toNumber(raw.rating, 0) : 0,
    completedTasks: raw.completedTasks != null ? toNumber(raw.completedTasks, 0) : 0,
    profilePhotoUrl: raw.profilePhotoUrl || undefined,
    bio: raw.bio || undefined,
    isVerified: Boolean(raw.isVerified),
    createdAt: raw.createdAt || new Date().toISOString(),
  };
}

function normalizeTask(raw: any): Task {
  const budget = toNumber(raw?.budget, 0);
  const aiSuggestedPrice = raw?.aiSuggestedPrice != null ? toNumber(raw.aiSuggestedPrice, budget) : undefined;
  const createdAt = raw?.createdAt ? new Date(raw.createdAt).toISOString() : new Date().toISOString();
  const updatedAt = raw?.updatedAt ? new Date(raw.updatedAt).toISOString() : createdAt;
  const createdBy = normalizeUser(raw?.createdBy || raw?.client);
  const assignedProvider = normalizeUser(raw?.assignedProvider || raw?.provider);

  return {
    id: raw?.id,
    title: raw?.title || "Untitled task",
    description: raw?.description || "",
    category: String(raw?.category || "OTHER"),
    status: normalizeTaskStatus(raw?.status),
    location: raw?.location || "Unknown location",
    dueDate: raw?.dueDate || raw?.deadline || undefined,
    deadline: raw?.deadline || raw?.dueDate || undefined,
    isOverdue: Boolean(raw?.isOverdue),
    escrowStatus: raw?.escrowStatus || undefined,
    paymentStatus: raw?.paymentStatus || undefined,
    escrowAmount: raw?.escrowAmount != null ? toNumber(raw.escrowAmount, 0) : undefined,
    escrowHeldAt: raw?.escrowHeldAt || undefined,
    escrowReleasedAt: raw?.escrowReleasedAt || undefined,
    cancellationReason: raw?.cancellationReason || undefined,
    budget,
    isSuspicious: Boolean(raw?.isSuspicious),
    suspiciousReason: raw?.suspiciousReason || undefined,
    riskLevel: raw?.riskLevel || undefined,
    aiSuggestedPrice,
    maxBids: raw?.maxBids != null ? toNumber(raw.maxBids, 30) : 30,
    clientId: raw?.clientId ?? raw?.createdById ?? createdBy?.id,
    providerId: raw?.providerId ?? raw?.assignedProviderId ?? assignedProvider?.id,
    createdById: raw?.createdById ?? raw?.clientId ?? createdBy?.id,
    assignedProviderId: raw?.assignedProviderId ?? raw?.providerId ?? assignedProvider?.id,
    client: createdBy,
    provider: assignedProvider,
    createdBy,
    assignedProvider,
    bids: Array.isArray(raw?.bids) ? raw.bids : [],
    _count: raw?._count || undefined,
    matchingScore: raw?.matchingScore != null ? toNumber(raw.matchingScore, 0) : undefined,
    imageUrls: Array.isArray(raw?.imageUrls) ? raw.imageUrls : [],
    progressUpdates: Array.isArray(raw?.progressUpdates) ? raw.progressUpdates : [],
    createdAt,
    updatedAt,
  };
}

function getTaskList(payload: any): any[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  currentTask: null,
  requesterTasks: [],
  assignedTasks: [],
  suggestedTasks: [],
  savedTaskIds: [],
  savedTasks: [],
  notifications: [],
  taskProgressUpdates: [],
  taskSubtasks: [],
  taskProgressSummary: null,
  taskDisputes: [],
  taskActivityLogs: [],
  taskPaymentTransactions: [],
  taskPaymentSummary: null,
  isLoading: false,
  error: null,

  fetchTasks: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.tasks.getAll({
        sortBy: "createdAt",
        sortOrder: "desc",
      });
      const list = getTaskList(response.data);
      set({
        tasks: list.map(normalizeTask),
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error("Failed to fetch tasks", error);
      set({
        isLoading: false,
        error: "Cannot load tasks from server.",
      });
    }
  },

  fetchSuggestedTasks: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.tasks.getSuggestedMe();
      const list = getTaskList(response.data);
      set({
        suggestedTasks: list.map(normalizeTask),
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error("Failed to fetch suggested tasks", error);
      set({
        suggestedTasks: [],
        isLoading: false,
        error: "Cannot load suggested tasks from server.",
      });
    }
  },

  fetchTaskById: async (taskId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.tasks.getById(taskId);
      set({
        currentTask: normalizeTask(response.data),
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error("Failed to fetch task", error);
      set({
        isLoading: false,
        error: "Cannot load the task.",
      });
      throw error;
    }
  },

  createTask: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.tasks.create(payload);
      const created = normalizeTask(response.data);
      set((state) => ({
        tasks: [created, ...state.tasks],
        requesterTasks: [created, ...state.requesterTasks],
        isLoading: false,
        error: null,
      }));
      return created;
    } catch (error) {
      console.error("Failed to create task", error);
      set({
        isLoading: false,
        error: "Cannot create task.",
      });
      throw error;
    }
  },

  fetchRequesterTasks: async () => {
    try {
      const response = await api.tasks.getRequesterMe();
      const list = getTaskList(response.data);
      set({
        requesterTasks: list.map(normalizeTask),
      });
    } catch (error) {
      console.error("Failed to fetch requester tasks", error);
      set({ requesterTasks: [] });
    }
  },

  fetchAssignedTasks: async () => {
    try {
      const response = await api.tasks.getProviderAssignedMe();
      const list = getTaskList(response.data);
      set({
        assignedTasks: list.map(normalizeTask),
      });
    } catch (error) {
      console.error("Failed to fetch assigned tasks", error);
      set({ assignedTasks: [] });
    }
  },

  fetchSavedTasks: async () => {
    if (!hasAuthToken()) {
      set({
        savedTasks: [],
        savedTaskIds: [],
      });
      return;
    }

    try {
      const response = await api.tasks.getSavedMe();
      const list = getTaskList(response.data);
      const savedTasks = list
        .filter((item) => item?.task?.id != null)
        .map((item) => ({
          ...item,
          task: normalizeTask(item.task),
        })) as SavedTask[];
      set({
        savedTasks,
        savedTaskIds: savedTasks.map((item) => item.task.id),
      });
    } catch (error) {
      resetAuthSessionOnUnauthorized(error);
      if (!isUnauthorizedError(error)) {
        console.warn("Failed to fetch saved tasks", error);
      }
      set({
        savedTasks: [],
        savedTaskIds: [],
      });
    }
  },

  saveTask: async (taskId) => {
    await api.tasks.save(taskId);
    set((state) => ({
      savedTaskIds: state.savedTaskIds.some((id) => String(id) === String(taskId))
        ? state.savedTaskIds
        : [...state.savedTaskIds, taskId],
    }));
    await get().fetchSavedTasks();
  },

  unsaveTask: async (taskId) => {
    await api.tasks.unsave(taskId);
    set((state) => ({
      savedTaskIds: state.savedTaskIds.filter((id) => String(id) !== String(taskId)),
      savedTasks: state.savedTasks.filter((item) => String(item.task.id) !== String(taskId)),
    }));
  },

  fetchNotifications: async () => {
    if (!hasAuthToken()) {
      set({ notifications: [] });
      return;
    }

    try {
      const response = await api.notifications.getMine();
      const list = getTaskList(response.data);
      set({
        notifications: list.map((item) => ({
          id: item.id,
          message: item.message || "",
          title: item.task?.title || undefined,
          isRead: Boolean(item.isRead),
          createdAt: item.createdAt || new Date().toISOString(),
          task: item.task ? normalizeTask(item.task) : undefined,
          sender: normalizeUser(item.sender),
        })),
      });
    } catch (error) {
      resetAuthSessionOnUnauthorized(error);
      if (!isUnauthorizedError(error)) {
        console.warn("Failed to fetch notifications", error);
      }
      set({ notifications: [] });
    }
  },

  markNotificationRead: async (notificationId) => {
    try {
      await api.notifications.markRead(notificationId);
      set((state) => ({
        notifications: state.notifications.map((item) =>
          String(item.id) === String(notificationId) ? { ...item, isRead: true } : item
        ),
      }));
    } catch (error) {
      console.error("Failed to mark notification as read", error);
    }
  },

  fetchTaskProgress: async (taskId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.tasks.getProgress(taskId);
      const payload = response.data || {};
      set({
        currentTask: payload.task ? normalizeTask(payload.task) : null,
        taskProgressUpdates: Array.isArray(payload.updates) ? payload.updates : [],
        taskSubtasks: Array.isArray(payload.subtasks) ? payload.subtasks : [],
        taskProgressSummary: payload.summary || null,
        taskDisputes: Array.isArray(payload.disputes) ? payload.disputes : [],
        taskActivityLogs: Array.isArray(payload.activities) ? payload.activities : [],
        taskPaymentTransactions: Array.isArray(payload.payments) ? payload.payments : [],
        taskPaymentSummary: payload.paymentSummary || null,
        isLoading: false,
      });
    } catch (error) {
      console.error("Failed to fetch task progress", error);
      set({
        isLoading: false,
        error: "Cannot load task progress.",
      });
      throw error;
    }
  },

  addTaskProgressUpdate: async (taskId, payload) => {
    await api.tasks.addProgressUpdate(taskId, payload);
    await get().fetchTaskProgress(taskId);
  },

  updateTaskSubtaskStatus: async (taskId, subtaskId, status) => {
    await api.tasks.updateSubtaskStatus(taskId, subtaskId, status);
    await get().fetchTaskProgress(taskId);
  },

  confirmTaskCompletion: async (taskId) => {
    await api.tasks.confirmCompletion(taskId);
    await get().fetchTaskProgress(taskId);
  },

  openTaskDispute: async (taskId, payload) => {
    await api.tasks.openDispute(taskId, payload);
    await get().fetchTaskProgress(taskId);
  },

  cancelTaskByRequester: async (taskId, reason) => {
    await api.tasks.cancel(taskId, reason);
    await get().fetchTaskProgress(taskId);
  },

  setTasks: (tasks: Task[]) => set({ tasks }),

  getTaskById: (id: string | number) => get().tasks.find((task) => String(task.id) === String(id)),

  clearCurrentTask: () =>
    set({
      currentTask: null,
      taskProgressUpdates: [],
      taskSubtasks: [],
      taskProgressSummary: null,
      taskDisputes: [],
      taskActivityLogs: [],
      taskPaymentTransactions: [],
      taskPaymentSummary: null,
    }),
}));
