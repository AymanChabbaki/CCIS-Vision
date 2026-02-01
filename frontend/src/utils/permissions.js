/**
 * Role-based Authorization Utilities
 */

// Role definitions (must match backend)
export const ROLES = {
  ADMIN: 1,
  SERVICE_USER: 2,
  VIEWER: 3,
};

/**
 * Check if user has required role
 */
export const hasRole = (user, allowedRoles) => {
  if (!user || !user.roleId) return false;
  
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  return roles.includes(user.roleId);
};

/**
 * Check if user is admin
 */
export const isAdmin = (user) => {
  return hasRole(user, ROLES.ADMIN);
};

/**
 * Check if user can modify data (admin or service user)
 */
export const canModify = (user) => {
  return hasRole(user, [ROLES.ADMIN, ROLES.SERVICE_USER]);
};

/**
 * Check if user can import files (admin or service user)
 */
export const canImport = (user) => {
  return hasRole(user, [ROLES.ADMIN, ROLES.SERVICE_USER]);
};

/**
 * Check if user is viewer only
 */
export const isViewer = (user) => {
  return hasRole(user, ROLES.VIEWER);
};

/**
 * Get user's role name
 */
export const getRoleName = (roleId) => {
  switch (roleId) {
    case ROLES.ADMIN:
      return 'Administrateur';
    case ROLES.SERVICE_USER:
      return 'Utilisateur Service';
    case ROLES.VIEWER:
      return 'Lecteur';
    default:
      return 'Inconnu';
  }
};
