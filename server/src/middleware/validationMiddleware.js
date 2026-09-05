const { body, param, validationResult } = require('express-validator');

/**
 * Process validation results and return errors if any.
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((e) => ({
        field: e.path,
        message: e.msg,
      })),
    });
  }
  next();
};

/**
 * Validation rules for admin login (supports username or email).
 */
const validateLogin = [
  body('email')
    .optional()
    .isString()
    .trim(),
  body('username')
    .optional()
    .isString()
    .trim(),
  body('identifier')
    .optional()
    .isString()
    .trim(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  handleValidationErrors,
];

/**
 * Validation rules for registration creation.
 * Basic validation — detailed field validation happens in the controller
 * since form fields are dynamic per event.
 */
const validateRegistration = [
  body('eventSlug')
    .notEmpty()
    .withMessage('Event slug is required')
    .isString()
    .trim(),
  body('teamName')
    .optional()
    .isString()
    .trim(),
  body('transactionId')
    .optional()
    .isString()
    .trim(),
  handleValidationErrors,
];

/**
 * Validation rules for verification/rejection.
 */
const validateVerification = [
  param('id')
    .notEmpty()
    .withMessage('Registration ID is required'),
  body('remarks')
    .optional()
    .isString()
    .trim(),
  handleValidationErrors,
];

module.exports = {
  validateLogin,
  validateRegistration,
  validateVerification,
  handleValidationErrors,
};
