/**
 * Alert Service
 */
import api from './api';
import API_ENDPOINTS from '../config/api';

export const alertService = {
  async getAll(params = {}) {
    const response = await api.get(API_ENDPOINTS.ALERTS.LIST, { params });
    return response.data;
  },

  async getStats() {
    const response = await api.get(API_ENDPOINTS.ALERTS.STATS);
    return response.data;
  },

  async create(data) {
    const response = await api.post(API_ENDPOINTS.ALERTS.LIST, data);
    return response.data;
  },

  async updateStatus(id, status) {
    const response = await api.put(API_ENDPOINTS.ALERTS.UPDATE_STATUS(id), {
      is_read: status === 'read',
      is_active: status !== 'dismissed',
    });
    return response.data;
  },

  async markAsRead(id) {
    const response = await api.put(API_ENDPOINTS.ALERTS.UPDATE_STATUS(id), {
      is_read: true,
    });
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(API_ENDPOINTS.ALERTS.BY_ID(id));
    return response.data;
  },
};

export default alertService;
