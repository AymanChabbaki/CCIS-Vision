/**
 * Excel Import Service
 */
import api from './api';
import API_ENDPOINTS from '../config/api';

export const excelService = {
  async uploadFile(file, entityType, onProgress) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entity_type', entityType);

    const response = await api.post(API_ENDPOINTS.EXCEL.UPLOAD, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      },
    });
    return response.data;
  },

  async upload(file, entityType) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entity_type', entityType);

    const response = await api.post(API_ENDPOINTS.EXCEL.UPLOAD, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async getHistory(params = {}) {
    const response = await api.get(API_ENDPOINTS.EXCEL.HISTORY, { params });
    return response.data;
  },

  async getById(id) {
    const response = await api.get(API_ENDPOINTS.EXCEL.BY_ID(id));
    return response.data;
  },

  async validate(importId) {
    const response = await api.post(API_ENDPOINTS.EXCEL.VALIDATE(importId));
    return response.data;
  },

  async process(importId) {
    const response = await api.post(API_ENDPOINTS.EXCEL.PROCESS(importId));
    return response.data;
  },
};

export default excelService;
