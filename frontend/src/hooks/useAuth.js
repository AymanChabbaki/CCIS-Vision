/**
 * useAuth Hook
 */
import { useAuthStore } from '../store/authStore';

export const useAuth = () => {
  const { user, isAuthenticated, login, logout, loading, error, refreshUser, clearError } =
    useAuthStore();

  const hasRole = (role) => {
    return user?.role?.name === role;
  };

  const isAdmin = () => hasRole('admin');
  const isServiceUser = () => hasRole('service_user');
  const isViewer = () => hasRole('viewer');

  return {
    user,
    isAuthenticated,
    loading,
    error,
    login,
    logout,
    refreshUser,
    clearError,
    hasRole,
    isAdmin,
    isServiceUser,
    isViewer,
  };
};

export default useAuth;
