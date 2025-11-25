import { Request, Response } from 'express';
import { ValidationError, DuplicateEmailError, UserNotFoundError } from '../services/user-service';

/**
 * Centralized error handler for user routes
 * @param error - The error that occurred
 * @param req - Express request object
 * @param res - Express response object
 * @param operation - Description of the operation being performed (e.g., 'creating user', 'retrieving user')
 */
export function handleUserRouteError(
  error: unknown,
  req: Request,
  res: Response,
  operation: string
): void {
  // Handle validation errors
  if (error instanceof ValidationError) {
    console.error('[ERROR] Validation error:', {
      message: error.message,
      field: error.field,
      url: req.url,
      method: req.method
    });
    res.status(400).json({
      status: 'error',
      error: 'validation_error',
      message: error.message,
      field: error.field
    });
    return;
  }

  // Handle duplicate email errors
  if (error instanceof DuplicateEmailError) {
    console.error('[ERROR] Duplicate email error:', {
      message: error.message,
      url: req.url,
      method: req.method
    });
    res.status(409).json({
      status: 'error',
      error: 'duplicate_email',
      message: error.message,
      field: 'email'
    });
    return;
  }

  // Handle user not found errors
  if (error instanceof UserNotFoundError) {
    console.error('[ERROR] User not found:', {
      message: error.message,
      url: req.url,
      method: req.method
    });
    res.status(404).json({
      status: 'error',
      error: 'user_not_found',
      message: error.message
    });
    return;
  }

  // Handle database connection errors
  if (error instanceof Error && error.message.includes('connect')) {
    console.error('[ERROR] Database connection error:', {
      message: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method
    });
    res.status(503).json({
      status: 'error',
      error: 'database_unavailable',
      message: 'Unable to connect to database',
      details: error.message
    });
    return;
  }

  // Handle other errors
  console.error(`[ERROR] Unexpected error ${operation}:`, {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    url: req.url,
    method: req.method
  });

  res.status(500).json({
    status: 'error',
    error: 'internal_server_error',
    message: `An unexpected error occurred while ${operation}`,
    details: error instanceof Error ? error.message : String(error)
  });
}