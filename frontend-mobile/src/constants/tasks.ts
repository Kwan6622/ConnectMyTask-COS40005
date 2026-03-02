import { TaskCategory, TaskSortBy, TaskStatus } from "@/types";

export const TASK_CATEGORIES: TaskCategory[] = [
  "DELIVERY",
  "HOME_REPAIR",
  "CLEANING",
  "IT_SUPPORT",
  "PERSONAL_ASSISTANT",
  "MOVING",
  "TUTORING",
  "OTHER",
];

export const TASK_STATUSES: TaskStatus[] = [
  "OPEN",
  "PENDING",
  "ASSIGNED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
];

export const SORT_OPTIONS: Array<{ label: string; value: TaskSortBy }> = [
  { label: "Most Recent", value: "most_recent" },
  { label: "Price: Low to High", value: "price_low_to_high" },
  { label: "Price: High to Low", value: "price_high_to_low" },
  { label: "Deadline", value: "deadline" },
];
