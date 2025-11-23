/**
 * Centralized error handling
 */

import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { ZodError } from 'zod';
import type { Env, Variables, ApiResponse } from '../types';
import { Logger } from './logger';

/**
 * Custom application errors
 */
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR',
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
    this.name = 'RateLimitError';
  }
}

export class InsufficientBalanceError extends AppError {
  constructor(message: string = 'Insufficient balance') {
    super(message, 400, 'INSUFFICIENT_BALANCE');
    this.name = 'InsufficientBalanceError';
  }
}

/**
 * Format Zod validation errors
 */
function formatZodError(error: ZodError): { message: string; details: unknown } {
  const errors = error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code,
  }));

  return {
    message: 'Validation failed',
    details: errors,
  };
}

/**
 * Global error handler middleware
 */
export async function errorHandler(
  error: Error | HTTPException | AppError | ZodError,
  c: Context<{ Bindings: Env; Variables: Variables }>
): Promise<Response> {
  const logger = new Logger(c);
  const isDev = c.env.ENVIRONMENT !== 'production';

  // Default error response
  let statusCode = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'An unexpected error occurred';
  let details: unknown = undefined;

  // Handle different error types
  if (error instanceof ZodError) {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    const formatted = formatZodError(error);
    message = formatted.message;
    details = formatted.details;
  } else if (error instanceof HTTPException) {
    statusCode = error.status;
    code = `HTTP_${statusCode}`;
    message = error.message;
  } else if (error instanceof AppError) {
    statusCode = error.statusCode;
    code = error.code;
    message = error.message;
    details = error.details;
  } else if (error instanceof Error) {
    message = isDev ? error.message : 'An unexpected error occurred';
    if (isDev) {
      details = { stack: error.stack };
    }
  }

  // Log error
  await logger.logError(error, {
    statusCode,
    code,
    isDev,
  });

  // Build error response
  const response: ApiResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
    },
    meta: {
      timestamp: new Date().toISOString(),
      version: 'v1',
      requestId: c.get('requestId'),
    },
  };

  // Log metrics
  await logger.logMetrics(statusCode);

  return c.json(response, statusCode);
}

/**
 * Async error wrapper for handlers
 */
export function asyncHandler<T>(
  fn: (c: Context<{ Bindings: Env; Variables: Variables }>) => Promise<T>
) {
  return async (c: Context<{ Bindings: Env; Variables: Variables }>): Promise<T | Response> => {
    try {
      return await fn(c);
    } catch (error) {
      return errorHandler(error as Error, c);
    }
  };
}

/**
 * Timeout wrapper to prevent long-running requests
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 10000,
  errorMessage: string = 'Request timeout'
): Promise<T> {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new AppError(errorMessage, 504, 'TIMEOUT')), timeoutMs);
  });

  return Promise.race([promise, timeout]);
}
