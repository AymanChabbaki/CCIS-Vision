/**
 * API Configuration
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    ME: '/auth/me',
    CHANGE_PASSWORD: '/auth/change-password',
    REFRESH_TOKEN: '/auth/refresh-token',
    LOGOUT: '/auth/logout',
  },
  
  // Users
  USERS: {
    LIST: '/users',
    BY_ID: (id) => `/users/${id}`,
  },
  
  // Companies
  COMPANIES: {
    LIST: '/companies',
    STATS: '/companies/stats',
    DUPLICATES: '/companies/duplicates',
    MERGE: '/companies/merge',
    EXPORT: '/companies/export',
    BY_ID: (id) => `/companies/${id}`,
  },
  
  // Activities
  ACTIVITIES: {
    LIST: '/activities',
    EXPORT: '/activities/export',
    STATS: '/activities/stats',
    BY_ID: (id) => `/activities/${id}`,
  },
  
  // Dashboard
  DASHBOARD: {
    OVERVIEW: '/dashboard/overview',
    KPIS: '/dashboard/kpis',
    MAP: '/dashboard/map',
    DATA_QUALITY: '/dashboard/data-quality',
    FINANCIAL: '/dashboard/financial',
    PARTICIPANTS: '/dashboard/participants',
  },
  
  // Alerts
  ALERTS: {
    LIST: '/alerts',
    STATS: '/alerts/stats',
    BY_ID: (id) => `/alerts/${id}`,
    UPDATE_STATUS: (id) => `/alerts/${id}/status`,
  },
  
  // Excel Import
  EXCEL: {
    UPLOAD: '/excel/upload',
    HISTORY: '/excel/history',
    BY_ID: (id) => `/excel/${id}`,
    VALIDATE: (id) => `/excel/${id}/validate`,
    PROCESS: (id) => `/excel/${id}/process`,
  },
  
  // Health
  HEALTH: '/health',
};

export default API_ENDPOINTS;
