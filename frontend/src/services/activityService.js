/**
 * Activity Service
 */
import api from './api';
import API_ENDPOINTS from '../config/api';

export const activityService = {
  async getAll(params = {}) {
    const response = await api.get(API_ENDPOINTS.ACTIVITIES.LIST, { params });
    return response.data;
  },

  async getStats(params = {}) {
    const response = await api.get(API_ENDPOINTS.ACTIVITIES.STATS, { params });
    return response.data;
  },

  async getById(id) {
    const response = await api.get(API_ENDPOINTS.ACTIVITIES.BY_ID(id));
    return response.data;
  },

  async create(data) {
    const response = await api.post(API_ENDPOINTS.ACTIVITIES.LIST, data);
    return response.data;
  },

  async update(id, data) {
    const response = await api.put(API_ENDPOINTS.ACTIVITIES.BY_ID(id), data);
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(API_ENDPOINTS.ACTIVITIES.BY_ID(id));
    return response.data;
  },

  async exportToExcel(params = {}) {
    const response = await api.get(API_ENDPOINTS.ACTIVITIES.EXPORT, {
      params,
      responseType: 'blob',
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `activites_${new Date().toISOString().split('T')[0]}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

export default activityService;
