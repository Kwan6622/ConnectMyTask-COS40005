import { create } from 'zustand';
import type { Task } from '../types';
import { TaskStatus, TaskCategory } from '../types';
import { api } from '../services/api';

interface TaskState {
  tasks: Task[];
  currentTask: Task | null;
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
  createTask: (data: any) => Promise<Task>;
  updateTask: (taskId: string, data: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  submitBid: (taskId: string, bidData: any) => Promise<void>;
  clearCurrentTask: () => void;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  currentTask: null,
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
    get().fetchTasks(1);
  },

  clearFilters: () => {
    set((state) => ({
      filters: {
        sortBy: 'createdAt',
        sortOrder: 'desc',
      },
      pagination: { ...state.pagination, page: 1 }
    }));
    get().fetchTasks(1);
  },

  fetchTasks: async (page = 1) => {
    set({ isLoading: true });
    try {
      const { filters, pagination } = get();
      const response = await api.tasks.getAll({
        page,
        limit: pagination.limit,
        ...filters,
      });

      const data = response.data;
      const items = Array.isArray(data) ? data : data.items;
      const total = Array.isArray(data) ? data.length : data.total;
      const totalPages = Array.isArray(data)
        ? Math.max(1, Math.ceil(data.length / pagination.limit))
        : data.totalPages;

      set({
        tasks: items,
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
        currentTask: response.data,
        isLoading: false 
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  createTask: async (data) => {
    set({ isLoading: true });
    try {
      const response = await api.tasks.create(data);
      const newTask = response.data;
      
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
    set({ isLoading: true });
    try {
      // Mock implementation
      set({ isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  clearCurrentTask: () => set({ currentTask: null }),
}));
