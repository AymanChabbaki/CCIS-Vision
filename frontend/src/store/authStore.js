/**
 * Authentication Store (Zustand)
 */
import { create } from 'zustand';
import { authService } from '../services/authService';

export const useAuthStore = create((set) => ({
  user: authService.getUser(),
  token: authService.getToken(),
  isAuthenticated: authService.isAuthenticated(),
  loading: false,
  error: null,

  login: async (username, password) => {
    set({ loading: true, error: null });
    try {
      const data = await authService.login(username, password);
      set({
        user: data.user,
        token: data.token,
        isAuthenticated: true,
        loading: false,
      });
      return data;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Nom d\'utilisateur ou mot de passe incorrect',
        loading: false,
      });
      throw error;
    }
  },

  logout: () => {
    authService.logout();
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
  },

  refreshUser: async () => {
    try {
      const user = await authService.getMe();
      set({ user });
      return user;
    } catch (error) {
      set({ error: error.response?.data?.message });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;
