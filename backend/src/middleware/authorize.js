/**
 * Role-based Authorization Middleware
 */

const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

// Role definitions
const ROLES = {
  ADMIN: 1,           // Administrateur
  SERVICE_USER: 2,    // Utilisateur Service
  VIEWER: 3,          // Lecteur
};

/**
 * Check if user has required role
 * @param {Array|Number} allowedRoles - Single role ID or array of role IDs
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      logger.error('Authorization failed: No user in request');
      return next(new AppError('Authentication required', 401));
    }

    const userRoleId = req.user.role_id;
    const userRoleName = req.user.role_name;

    // Flatten array in case of nested arrays
    const roles = allowedRoles.flat();

    // Check if user's role is in allowed roles
    if (!roles.includes(userRoleId)) {
      logger.warn(`Authorization failed: User ${req.user.username} (${userRoleName}) attempted to access restricted resource`);
      return next(new AppError('Insufficient permissions to access this resource', 403));
    }

    next();
  };
};

/**
 * Check if user is admin
 */
const isAdmin = authorize(ROLES.ADMIN);

/**
 * Check if user is admin or service user (can modify data)
 */
const canModify = authorize(ROLES.ADMIN, ROLES.SERVICE_USER);

/**
 * Check if user is admin or service user (can import files)
 */
const canImport = authorize(ROLES.ADMIN, ROLES.SERVICE_USER);

/**
 * All authenticated users can read (no additional restriction)
 */
const canRead = (req, res, next) => next();

module.exports = {
  ROLES,
  authorize,
  isAdmin,
  canModify,
  canImport,
  canRead,
};
