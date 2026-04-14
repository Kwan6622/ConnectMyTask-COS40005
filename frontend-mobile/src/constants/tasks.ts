import { TaskCategory, TaskSortBy, TaskStatus } from "@/types";

export const TASK_CATEGORIES: TaskCategory[] = [
  TaskCategory.DELIVERY,
  TaskCategory.HOME_REPAIR,
  TaskCategory.CLEANING,
  TaskCategory.IT_SUPPORT,
  TaskCategory.PERSONAL_ASSISTANT,
  TaskCategory.MOVING,
  TaskCategory.TUTORING,
  TaskCategory.OTHER,
];

export const TASK_STATUSES: TaskStatus[] = [
  TaskStatus.OPEN,
  TaskStatus.BIDDING,
  TaskStatus.ASSIGNED,
  TaskStatus.IN_PROGRESS,
  TaskStatus.PENDING_CONFIRMATION,
  TaskStatus.COMPLETED,
  TaskStatus.AWAITING_PAYMENT,
  TaskStatus.PAID,
  TaskStatus.DISPUTED,
  TaskStatus.CANCELLED,
];

export const SORT_OPTIONS: Array<{ label: string; value: TaskSortBy }> = [
  { label: "Most Recent", value: "most_recent" },
  { label: "Budget: Low to High", value: "budget_low_to_high" },
  { label: "Budget: High to Low", value: "budget_high_to_low" },
  { label: "Deadline", value: "deadline" },
];

export const BROWSE_STATUS_OPTIONS: Array<{ label: string; value: "ALL" | TaskStatus }> = [
  { label: "All Status", value: "ALL" },
  { label: "Open", value: TaskStatus.OPEN },
  { label: "Bidding", value: TaskStatus.BIDDING },
  { label: "Assigned", value: TaskStatus.ASSIGNED },
  { label: "In Progress", value: TaskStatus.IN_PROGRESS },
  { label: "Pending Confirmation", value: TaskStatus.PENDING_CONFIRMATION },
  { label: "Completed", value: TaskStatus.COMPLETED },
  { label: "Awaiting Payment", value: TaskStatus.AWAITING_PAYMENT },
  { label: "Paid", value: TaskStatus.PAID },
  { label: "Disputed", value: TaskStatus.DISPUTED },
];
