const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');
const config = require('../config');
const { query } = require('../config/database');
const logger = require('../utils/logger');

/**
 * Authentication middleware - verifies JWT token and attaches user to request
 */
const authenticate = async (req, res, next) => {
  try {
    // 1. Get token from header
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Please log in to access this resource', 401));
    }

    // 2. Verify token
    const decoded = jwt.verify(token, config.jwt.secret);

    // 3. Check if user still exists
    const result = await query(
      `SELECT u.*, r.name as role_name, r.description as role_description
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = $1 AND u.is_active = true`,
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return next(new AppError('User no longer exists or is inactive', 401));
    }

    // 4. Check if user changed password after token was issued
    const user = result.rows[0];
    const passwordChangedAt = user.password_changed_at 
      ? new Date(user.password_changed_at).getTime() / 1000 
      : 0;
    
    if (passwordChangedAt > decoded.iat) {
      return next(new AppError('Password recently changed. Please log in again', 401));
    }

    // 5. Attach user to request object
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.full_name,
      roleId: user.role_id,
      roleName: user.role_name,
      roleDescription: user.role_description,
      departmentId: user.department_id,
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token. Please log in again', 401));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Token expired. Please log in again', 401));
    }
    logger.error('Authentication error:', error);
    return next(new AppError('Authentication failed', 401));
  }
};

/**
 * Authorization middleware - checks if user has required role
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Not authenticated', 401));
    }

    // Check if user has allowed role
    if (!allowedRoles.includes(req.user.roleName)) {
      logger.warn(`Unauthorized access attempt by user ${req.user.id}`, {
        requiredRoles: allowedRoles,
        userRole: req.user.roleName
      });
      return next(new AppError('You do not have permission to perform this action', 403));
    }

    next();
  };
};
/**
 * Check if user belongs to specific department
 */
const restrictToDepartment = (...departmentIds) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Not authenticated', 401));
    }

    // Super admin can access all departments
    if (req.user.roleName === 'Super Admin') {
      return next();
    }

    if (!departmentIds.includes(req.user.departmentId)) {
      return next(new AppError('Access restricted to specific departments', 403));
    }

    next();
  };
};

/**
 * Check if user belongs to specific annex
 */
const restrictToAnnex = (...annexIds) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Not authenticated', 401));
    }

    // Super admin can access all annexes
    if (req.user.roleName === 'Super Admin') {
      return next();
    }

    if (!annexIds.includes(req.user.annexId)) {
      return next(new AppError('Access restricted to specific annexes', 403));
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize,
  restrictToDepartment,
  restrictToAnnex,
};
