/**
 * Dashboard Service
 */
import api from './api';
import API_ENDPOINTS from '../config/api';

export const dashboardService = {
  async getOverview(params = {}) {
    const response = await api.get(API_ENDPOINTS.DASHBOARD.OVERVIEW, { params });
    return response.data;
  },

  async getKPIs(params = {}) {
    const response = await api.get(API_ENDPOINTS.DASHBOARD.KPIS, { params });
    return response.data;
  },

  async getMapData(params = {}) {
    const response = await api.get(API_ENDPOINTS.DASHBOARD.MAP, { params });
    return response.data;
  },

  async getDataQuality(params = {}) {
    const response = await api.get(API_ENDPOINTS.DASHBOARD.DATA_QUALITY, { params });
    return response.data;
  },

  async getFinancial(params = {}) {
    const response = await api.get(API_ENDPOINTS.DASHBOARD.FINANCIAL, { params });
    return response.data;
  },

  async getParticipants(params = {}) {
    const response = await api.get(API_ENDPOINTS.DASHBOARD.PARTICIPANTS, { params });
    return response.data;
  },
};

export default dashboardService;
