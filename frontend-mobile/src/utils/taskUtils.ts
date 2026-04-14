import { Task, TaskStatus, User } from "@/types";

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
  return `${Math.round(amount).toLocaleString("en-US")} VND`;
};

export const isTaskActive = (status: TaskStatus | string): boolean => {
  const normalized = normalizeTaskStatus(status);
  return ![TaskStatus.COMPLETED, TaskStatus.PAID, TaskStatus.CANCELLED].includes(normalized);
};

export const isTaskBrowsable = (task: Pick<Task, "status" | "isOverdue" | "assignedProviderId">): boolean => {
  const normalized = normalizeTaskStatus(task.status);
  if ([TaskStatus.ASSIGNED, TaskStatus.COMPLETED, TaskStatus.PAID, TaskStatus.CANCELLED].includes(normalized)) {
    return false;
  }
  if (Boolean(task.isOverdue) && !task.assignedProviderId) {
    return false;
  }
  return true;
};

export const normalizeTaskStatus = (status: string | null | undefined): TaskStatus => {
  const value = (status || "").trim().toUpperCase();
  if (value === "POSTED" || value === "PENDING") return TaskStatus.OPEN;
  if (value === "OPEN") return TaskStatus.OPEN;
  if (value === "BIDDING") return TaskStatus.BIDDING;
  if (value === "ASSIGNED") return TaskStatus.ASSIGNED;
  if (value === "IN_PROGRESS") return TaskStatus.IN_PROGRESS;
  if (value === "PENDING_CONFIRMATION") return TaskStatus.PENDING_CONFIRMATION;
  if (value === "COMPLETED") return TaskStatus.COMPLETED;
  if (value === "AWAITING_PAYMENT") return TaskStatus.AWAITING_PAYMENT;
  if (value === "PAID") return TaskStatus.PAID;
  if (value === "DISPUTED") return TaskStatus.DISPUTED;
  if (value === "CANCELLED") return TaskStatus.CANCELLED;
  return TaskStatus.OPEN;
};

export const formatTaskStatusLabel = (status: TaskStatus | string): string => {
  const normalized = normalizeTaskStatus(status);
  switch (normalized) {
    case "BIDDING":
      return "Bidding";
    case "ASSIGNED":
      return "Assigned";
    case "IN_PROGRESS":
      return "In Progress";
    case "PENDING_CONFIRMATION":
      return "Pending Confirmation";
    case "COMPLETED":
      return "Completed";
    case "AWAITING_PAYMENT":
      return "Awaiting Payment";
    case "PAID":
      return "Paid";
    case "DISPUTED":
      return "Disputed";
    case "CANCELLED":
      return "Cancelled";
    case "OPEN":
    default:
      return "Open";
  }
};

export const formatCategoryLabel = (category: string): string =>
  category
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

export function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    DELIVERY: "\u{1F69A}",
    HOME_REPAIR: "\u{1F527}",
    CLEANING: "\u2728",
    IT_SUPPORT: "\u{1F4BB}",
    PERSONAL_ASSISTANT: "\u{1F464}",
    MOVING: "\u{1F4E6}",
    TUTORING: "\u{1F393}",
    OTHER: "\u2605",
  };

  return icons[String(category).toUpperCase()] || "\u2605";
}

export function getStatusVariant(
  status: TaskStatus | string
): "primary" | "warning" | "success" | "danger" | "neutral" {
  const normalized = normalizeTaskStatus(status);
  if (normalized === "OPEN") return "primary";
  if (normalized === "BIDDING" || normalized === "PENDING_CONFIRMATION" || normalized === "AWAITING_PAYMENT") {
    return "warning";
  }
  if (normalized === "COMPLETED" || normalized === "PAID") return "success";
  if (normalized === "DISPUTED" || normalized === "CANCELLED") return "danger";
  return "neutral";
}

export function getDisplayName(user?: User | null): string {
  if (!user) return "Guest Access";
  return user.fullName || user.name || "User";
}

export function getDisplayEmail(user?: User | null): string {
  return user?.email || "Email unavailable";
}

export function isRequester(user?: User | null): boolean {
  const role = String(user?.role || "").toUpperCase();
  return role === "REQUESTER" || role === "CLIENT";
}

export function isProvider(user?: User | null): boolean {
  return String(user?.role || "").toUpperCase() === "PROVIDER";
}

export function isAdmin(user?: User | null): boolean {
  return String(user?.role || "").toUpperCase() === "ADMIN";
}

export function extractDistrict(location?: string): string {
  if (!location) return "Unknown district";
  return location.split(",")[0]?.trim() || location;
}

export function getBidCount(task: Task): number {
  return task._count?.bids ?? task.bids?.length ?? 0;
}

export function getTaskDueDate(task: Task): string | undefined {
  return task.dueDate || task.deadline;
}

export function getTaskDisplayBudget(task: Task): number {
  return Number(task.aiSuggestedPrice ?? task.budget ?? 0);
}

export function getSuccessTone(rate: number): "success" | "warning" | "danger" {
  if (rate >= 85) return "success";
  if (rate >= 60) return "warning";
  return "danger";
}

export function getVisiblePages(currentPage: number, totalPages: number): Array<number | "..."> {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 2) {
    return [1, 2, 3, "...", totalPages];
  }

  if (currentPage >= totalPages - 1) {
    return [1, "...", totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, "...", currentPage, "...", totalPages];
}
