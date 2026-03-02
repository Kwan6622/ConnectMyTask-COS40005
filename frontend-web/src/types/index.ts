// User Types
export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'CLIENT' | 'PROVIDER' | 'ADMIN';
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
}

// Task Types
export interface Task {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  status: TaskStatus;
  location: string;
  latitude?: number;
  longitude?: number;
  budget?: number;
  aiSuggestedPrice?: number;
  deadline?: string;
  clientId: string;
  providerId?: string;
  client?: User;
  provider?: User;
  bids?: Bid[];
  matchingScore?: number;
  imageUrls?: string[];
  createdAt: string;
  updatedAt: string;
}

export enum TaskCategory {
  DELIVERY = 'DELIVERY',
  HOME_REPAIR = 'HOME_REPAIR',
  CLEANING = 'CLEANING',
  IT_SUPPORT = 'IT_SUPPORT',
  PERSONAL_ASSISTANT = 'PERSONAL_ASSISTANT',
  MOVING = 'MOVING',
  TUTORING = 'TUTORING',
  OTHER = 'OTHER'
}

export enum TaskStatus {
  POSTED = 'POSTED',
  BIDDING = 'BIDDING',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

// Bid Types
export interface Bid {
  id: string;
  taskId: string;
  providerId: string;
  amount: number;
  message?: string;
  estimatedTime?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  provider?: User;
  createdAt: string;
}

// Tracking Types
export interface LocationUpdate {
  taskId: string;
  providerId: string;
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
  providerId: string;
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
