/**
 * Authentication Service
 */
import api from './api';
import API_ENDPOINTS from '../config/api';

export const authService = {
  async login(username, password) {
    const response = await api.post(API_ENDPOINTS.AUTH.LOGIN, { username, password });
    const { user, accessToken } = response.data.data;
    
    localStorage.setItem('token', accessToken);
    localStorage.setItem('user', JSON.stringify(user));
    
    return { user, token: accessToken };
  },

  async register(userData) {
    const response = await api.post(API_ENDPOINTS.AUTH.REGISTER, userData);
    return response.data;
  },

  async getMe() {
    const response = await api.get(API_ENDPOINTS.AUTH.ME);
    return response.data;
  },

  async changePassword(currentPassword, newPassword) {
    const response = await api.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  async getUsers(params = {}) {
    const response = await api.get(API_ENDPOINTS.USERS.LIST, { params });
    return response.data;
  },

  async updateUser(id, userData) {
    const response = await api.put(API_ENDPOINTS.USERS.BY_ID(id), userData);
    return response.data;
  },

  async deleteUser(id) {
    const response = await api.delete(API_ENDPOINTS.USERS.BY_ID(id));
    return response.data;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getToken() {
    return localStorage.getItem('token');
  },

  getUser() {
    const user = localStorage.getItem('user');
    if (!user || user === 'undefined' || user === 'null') {
      return null;
    }
    try {
      return JSON.parse(user);
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  },

  isAuthenticated() {
    return !!this.getToken();
  },
};

export default authService;
