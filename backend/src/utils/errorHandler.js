/**
 * Centralized error handling utility
 */

export class AppError extends Error {
  constructor(message, statusCode = 500, field = null, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.field = field;
    this.code = code;
  }
}

/**
 * Validation error: 400
 */
export function validationError(message, field, code = 'VALIDATION_ERROR') {
  return new AppError(message, 400, field, code);
}

/**
 * Not found error: 404
 */
export function notFoundError(message = 'Resource not found') {
  return new AppError(message, 404, null, 'NOT_FOUND');
}

/**
 * Authorization error: 403
 */
export function authorizationError(message = 'Forbidden') {
  return new AppError(message, 403, null, 'FORBIDDEN');
}

/**
 * Format error response
 */
export function formatErrorResponse(error) {
  if (error instanceof AppError) {
    const response = { message: error.message };
    if (error.field || error.code) {
      response.error = {};
      if (error.field) response.error.field = error.field;
      if (error.code) response.error.code = error.code;
    }
    return { statusCode: error.statusCode, response };
  }

  // Unknown error
  const message = error instanceof Error ? error.message : 'Unexpected error';
  return {
    statusCode: 500,
    response: { message }
  };
}

/**
 * Express error handler middleware
 */
export function errorHandler(error, _request, response, _next) {
  const { statusCode, response: errorResponse } = formatErrorResponse(error);
  response.status(statusCode).json(errorResponse);
}

/**
 * Async handler wrapper to catch promise rejections
 */
export function asyncHandler(handler) {
  return (request, response, next) => {
    Promise.resolve(handler(request, response, next)).catch(next);
  };
}
