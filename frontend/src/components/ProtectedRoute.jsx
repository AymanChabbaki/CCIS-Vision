/**
 * Protected Route Component - Role-based Access Control
 */
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export const ProtectedRoute = ({ children, requirePermission }) => {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If a permission check is required
  if (requirePermission && !requirePermission(user)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
