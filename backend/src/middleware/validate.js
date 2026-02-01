const Joi = require('joi');
const AppError = require('../utils/AppError');

/**
 * Validation middleware factory
 * @param {Object} schema - Joi validation schema
 * @param {string} property - Request property to validate (body, query, params)
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const messages = error.details.map(detail => detail.message).join(', ');
      return next(new AppError(messages, 400));
    }

    // Replace request property with validated value
    req[property] = value;
    next();
  };
};

module.exports = validate;
