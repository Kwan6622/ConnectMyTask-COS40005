// User Types
export interface User {
  id: string | number;
  email: string;
  fullName?: string;
  name?: string;
  role: 'CLIENT' | 'PROVIDER' | 'ADMIN' | 'REQUESTER';
  avatar?: string;
  profilePhotoUrl?: string;
  phone?: string;
  location?: string;
  rating?: number;
  completedTasks?: number;
  skills?: string[];
  hourlyRate?: number;
  isVerified: boolean;
  bio?: string;
  createdAt: string;
  providerProfile?: ProviderProfile;
  providerRatingSummary?: ProviderRatingSummary;
}

export interface ProviderCertificate {
  id: string | number;
  providerId: string | number;
  providerProfileId?: string | number | null;
  title: string;
  fileUrl: string;
  certificateType: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  rejectionReason?: string | null;
  uploadedAt: string;
  verifiedAt?: string | null;
  verifiedByAdminId?: string | number | null;
}

export interface ProviderProfile {
  id: string | number;
  userId: string | number;
  address?: string | null;
  district?: string | null;
  city?: string | null;
  specialties: string[];
  safetyComplianceAgreed: boolean;
  shortBio?: string | null;
  certificates?: ProviderCertificate[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ProviderRatingSummary {
  providerId: string | number;
  averageRating: number;
  totalReviews: number;
  latestCommentsCount?: number;
  latestComments?: RatingItem[];
}

// Task Types
export interface Task {
  id: string | number;
  title: string;
  description: string;
  category: TaskCategory;
  status: TaskStatus;
  location: string;
  dueDate?: string;
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
  maxBids?: number;
  bidCount?: number;
  isBiddingClosed?: boolean;
  isSuspicious?: boolean;
  suspiciousReason?: string | null;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | string | null;
  isOnSite?: boolean;
  onSiteVerifiedAt?: string;
  aiSuggestedPrice?: number;
  deadline?: string;
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
  subtasks?: TaskSubtask[];
  createdAt: string;
  updatedAt: string;
}

export const TaskCategory = {
  DELIVERY: 'DELIVERY',
  HOME_REPAIR: 'HOME_REPAIR',
  CLEANING: 'CLEANING',
  IT_SUPPORT: 'IT_SUPPORT',
  PERSONAL_ASSISTANT: 'PERSONAL_ASSISTANT',
  MOVING: 'MOVING',
  TUTORING: 'TUTORING',
  OTHER: 'OTHER',
} as const;

export type TaskCategory = (typeof TaskCategory)[keyof typeof TaskCategory];

export const TaskStatus = {
  OPEN: 'OPEN',
  POSTED: 'POSTED',
  BIDDING: 'BIDDING',
  ASSIGNED: 'ASSIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  PENDING_CONFIRMATION: 'PENDING_CONFIRMATION',
  COMPLETED: 'COMPLETED',
  AWAITING_PAYMENT: 'AWAITING_PAYMENT',
  PAID: 'PAID',
  DISPUTED: 'DISPUTED',
  CANCELLED: 'CANCELLED',
} as const;

export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

// Bid Types
export interface Bid {
  id: string | number;
  taskId: string | number;
  providerId: string | number;
  amount?: number;
  price?: number;
  message?: string;
  estimatedTime?: string;
  estimatedCompletionTime?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';
  provider?: User;
  task?: Task;
  createdAt: string;
}

// Tracking Types
export interface LocationUpdate {
  taskId: string | number;
  providerId: string | number;
  latitude: number;
  longitude: number;
  accuracy: number;
  speed?: number;
  timestamp: string;
  distanceFromTask?: number;
  isAtLocation?: boolean;
}

// AI Response Types
export interface PricePrediction {
  aiSuggestedPrice: number;
  confidence: number;
  currency: string;
  explanation?: string;
}

export interface ProviderMatch {
  providerId: string | number;
  matchScore: number;
  estimatedPrice: number;
  distanceKm: number;
  provider?: User;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Pagination Types
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Notification {
  id: string | number;
  message: string;
  isRead: boolean;
  createdAt: string;
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

export interface TaskProgressSummary {
  progressPercent: number;
  completedSubtasks?: number;
  totalSubtasks?: number;
  latestNote?: string | null;
  estimatedCompletionDate?: string | null;
  milestoneStatus?: string | null;
  attachmentsCount: number;
}

export interface TaskSubtask {
  id: string | number;
  taskId: string | number;
  title: string;
  progressPercent: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'DONE';
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface TaskProgressResponse {
  task: Task;
  updates: TaskProgressUpdate[];
  subtasks?: TaskSubtask[];
  summary: TaskProgressSummary;
  disputes?: Dispute[];
  activities?: TaskActivityLog[];
  payments?: PaymentTransaction[];
  paymentSummary?: {
    escrowStatus?: EscrowStatus;
    paymentStatus?: TaskPaymentStatus;
    escrowAmount?: number;
    escrowHeldAt?: string | null;
    escrowReleasedAt?: string | null;
  };
}

export type EscrowStatus =
  | 'NONE'
  | 'PENDING_DEPOSIT'
  | 'HELD'
  | 'RELEASED'
  | 'REFUNDED'
  | 'FROZEN';

export type TaskPaymentStatus =
  | 'UNPAID'
  | 'ESCROW_PENDING'
  | 'ESCROW_HELD'
  | 'RELEASED'
  | 'REFUNDED'
  | 'FROZEN';

export interface PaymentTransaction {
  id: string | number;
  taskId: string | number;
  payerId: string | number;
  providerId?: string | number | null;
  amount: number;
  method: 'STRIPE' | 'MOMO';
  type: 'DIRECT_PAYMENT' | 'ESCROW_DEPOSIT' | 'ESCROW_RELEASE' | 'ESCROW_REFUND';
  escrowStatus?: EscrowStatus;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELED' | 'REFUNDED';
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
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED' | 'CLOSED';
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

export interface RatingItem {
  id: string | number;
  taskId: string | number;
  fromUserId: string | number;
  toUserId: string | number;
  rating: number;
  comment?: string | null;
  createdAt: string;
  fromUser?: User;
  toUser?: User;
  task?: Pick<Task, 'id' | 'title' | 'status' | 'category'>;
}

export interface UserRatingsResponse {
  userId: string | number;
  averageRating: number;
  totalReviews: number;
  ratings: RatingItem[];
}
