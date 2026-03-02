import { TaskStatus } from "@/types";

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

export const formatCurrency = (amount: number): string => {
  if (!Number.isFinite(amount)) return "N/A";
  return `${Math.round(amount).toLocaleString("vi-VN")} đ`;
};

export const isTaskActive = (status: TaskStatus): boolean => {
  return !["Completed", "COMPLETED", "CANCELLED"].includes(status);
};

export const normalizeTaskStatus = (status: string | null | undefined): TaskStatus => {
  const value = (status || "").trim().toUpperCase();
  if (value === "POSTED") return "OPEN";
  if (value === "BIDDING") return "PENDING";
  if (value === "OPEN") return "OPEN";
  if (value === "PENDING") return "PENDING";
  if (value === "ASSIGNED") return "ASSIGNED";
  if (value === "IN_PROGRESS") return "IN_PROGRESS";
  if (value === "COMPLETED") return "COMPLETED";
  if (value === "CANCELLED") return "CANCELLED";
  return "OPEN";
};

export const formatTaskStatusLabel = (status: TaskStatus | string): string => {
  const normalized = normalizeTaskStatus(status);
  switch (normalized) {
    case "IN_PROGRESS":
      return "In Progress";
    case "ASSIGNED":
      return "Assigned";
    case "COMPLETED":
      return "Completed";
    case "CANCELLED":
      return "Cancelled";
    case "PENDING":
      return "Pending";
    case "OPEN":
    default:
      return "Open";
  }
};

export const formatCategoryLabel = (category: string): string => {
  return category
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};
