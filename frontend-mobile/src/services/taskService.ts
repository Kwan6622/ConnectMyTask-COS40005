import apiClient from "./api";
import { Task } from "@/types";

export const taskService = {
  getAllTasks: async (): Promise<Task[]> => {
    const { data } = await apiClient.get("/tasks");
    return data;
  },

  getTaskById: async (id: string): Promise<Task> => {
    const { data } = await apiClient.get(`/tasks/${id}`);
    return data;
  },

  createTask: async (task: Omit<Task, "id" | "createdAt" | "updatedAt">): Promise<Task> => {
    const { data } = await apiClient.post("/tasks", task);
    return data;
  },

  updateTask: async (id: string, task: Partial<Task>): Promise<Task> => {
    const { data } = await apiClient.put(`/tasks/${id}`, task);
    return data;
  },

  deleteTask: async (id: string): Promise<void> => {
    await apiClient.delete(`/tasks/${id}`);
  },

  completeTask: async (id: string): Promise<Task> => {
    const { data } = await apiClient.patch(`/tasks/${id}`, { status: "Completed" });
    return data;
  },
};
