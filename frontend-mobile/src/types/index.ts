export enum TaskCategory {
  DELIVERY = "DELIVERY",
  HOME_REPAIR = "HOME_REPAIR",
  CLEANING = "CLEANING",
  IT_SUPPORT = "IT_SUPPORT",
  PERSONAL_ASSISTANT = "PERSONAL_ASSISTANT",
  MOVING = "MOVING",
  TUTORING = "TUTORING",
  OTHER = "OTHER",
}

export enum TaskStatus {
  OPEN = "OPEN",
  POSTED = "POSTED",
  BIDDING = "BIDDING",
  ASSIGNED = "ASSIGNED",
  IN_PROGRESS = "IN_PROGRESS",
  PENDING_CONFIRMATION = "PENDING_CONFIRMATION",
  COMPLETED = "COMPLETED",
  AWAITING_PAYMENT = "AWAITING_PAYMENT",
  PAID = "PAID",
  DISPUTED = "DISPUTED",
  CANCELLED = "CANCELLED",
}

export type TaskSortBy = "most_recent" | "budget_low_to_high" | "budget_high_to_low" | "deadline";
export type AccountType = "client" | "service_provider";

export type EscrowStatus =
  | "NONE"
  | "PENDING_DEPOSIT"
  | "HELD"
  | "RELEASED"
  | "REFUNDED"
  | "FROZEN";

export type TaskPaymentStatus =
  | "UNPAID"
  | "ESCROW_PENDING"
  | "ESCROW_HELD"
  | "RELEASED"
  | "REFUNDED"
  | "FROZEN";

export interface User {
  id: string | number;
  email: string;
  fullName?: string;
  name?: string;
  role: "CLIENT" | "PROVIDER" | "ADMIN" | "REQUESTER" | string;
  accountType?: AccountType;
  avatar?: string;
  profilePhotoUrl?: string;
  phone?: string;
  phoneNumber?: string;
  location?: string;
  rating?: number;
  completedTasks?: number;
  skills?: string[] | string;
  hourlyRate?: number;
  isVerified?: boolean;
  bio?: string;
  createdAt?: string;
}

export interface ProviderCertificate {
  id: string | number;
  providerId?: string | number;
  title: string;
  fileUrl: string;
  certificateType: string;
  verificationStatus: "PENDING" | "VERIFIED" | "REJECTED";
  uploadedAt?: string;
  verifiedAt?: string | null;
}

export interface ProviderProfile {
  id?: string | number;
  userId?: string | number;
  address?: string;
  district?: string;
  city?: string;
  specialties: string[];
  safetyComplianceAgreed: boolean;
  shortBio?: string;
  certificates?: ProviderCertificate[];
}

export interface RatingComment {
  id: string | number;
  rating: number;
  comment?: string | null;
  fromUser?: Pick<User, "id" | "name" | "fullName">;
  createdAt?: string;
}

export interface UserRatingSummary {
  averageRating: number;
  totalReviews: number;
  latestComments: RatingComment[];
}

export interface Bid {
  id: string | number;
  taskId: string | number;
  providerId: string | number;
  amount?: number;
  price?: number;
  message?: string;
  estimatedTime?: string;
  estimatedCompletionTime?: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "WITHDRAWN";
  provider?: User;
  task?: Task;
  createdAt: string;
}

export interface Task {
  id: string | number;
  title: string;
  description: string;
  category: TaskCategory | string;
  status: TaskStatus | string;
  location: string;
  dueDate?: string;
  deadline?: string;
  isOverdue?: boolean;
  escrowStatus?: EscrowStatus;
  paymentStatus?: TaskPaymentStatus;
  escrowAmount?: number;
  escrowHeldAt?: string;
  escrowReleasedAt?: string;
  cancellationReason?: string;
  latitude?: number;
  longitude?: number;
  budget?: number;
  isSuspicious?: boolean;
  suspiciousReason?: string | null;
  riskLevel?: "LOW" | "MEDIUM" | "HIGH" | string | null;
  isOnSite?: boolean;
  onSiteVerifiedAt?: string;
  aiSuggestedPrice?: number;
  maxBids?: number;
  clientId?: string | number;
  providerId?: string | number;
  createdById?: string | number;
  assignedProviderId?: string | number;
  client?: User;
  provider?: User;
  createdBy?: User;
  assignedProvider?: User;
  bids?: Bid[];
  _count?: {
    bids?: number;
  };
  matchingScore?: number;
  imageUrls?: string[];
  progressUpdates?: TaskProgressUpdate[];
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string | number;
  message: string;
  isRead: boolean;
  createdAt: string;
  title?: string;
  sender?: User;
  task?: Task;
}

export interface SavedTask {
  id: string | number;
  createdAt: string;
  task: Task;
}

export interface TaskProgressUpdate {
  id: string | number;
  taskId: string | number;
  providerId: string | number;
  progressPercent: number;
  note: string;
  attachments?: string[];
  milestoneStatus?: string | null;
  estimatedCompletionDate?: string | null;
  provider?: User;
  createdAt: string;
  updatedAt: string;
}

export interface TaskSubtask {
  id: string | number;
  taskId: string | number;
  title: string;
  status: "PENDING" | "IN_PROGRESS" | "DONE";
  order?: number;
  progressPercent?: 25 | 50 | 75 | 100 | number;
  createdAt?: string;
}

export interface TaskProgressSummary {
  progressPercent: number;
  latestNote?: string | null;
  estimatedCompletionDate?: string | null;
  milestoneStatus?: string | null;
  attachmentsCount: number;
}

export interface PaymentTransaction {
  id: string | number;
  taskId: string | number;
  payerId: string | number;
  providerId?: string | number | null;
  amount: number;
  method: "STRIPE" | "MOMO";
  type: "DIRECT_PAYMENT" | "ESCROW_DEPOSIT" | "ESCROW_RELEASE" | "ESCROW_REFUND";
  escrowStatus?: EscrowStatus;
  status: "PENDING" | "SUCCESS" | "FAILED" | "CANCELED" | "REFUNDED";
  providerTransactionId?: string | null;
  checkoutSessionId?: string | null;
  note?: string | null;
  createdAt: string;
  paidAt?: string | null;
}

export interface Dispute {
  id: string | number;
  taskId: string | number;
  openedById: string | number;
  resolvedById?: string | number | null;
  reason: string;
  description?: string | null;
  evidenceUrls?: string[];
  status: "OPEN" | "UNDER_REVIEW" | "RESOLVED" | "REJECTED" | "CLOSED";
  resolution?: string | null;
  adminNote?: string | null;
  openedBy?: User;
  resolvedBy?: User;
  createdAt: string;
  updatedAt: string;
}

export interface TaskActivityLog {
  id: string | number;
  taskId: string | number;
  actorId?: string | number | null;
  action: string;
  message: string;
  metadata?: Record<string, unknown> | null;
  actor?: User;
  createdAt: string;
}

export interface SignUpInput {
  fullName: string;
  email: string;
  phoneNumber?: string;
  accountType: AccountType;
  password: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}
