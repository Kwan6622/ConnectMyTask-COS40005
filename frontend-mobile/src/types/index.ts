export type TaskCategory = string;

export type TaskStatus =
  | "OPEN"
  | "PENDING"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "Posted"
  | "Bidding"
  | "Assigned"
  | "In Progress"
  | "Completed";

export type TaskSortBy = "most_recent" | "price_low_to_high" | "price_high_to_low" | "deadline";

export interface Task {
  id: string | number;
  title: string;
  description: string;
  category: TaskCategory;
  location: string;
  budget: number;
  deadline?: string;
  status: TaskStatus;
  aiSuggestedPrice?: number;
  createdAt: string;
  updatedAt: string;
  clientName?: string;
}

export type AccountType = "client" | "service_provider";

export interface User {
  id: string | number;
  name: string;
  email: string;
  role: "admin" | "user" | "REQUESTER" | "PROVIDER" | "CLIENT" | "ADMIN" | string;
  accountType?: AccountType;
  phoneNumber?: string;
  avatar?: string;
}

export interface SignUpInput {
  fullName: string;
  email: string;
  phoneNumber?: string;
  accountType: AccountType;
  password: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  owner: string;
  members: string[];
  tasks: Task[];
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}
