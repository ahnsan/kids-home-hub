/**
 * Logging utilities with different log levels
 * Ensures no sensitive data is logged
 */

import type { Context } from 'hono';
import type { Env, Variables, ErrorLog, RequestMetrics } from '../types';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

/**
 * Sanitize data before logging to prevent sensitive information leakage
 */
function sanitizeForLog(data: unknown): unknown {
  if (typeof data === 'string') {
    return data.substring(0, 500); // Limit string length
  }

  if (Array.isArray(data)) {
    return data.map(sanitizeForLog);
  }

  if (data && typeof data === 'object') {
    const sanitized: Record<string, unknown> = {};
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'authorization'];

    for (const [key, value] of Object.entries(data)) {
      if (sensitiveKeys.some((sk) => key.toLowerCase().includes(sk))) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeForLog(value);
      }
    }

    return sanitized;
  }

  return data;
}

/**
 * Logger class with context awareness
 */
export class Logger {
  private context: Context<{ Bindings: Env; Variables: Variables }>;
  private minLevel: LogLevel;

  constructor(
    context: Context<{ Bindings: Env; Variables: Variables }>,
    minLevel: LogLevel = LogLevel.INFO
  ) {
    this.context = context;
    this.minLevel = minLevel;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG];
    return levels.indexOf(level) <= levels.indexOf(this.minLevel);
  }

  private log(level: LogLevel, message: string, data?: unknown): void {
    if (!this.shouldLog(level)) return;

    const requestId = this.context.get('requestId') || 'unknown';
    const timestamp = new Date().toISOString();

    const logEntry = {
      timestamp,
      level,
      requestId,
      message,
      data: data ? sanitizeForLog(data) : undefined,
      path: this.context.req.path,
      method: this.context.req.method,
    };

    // In production, you might want to send this to an analytics service
    console.log(JSON.stringify(logEntry));
  }

  error(message: string, error?: unknown): void {
    const errorData = error instanceof Error
      ? {
          message: error.message,
          stack: error.stack,
          name: error.name,
        }
      : error;

    this.log(LogLevel.ERROR, message, errorData);
  }

  warn(message: string, data?: unknown): void {
    this.log(LogLevel.WARN, message, data);
  }

  info(message: string, data?: unknown): void {
    this.log(LogLevel.INFO, message, data);
  }

  debug(message: string, data?: unknown): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  /**
   * Log request metrics
   */
  async logMetrics(statusCode: number): Promise<void> {
    const startTime = this.context.get('startTime');
    const duration = startTime ? Date.now() - startTime : 0;

    const metrics: RequestMetrics = {
      path: this.context.req.path,
      method: this.context.req.method,
      statusCode,
      duration,
      timestamp: new Date().toISOString(),
      ip: this.context.get('ip'),
      userAgent: this.context.req.header('User-Agent'),
    };

    this.info('Request completed', { metrics });

    // Store metrics in KV for analytics (optional)
    try {
      const metricsKey = `metrics:${Date.now()}:${this.context.get('requestId')}`;
      await this.context.env.CHILD_SPEND.put(
        metricsKey,
        JSON.stringify(metrics),
        { expirationTtl: 86400 } // Keep for 24 hours
      );
    } catch (error) {
      // Don't fail request if metrics storage fails
      this.warn('Failed to store metrics', { error });
    }
  }

  /**
   * Log error with full context
   */
  async logError(error: Error | unknown, additionalContext?: Record<string, unknown>): Promise<void> {
    const errorLog: ErrorLog = {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      path: this.context.req.path,
      method: this.context.req.method,
      timestamp: new Date().toISOString(),
      level: 'error',
    };

    this.error('Request error', { ...errorLog, ...additionalContext });

    // Store error in KV for monitoring (optional)
    try {
      const errorKey = `error:${Date.now()}:${this.context.get('requestId')}`;
      await this.context.env.CHILD_SPEND.put(
        errorKey,
        JSON.stringify({ ...errorLog, ...additionalContext }),
        { expirationTtl: 604800 } // Keep for 7 days
      );
    } catch (e) {
      // Don't fail request if error storage fails
      console.error('Failed to store error log:', e);
    }
  }
}

/**
 * Performance monitoring utility
 */
export class PerformanceMonitor {
  private timers: Map<string, number> = new Map();

  start(label: string): void {
    this.timers.set(label, Date.now());
  }

  end(label: string): number {
    const startTime = this.timers.get(label);
    if (!startTime) return 0;

    const duration = Date.now() - startTime;
    this.timers.delete(label);
    return duration;
  }

  measure(label: string): number | undefined {
    const startTime = this.timers.get(label);
    if (!startTime) return undefined;
    return Date.now() - startTime;
  }
}

/**
 * Circuit breaker implementation for resilience
 */
export class CircuitBreaker {
  private failures: number = 0;
  private lastFailureTime: number = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000 // 1 minute
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();

      if (this.state === 'HALF_OPEN') {
        this.state = 'CLOSED';
        this.failures = 0;
      }

      return result;
    } catch (error) {
      this.failures++;
      this.lastFailureTime = Date.now();

      if (this.failures >= this.threshold) {
        this.state = 'OPEN';
      }

      throw error;
    }
  }

  getState(): string {
    return this.state;
  }

  reset(): void {
    this.failures = 0;
    this.state = 'CLOSED';
  }
}
