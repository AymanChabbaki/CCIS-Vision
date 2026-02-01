/**
 * Application Constants
 */

export const ROLES = {
  ADMIN: 'admin',
  SERVICE_USER: 'service_user',
  VIEWER: 'viewer',
};

export const ACTIVITY_TYPES = [
  { id: 1, name: 'Formation', label: 'Formation' },
  { id: 2, name: 'Événement', label: 'Événement' },
  { id: 3, name: 'Projet', label: 'Projet' },
  { id: 4, name: 'Service', label: 'Service' },
  { id: 5, name: 'Mission', label: 'Mission' },
  { id: 6, name: 'Étude', label: 'Étude' },
];

export const ALERT_TYPES = [
  { id: 1, name: 'Budget Alert', label: 'Alerte Budget' },
  { id: 2, name: 'Data Quality Alert', label: 'Alerte Qualité' },
  { id: 3, name: 'Deadline Alert', label: 'Alerte Échéance' },
  { id: 4, name: 'Capacity Alert', label: 'Alerte Capacité' },
];

export const SEVERITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

export const COMPANY_SIZES = [
  { value: 'TPE', label: 'TPE (< 10 employés)' },
  { value: 'PME', label: 'PME (10-250 employés)' },
  { value: 'ETI', label: 'ETI (250-5000 employés)' },
  { value: 'GE', label: 'Grande Entreprise (> 5000 employés)' },
];

export const PROVINCES = [
  'Rabat',
  'Salé',
  'Kénitra',
  'Khémisset',
  'Skhirat-Témara',
  'Sidi Kacem',
  'Sidi Slimane',
];

export const SECTORS = [
  'Agriculture',
  'Industrie',
  'Commerce',
  'Services',
  'BTP',
  'Tourisme',
  'TIC',
  'Autres',
];

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  PAGE_SIZES: [10, 25, 50, 100],
};

export const DATE_FORMATS = {
  DISPLAY: 'dd/MM/yyyy',
  DISPLAY_WITH_TIME: 'dd/MM/yyyy HH:mm',
  API: 'yyyy-MM-dd',
  API_WITH_TIME: "yyyy-MM-dd'T'HH:mm:ss",
};

export const CHART_COLORS = {
  PRIMARY: '#3b82f6',
  SUCCESS: '#10b981',
  WARNING: '#f59e0b',
  DANGER: '#ef4444',
  INFO: '#06b6d4',
  PURPLE: '#8b5cf6',
  PINK: '#ec4899',
};

export default {
  ROLES,
  ACTIVITY_TYPES,
  ALERT_TYPES,
  SEVERITY_LEVELS,
  COMPANY_SIZES,
  PROVINCES,
  SECTORS,
  PAGINATION,
  DATE_FORMATS,
  CHART_COLORS,
};
