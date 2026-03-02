import { create } from "zustand";
import apiClient from "@/services/api";
import { Task } from "@/types";
import { normalizeTaskStatus } from "@/utils/taskUtils";

interface TaskStore {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  fetchTasks: () => Promise<void>;
  createTask: (payload: {
    title: string;
    description: string;
    category: string;
    budget: number;
    location: string;
    createdById: number;
    imageUrls?: string[];
  }) => Promise<Task>;
  addTask: (task: Task) => void;
  removeTask: (id: string | number) => void;
  updateTask: (id: string | number, task: Partial<Task>) => void;
  setTasks: (tasks: Task[]) => void;
  getTaskById: (id: string | number) => Task | undefined;
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function toTask(raw: any): Task {
  const budget = toNumber(raw.budget, 0);
  const aiSuggestedPrice = raw.aiSuggestedPrice != null ? toNumber(raw.aiSuggestedPrice, budget) : undefined;
  const createdAt = raw.createdAt ? new Date(raw.createdAt).toISOString() : new Date().toISOString();
  const updatedAt = raw.updatedAt ? new Date(raw.updatedAt).toISOString() : createdAt;

  return {
    id: raw.id,
    title: raw.title || "Untitled task",
    description: raw.description || "",
    category: String(raw.category || "OTHER"),
    location: raw.location || "Unknown location",
    budget,
    deadline: raw.deadline || undefined,
    status: normalizeTaskStatus(raw.status),
    aiSuggestedPrice,
    createdAt,
    updatedAt,
    clientName: raw.client?.fullName || raw.createdBy?.name || raw.createdBy?.fullName || "Anonymous",
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
  isLoading: false,
  error: null,

  fetchTasks: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get("/tasks");
      const list = getTaskList(response.data);
      set({
        tasks: list.map(toTask),
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

  createTask: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post("/tasks", payload);
      const created = toTask(response.data);
      set((state) => ({
        tasks: [created, ...state.tasks],
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

  addTask: (task: Task) =>
    set((state) => ({
      tasks: [{ ...task, id: String(task.id) }, ...state.tasks],
    })),

  removeTask: (id: string | number) =>
    set((state) => ({
      tasks: state.tasks.filter((task) => String(task.id) !== String(id)),
    })),

  updateTask: (id: string | number, updates: Partial<Task>) =>
    set((state) => ({
      tasks: state.tasks.map((task) => (String(task.id) === String(id) ? { ...task, ...updates } : task)),
    })),

  setTasks: (tasks: Task[]) => set({ tasks }),

  getTaskById: (id: string | number) => get().tasks.find((task) => String(task.id) === String(id)),
}));
