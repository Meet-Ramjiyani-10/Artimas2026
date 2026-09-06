/**
 * Centralized error handling middleware.
 *
 * Returns consistent JSON error responses.
 * Hides stack traces in production.
 */

// Handle 404 — route not found
const notFound = (req, res, next) => {
  const error = new Error(`Not found — ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

// Global error handler
const errorHandler = (err, req, res, _next) => {
  let statusCode = err.statusCode || res.statusCode || 500;
  // Ensure we don't send a 200 status on error
  if (statusCode < 400) statusCode = 500;

  let message = err.message || 'Internal server error';

  // Mongoose bad ObjectId
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 400;
    message = 'Invalid resource ID format';
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    statusCode = 409;
    if (err.keyValue && err.keyValue.transactionId) {
      message = `Transaction ID "${err.keyValue.transactionId}" has already been used. Each transaction ID must be unique across all registrations.`;
      return res.status(409).json({
        success: false,
        clashingTransactionId: err.keyValue.transactionId,
        message,
      });
    }

    if (err.keyValue && (err.keyValue.participantEmails || (err.keyPattern && err.keyPattern.participantEmails))) {
      const email = err.keyValue.participantEmails || 'A participant';
      message = `Participant "${email}" is already registered for this event. Every participant can only participate once per event.`;
      return res.status(409).json({
        success: false,
        clashingEmail: typeof email === 'string' ? email : undefined,
        message,
      });
    }

    if (err.keyValue && (err.keyValue.normalizedTeamName || (err.keyPattern && err.keyPattern.normalizedTeamName))) {
      message = 'A team with this name is already registered for this event. Please choose a distinct team name.';
      return res.status(409).json({
        success: false,
        message,
      });
    }

    const field = Object.keys(err.keyValue || {}).join(', ');
    message = `Duplicate value for field: ${field}`;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const messages = Object.values(err.errors).map((e) => e.message);
    message = messages.join('. ');
  }

  // Multer file size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 413;
    message = 'File too large — maximum size is 5MB';
  }

  // Multer unexpected field
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    statusCode = 400;
    message = 'Unexpected file field';
  }

  const response = {
    success: false,
    message,
  };

  // Include stack trace in development only
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = { notFound, errorHandler };
