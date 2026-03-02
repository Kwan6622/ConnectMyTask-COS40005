import { TaskCategory, TaskStatus } from '../types';

export const TASK_CATEGORIES: Array<{ value: TaskCategory; label: string; icon: string }> = [
  { value: 'DELIVERY', label: 'Delivery', icon: '🚚' },
  { value: 'HOME_REPAIR', label: 'Home Repair', icon: '🔧' },
  { value: 'CLEANING', label: 'Cleaning', icon: '✨' },
  { value: 'IT_SUPPORT', label: 'IT Support', icon: '💻' },
  { value: 'PERSONAL_ASSISTANT', label: 'Personal Assistant', icon: '👤' },
  { value: 'MOVING', label: 'Moving', icon: '📦' },
  { value: 'TUTORING', label: 'Tutoring', icon: '📚' },
  { value: 'OTHER', label: 'Other', icon: '⭐' },
];

export const TASK_STATUSES: Array<{ value: TaskStatus; label: string; icon: string; color: string }> = [
  { value: 'POSTED', label: 'Posted', icon: '📝', color: 'blue' },
  { value: 'BIDDING', label: 'Bidding', icon: '🏷️', color: 'yellow' },
  { value: 'ASSIGNED', label: 'Assigned', icon: '✅', color: 'green' },
  { value: 'IN_PROGRESS', label: 'In Progress', icon: '⚙️', color: 'purple' },
  { value: 'COMPLETED', label: 'Completed', icon: '🎉', color: 'gray' },
];

export const TASK_CATEGORY_DESCRIPTIONS: Record<TaskCategory, string> = {
  DELIVERY: 'Need something delivered? Find reliable delivery services.',
  HOME_REPAIR: 'Home repairs and maintenance services.',
  CLEANING: 'Professional cleaning services for your space.',
  IT_SUPPORT: 'Technical support and IT services.',
  PERSONAL_ASSISTANT: 'Personal assistance and errands.',
  MOVING: 'Moving and relocation services.',
  TUTORING: 'Educational and tutoring services.',
  OTHER: 'Other services not listed above.',
};

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'budget', label: 'Budget' },
  { value: 'deadline', label: 'Deadline' },
];

export const ITEMS_PER_PAGE = 12;
export const DEFAULT_LOCATION = 'Ho Chi Minh City, Vietnam';
export const DEFAULT_LATITUDE = 10.762622;
export const DEFAULT_LONGITUDE = 106.660172;
export const MAP_ZOOM_LEVEL = 13;

// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:5000';

// Timeout configurations
export const API_TIMEOUT = 30000; // 30 seconds
export const TRACKING_REFRESH_INTERVAL = 5000; // 5 seconds
export const AUTO_LOGOUT_TIMEOUT = 30 * 60 * 1000; // 30 minutes

// Payment
export const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY || '';
export const MIN_TRANSACTION_AMOUNT = 1; // $1
export const MAX_TRANSACTION_AMOUNT = 10000; // $10,000

// Validation Rules
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 6,
  FULL_NAME_MIN_LENGTH: 3,
  TASK_TITLE_MIN_LENGTH: 5,
  TASK_DESCRIPTION_MIN_LENGTH: 20,
  BIO_MAX_LENGTH: 500,
  PHONE_PATTERN: /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/,
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
};
