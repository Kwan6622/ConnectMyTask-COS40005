import { create } from 'zustand';
import type {
  Dispute,
  PaymentTransaction,
  SavedTask,
  Task,
  TaskActivityLog,
  TaskProgressSummary,
  TaskSubtask,
  TaskProgressUpdate,
} from '../types';
import { TaskStatus, TaskCategory } from '../types';
import { api } from '../services/api';
import { useAuthStore } from './auth.store';

function normalizeTaskStatus(status: string | undefined): TaskStatus {
  const upper = String(status || '').toUpperCase();
  if (upper === 'POSTED') return TaskStatus.OPEN;
  return (upper as TaskStatus) || TaskStatus.OPEN;
}

function normalizeTask(task: Task): Task {
  return {
    ...task,
    status: normalizeTaskStatus(task.status),
    clientId: task.clientId ?? task.createdById,
    providerId: task.providerId ?? task.assignedProviderId,
    client: task.client || task.createdBy,
    provider: task.provider || task.assignedProvider,
  };
}

function getSavedTaskTaskId(item: SavedTask | any): string {
  // Backend shape can be either { task: { id } } or include taskId directly.
  return String(item?.task?.id ?? item?.taskId ?? '');
}

interface TaskState {
  tasks: Task[];
  currentTask: Task | null;
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
  requesterTasks: Task[];
  assignedTasks: Task[];
  myBids: any[];
  savedTaskIds: Array<string | number>;
  savedTasks: SavedTask[];
  filters: {
    search?: string;
    category?: TaskCategory;
    status?: TaskStatus;
    location?: string;
    minBudget?: number;
    maxBudget?: number;
    sortBy: 'createdAt' | 'budget' | 'deadline';
    sortOrder: 'asc' | 'desc';
  };
  isLoading: boolean;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };

  // Actions
  setFilters: (filters: Partial<TaskState['filters']>) => void;
  clearFilters: () => void;
  fetchTasks: (page?: number) => Promise<void>;
  fetchTaskById: (taskId: string) => Promise<void>;
  fetchTaskProgress: (taskId: string) => Promise<void>;
  addTaskProgressUpdate: (
    taskId: string,
    payload: {
      progressPercent: number;
      note: string;
      attachments?: string[];
      milestoneStatus?: string;
      estimatedCompletionDate?: string;
      markAsCompleted?: boolean;
    }
  ) => Promise<void>;
  updateTaskSubtaskStatus: (
    taskId: string,
    subtaskId: string | number,
    status: 'PENDING' | 'IN_PROGRESS' | 'DONE'
  ) => Promise<void>;
  confirmTaskCompletion: (taskId: string) => Promise<void>;
  openTaskDispute: (
    taskId: string,
    payload: {
      reason: 'PROVIDER_NOT_DELIVERING' | 'REQUESTER_NOT_CONFIRMING' | 'QUALITY_ISSUE' | 'PAYMENT_ISSUE' | 'OTHER';
      description: string;
      evidenceUrls?: string[];
    }
  ) => Promise<void>;
  cancelTaskByRequester: (taskId: string, reason: string) => Promise<void>;
  createTask: (data: any) => Promise<Task>;
  updateTask: (taskId: string, data: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  submitBid: (taskId: string, bidData: any) => Promise<void>;
  assignProvider: (taskId: string, bidId: number) => Promise<void>;
  updateTaskStatus: (taskId: string, status: string) => Promise<void>;
  fetchRequesterTasks: () => Promise<void>;
  fetchAssignedTasks: () => Promise<void>;
  fetchMyBids: () => Promise<void>;
  saveTask: (taskId: string) => Promise<void>;
  unsaveTask: (taskId: string) => Promise<void>;
  fetchSavedTasks: () => Promise<void>;
  clearCurrentTask: () => void;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  currentTask: null,
  taskProgressUpdates: [],
  taskSubtasks: [],
  taskProgressSummary: null,
  taskDisputes: [],
  taskActivityLogs: [],
  taskPaymentTransactions: [],
  taskPaymentSummary: null,
  requesterTasks: [],
  assignedTasks: [],
  myBids: [],
  savedTaskIds: [],
  savedTasks: [],
  filters: {
    sortBy: 'createdAt',
    sortOrder: 'desc',
  },
  isLoading: false,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },

  setFilters: (newFilters) => {
    set((state) => ({ 
      filters: { ...state.filters, ...newFilters },
      pagination: { ...state.pagination, page: 1 }
    }));
  },

  clearFilters: () => {
    set((state) => ({
      filters: {
        sortBy: 'createdAt',
        sortOrder: 'desc',
      },
      pagination: { ...state.pagination, page: 1 }
    }));
  },

  fetchTasks: async (page = 1) => {
    set({ isLoading: true });
    try {
      const { pagination } = get();
      const response = await api.tasks.getAll({
        page,
        limit: pagination.limit,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      const data = response.data;
      const items = Array.isArray(data) ? data : data.items;
      const normalizedItems = (items as Task[]).map(normalizeTask);
      const total = Array.isArray(data) ? data.length : data.total;
      const totalPages = Array.isArray(data)
        ? Math.max(1, Math.ceil(data.length / pagination.limit))
        : data.totalPages;

      set({
        tasks: normalizedItems,
        pagination: {
          page: Array.isArray(data) ? page : data.page,
          limit: Array.isArray(data) ? pagination.limit : data.limit,
          total,
          totalPages,
        },
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to fetch tasks from API:', error);
      set({ isLoading: false });
    }
  },

  fetchTaskById: async (taskId: string) => {
    set({ isLoading: true });
    try {
      const response = await api.tasks.getById(taskId);
      set({ 
        currentTask: normalizeTask(response.data),
        taskProgressUpdates: [],
        taskSubtasks: [],
        taskProgressSummary: null,
        taskDisputes: [],
        taskActivityLogs: [],
        taskPaymentTransactions: [],
        taskPaymentSummary: null,
        isLoading: false 
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  fetchTaskProgress: async (taskId: string) => {
    set({ isLoading: true });
    try {
      const response = await api.tasks.getProgress(taskId);
      const payload = response.data || {};
      const task = payload.task ? normalizeTask(payload.task) : null;
      set({
        currentTask: task,
        taskProgressUpdates: payload.updates || [],
        taskSubtasks: payload.subtasks || [],
        taskProgressSummary: payload.summary || null,
        taskDisputes: payload.disputes || [],
        taskActivityLogs: payload.activities || [],
        taskPaymentTransactions: payload.payments || [],
        taskPaymentSummary: payload.paymentSummary || null,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  addTaskProgressUpdate: async (taskId: string, payload) => {
    await api.tasks.addProgressUpdate(taskId, payload);
    await get().fetchTaskProgress(taskId);
    const response = await api.tasks.getById(taskId);
    const nextTask = normalizeTask(response.data);
    set((state) => ({
      currentTask: nextTask,
      tasks: state.tasks.map((task) => (String(task.id) === String(taskId) ? nextTask : task)),
      requesterTasks: state.requesterTasks.map((task) => (String(task.id) === String(taskId) ? nextTask : task)),
      assignedTasks: state.assignedTasks.map((task) => (String(task.id) === String(taskId) ? nextTask : task)),
    }));
  },

  updateTaskSubtaskStatus: async (taskId: string, subtaskId: string | number, status: 'PENDING' | 'IN_PROGRESS' | 'DONE') => {
    await api.tasks.updateSubtaskStatus(taskId, subtaskId, status);
    await get().fetchTaskProgress(taskId);
  },

  confirmTaskCompletion: async (taskId: string) => {
    await api.tasks.confirmCompletion(taskId);
    await get().fetchTaskProgress(taskId);
    const response = await api.tasks.getById(taskId);
    const nextTask = normalizeTask(response.data);
    set((state) => ({
      currentTask: nextTask,
      tasks: state.tasks.map((task) => (String(task.id) === String(taskId) ? nextTask : task)),
      requesterTasks: state.requesterTasks.map((task) => (String(task.id) === String(taskId) ? nextTask : task)),
      assignedTasks: state.assignedTasks.map((task) => (String(task.id) === String(taskId) ? nextTask : task)),
    }));
  },

  openTaskDispute: async (taskId: string, payload) => {
    await api.tasks.openDispute(taskId, payload);
    await get().fetchTaskProgress(taskId);
    const response = await api.tasks.getById(taskId);
    const nextTask = normalizeTask(response.data);
    set((state) => ({
      currentTask: nextTask,
      tasks: state.tasks.map((task) => (String(task.id) === String(taskId) ? nextTask : task)),
      requesterTasks: state.requesterTasks.map((task) => (String(task.id) === String(taskId) ? nextTask : task)),
      assignedTasks: state.assignedTasks.map((task) => (String(task.id) === String(taskId) ? nextTask : task)),
    }));
  },

  cancelTaskByRequester: async (taskId: string, reason: string) => {
    await api.tasks.cancel(taskId, reason);
    const response = await api.tasks.getById(taskId);
    const nextTask = normalizeTask(response.data);
    set((state) => ({
      currentTask: nextTask,
      tasks: state.tasks.map((task) => (String(task.id) === String(taskId) ? nextTask : task)),
      requesterTasks: state.requesterTasks.map((task) => (String(task.id) === String(taskId) ? nextTask : task)),
      assignedTasks: state.assignedTasks.map((task) => (String(task.id) === String(taskId) ? nextTask : task)),
    }));
  },

  createTask: async (data) => {
    set({ isLoading: true });
    try {
      const response = await api.tasks.create(data);
      const newTask = normalizeTask(response.data);
      
      set((state) => ({
        tasks: [newTask, ...state.tasks],
        isLoading: false,
      }));
      
      return newTask;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  updateTask: async (taskId: string, data) => {
    set({ isLoading: true });
    try {
      await api.tasks.update(taskId, data);
      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === taskId ? { ...task, ...data } : task
        ),
        currentTask: state.currentTask?.id === taskId 
          ? { ...state.currentTask, ...data } 
          : state.currentTask,
        isLoading: false,
      }));
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  deleteTask: async (taskId: string) => {
    set({ isLoading: true });
    try {
      await api.tasks.delete(taskId);
      set((state) => ({
        tasks: state.tasks.filter((task) => task.id !== taskId),
        currentTask: state.currentTask?.id === taskId ? null : state.currentTask,
        isLoading: false,
      }));
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  submitBid: async (_taskId: string, _bidData: any) => {
    const role = String(useAuthStore.getState().user?.role || '').toUpperCase();
    if (role !== 'PROVIDER') {
      throw new Error('Only providers can submit bids');
    }
    await api.bids.create(_taskId, _bidData);
    const response = await api.tasks.getById(_taskId);
    set({ currentTask: normalizeTask(response.data) });
  },

  assignProvider: async (taskId: string, bidId: number) => {
    await api.tasks.assignProvider(taskId, bidId);
    const response = await api.tasks.getById(taskId);
    set({ currentTask: normalizeTask(response.data) });
  },

  updateTaskStatus: async (taskId: string, status: string) => {
    const response = await api.tasks.updateStatus(taskId, status);
    const nextTask = normalizeTask(response.data);
    set((state) => ({
      currentTask: state.currentTask?.id === taskId ? nextTask : state.currentTask,
      tasks: state.tasks.map((task) => (String(task.id) === String(taskId) ? nextTask : task)),
      requesterTasks: state.requesterTasks.map((task) => (String(task.id) === String(taskId) ? nextTask : task)),
      assignedTasks: state.assignedTasks.map((task) => (String(task.id) === String(taskId) ? nextTask : task)),
    }));
  },

  fetchRequesterTasks: async () => {
    const response = await api.tasks.getRequesterMe();
    set({ requesterTasks: (response.data as Task[]).map(normalizeTask) });
  },

  fetchAssignedTasks: async () => {
    const response = await api.tasks.getProviderAssignedMe();
    set({ assignedTasks: (response.data as Task[]).map(normalizeTask) });
  },

  fetchMyBids: async () => {
    const response = await api.bids.getProviderMe();
    set({ myBids: response.data || [] });
  },

  saveTask: async (taskId: string) => {
    await api.tasks.save(taskId);
    set((state) => {
      const exists = state.savedTaskIds.some((id) => String(id) === String(taskId));
      if (exists) return state;
      return { savedTaskIds: [...state.savedTaskIds, taskId] };
    });
  },

  unsaveTask: async (taskId: string) => {
    await api.tasks.unsave(taskId);
    set((state) => ({
      savedTaskIds: state.savedTaskIds.filter((id) => String(id) !== String(taskId)),
      savedTasks: state.savedTasks.filter((item) => getSavedTaskTaskId(item) !== String(taskId)),
    }));
  },

  fetchSavedTasks: async () => {
    try {
      const response = await api.tasks.getSavedMe();
      const saved = (response.data as SavedTask[]).filter((item: any) => item?.task?.id != null);
      const uniqueTaskIds = Array.from(new Set(saved.map((item) => getSavedTaskTaskId(item))));
      set({
        savedTasks: saved.map((item) => ({
          ...item,
          task: normalizeTask(item.task),
        })),
        savedTaskIds: uniqueTaskIds,
      });
    } catch (error) {
      console.error('Failed to fetch saved tasks:', error);
    }
  },

  clearCurrentTask: () =>
    set({
      currentTask: null,
      taskProgressUpdates: [],
      taskProgressSummary: null,
      taskDisputes: [],
      taskActivityLogs: [],
      taskPaymentTransactions: [],
      taskPaymentSummary: null,
    }),
}));
