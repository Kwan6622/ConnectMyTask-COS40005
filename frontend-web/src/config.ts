// Environment configuration
export const config = {
  api: {
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    timeout: 30000,
  },
  ws: {
    url: import.meta.env.VITE_WS_URL || 'ws://localhost:5000',
  },
  features: {
    enableTracking: true,
    enablePayments: true,
    enableAI: true,
    enableI18n: true,
  },
  tracking: {
    refreshInterval: 5000, // 5 seconds
    maxHistoryPoints: 100,
  },
  pagination: {
    defaultPageSize: 12,
    maxPageSize: 100,
  },
};
