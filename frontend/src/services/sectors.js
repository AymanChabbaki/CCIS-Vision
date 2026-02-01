import api from './api';

export const sectorsService = {
  /**
   * Get all sectors
   */
  getAll: async (params = {}) => {
    const response = await api.get('/sectors', { params });
    return response.data;
  },

  /**
   * Get sector by ID
   */
  getById: async (id) => {
    const response = await api.get(`/sectors/${id}`);
    return response.data;
  },

  /**
   * Create new sector
   */
  create: async (data) => {
    const response = await api.post('/sectors', data);
    return response.data;
  },

  /**
   * Update sector
   */
  update: async (id, data) => {
    const response = await api.put(`/sectors/${id}`, data);
    return response.data;
  },

  /**
   * Delete sector
   */
  delete: async (id) => {
    const response = await api.delete(`/sectors/${id}`);
    return response.data;
  },

  /**
   * Get sector statistics
   */
  getStats: async () => {
    const response = await api.get('/sectors/stats');
    return response.data;
  },
};
