// Format currency
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
};

// Format date
export const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Format time
export const formatTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Format relative time (e.g., "2 hours ago")
export const formatRelativeTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;

  return formatDate(d);
};

// Calculate distance between two coordinates (Haversine formula)
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Get status color
export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    POSTED: 'bg-blue-100 text-blue-800',
    BIDDING: 'bg-yellow-100 text-yellow-800',
    ASSIGNED: 'bg-green-100 text-green-800',
    IN_PROGRESS: 'bg-purple-100 text-purple-800',
    COMPLETED: 'bg-gray-100 text-gray-800',
    CANCELLED: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

// Truncate text
export const truncateText = (text: string, length: number = 100): string => {
  return text.length > length ? `${text.substring(0, length)}...` : text;
};

// Validate email
export const isValidEmail = (email: string): boolean => {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(email);
};

// Validate phone number
export const isValidPhone = (phone: string): boolean => {
  const pattern = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
  return pattern.test(phone);
};

// Get initials from name
export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

// Sleep/delay function
export const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

// Get category icon
export const getCategoryIcon = (category: string): string => {
  const icons: Record<string, string> = {
    DELIVERY: '🚚',
    HOME_REPAIR: '🔧',
    CLEANING: '✨',
    IT_SUPPORT: '💻',
    PERSONAL_ASSISTANT: '👤',
    MOVING: '📦',
    TUTORING: '📚',
    OTHER: '⭐',
  };
  return icons[category] || '⭐';
};

// Sort tasks
export const sortTasks = (
  tasks: any[],
  sortBy: 'newest' | 'budget' | 'deadline' = 'newest',
  order: 'asc' | 'desc' = 'desc'
) => {
  const sorted = [...tasks];
  sorted.sort((a, b) => {
    let valueA, valueB;

    switch (sortBy) {
      case 'budget':
        valueA = a.budget || 0;
        valueB = b.budget || 0;
        break;
      case 'deadline':
        valueA = a.deadline ? new Date(a.deadline).getTime() : Infinity;
        valueB = b.deadline ? new Date(b.deadline).getTime() : Infinity;
        break;
      case 'newest':
      default:
        valueA = new Date(a.createdAt).getTime();
        valueB = new Date(b.createdAt).getTime();
    }

    return order === 'asc' ? valueA - valueB : valueB - valueA;
  });

  return sorted;
};

// Local storage helpers
export const storage = {
  get: (key: string) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },
  set: (key: string, value: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Storage error:', error);
    }
  },
  remove: (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Storage error:', error);
    }
  },
  clear: () => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Storage error:', error);
    }
  },
};
