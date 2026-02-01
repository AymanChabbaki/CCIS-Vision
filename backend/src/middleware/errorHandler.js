const logger = require('../utils/logger');
const AppError = require('../utils/AppError');
const config = require('../config');

/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.stack = err.stack;

  // Log error
  logger.error('Error:', {
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    user: req.user?.id,
  });

  // PostgreSQL unique constraint violation
  if (err.code === '23505') {
    const field = err.detail?.match(/Key \((.*?)\)/)?.[1] || 'field';
    error = new AppError(`${field} already exists`, 400);
  }

  // PostgreSQL foreign key violation
  if (err.code === '23503') {
    error = new AppError('Referenced record does not exist', 400);
  }

  // PostgreSQL not-null violation
  if (err.code === '23502') {
    const field = err.column || 'field';
    error = new AppError(`${field} is required`, 400);
  }

  // PostgreSQL check constraint violation
  if (err.code === '23514') {
    error = new AppError('Invalid data format', 400);
  }

  // Multer file upload errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      error = new AppError('File too large', 400);
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      error = new AppError('Unexpected file field', 400);
    } else {
      error = new AppError('File upload error', 400);
    }
  }

  // Joi validation errors
  if (err.name === 'ValidationError') {
    const messages = err.details?.map(detail => detail.message).join(', ');
    error = new AppError(messages || 'Validation error', 400);
  }

  // Default to 500 server error
  const statusCode = error.statusCode || 500;
  const status = error.status || 'error';

  // Send error response
  res.status(statusCode).json({
    status,
    message: error.message || 'Internal server error',
    ...(config.env === 'development' && { stack: error.stack }),
    ...(config.env === 'development' && { error: err }),
  });
};

/**
 * Handle 404 - Not Found errors
 */
const notFound = (req, res, next) => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};

module.exports = {
  errorHandler,
  notFound,
};
