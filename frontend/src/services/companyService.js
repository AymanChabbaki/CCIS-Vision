/**
 * Company Service
 */
import api from './api';
import API_ENDPOINTS from '../config/api';

export const companyService = {
  async getAll(params = {}) {
    const response = await api.get(API_ENDPOINTS.COMPANIES.LIST, { params });
    return response.data;
  },

  async getStats(params = {}) {
    const response = await api.get(API_ENDPOINTS.COMPANIES.STATS, { params });
    return response.data;
  },

  async getById(id) {
    const response = await api.get(API_ENDPOINTS.COMPANIES.BY_ID(id));
    return response.data;
  },

  async create(data) {
    const response = await api.post(API_ENDPOINTS.COMPANIES.LIST, data);
    return response.data;
  },

  async update(id, data) {
    const response = await api.put(API_ENDPOINTS.COMPANIES.BY_ID(id), data);
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(API_ENDPOINTS.COMPANIES.BY_ID(id));
    return response.data;
  },

  async getDuplicates() {
    const response = await api.get(API_ENDPOINTS.COMPANIES.DUPLICATES);
    return response.data;
  },

  async merge(sourceId, targetId) {
    const response = await api.post(API_ENDPOINTS.COMPANIES.MERGE, {
      sourceId,
      targetId,
    });
    return response.data;
  },

  async exportToExcel(filters = {}) {
    const response = await api.get(API_ENDPOINTS.COMPANIES.EXPORT, {
      params: filters,
      responseType: 'blob',
    });
    
    // Create a blob URL and trigger download
    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `entreprises_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    return response.data;
  },
};

export default companyService;
