/**
 * Security middleware for Kids Home Hub API
 * Implements rate limiting, CORS, security headers, and request validation
 */

import { Context, Next } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import type { Env, Variables, RateLimitEntry } from '../types';

/**
 * Rate limiting middleware
 * Limits to 100 requests per minute per IP
 */
export async function rateLimiter(
  c: Context<{ Bindings: Env; Variables: Variables }>,
  next: Next
): Promise<Response | void> {
  const ip = c.get('ip') || 'unknown';
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 100;

  const key = `ratelimit:${ip}`;

  try {
    // Get current rate limit data
    const data = await c.env.CHILD_SPEND.get(key);
    let entry: RateLimitEntry;

    if (data) {
      entry = JSON.parse(data);

      // Check if window has expired
      if (now > entry.resetAt) {
        entry = { count: 1, resetAt: now + windowMs };
      } else if (entry.count >= maxRequests) {
        // Rate limit exceeded
        const retryAfter = Math.ceil((entry.resetAt - now) / 1000);

        return c.json(
          {
            success: false,
            error: {
              code: 'RATE_LIMIT_EXCEEDED',
              message: 'Too many requests. Please try again later.',
              details: {
                limit: maxRequests,
                window: '1 minute',
                retryAfter,
              },
            },
            meta: {
              timestamp: new Date().toISOString(),
              version: 'v1',
            },
          },
          429,
          {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(entry.resetAt).toISOString(),
          }
        );
      } else {
        entry.count++;
      }
    } else {
      entry = { count: 1, resetAt: now + windowMs };
    }

    // Store updated rate limit data (expires in 2 minutes)
    await c.env.CHILD_SPEND.put(key, JSON.stringify(entry), {
      expirationTtl: 120,
    });

    // Add rate limit headers
    c.header('X-RateLimit-Limit', maxRequests.toString());
    c.header('X-RateLimit-Remaining', (maxRequests - entry.count).toString());
    c.header('X-RateLimit-Reset', new Date(entry.resetAt).toISOString());

    await next();
  } catch (error) {
    // If rate limiting fails, log but allow request through
    console.error('Rate limiting error:', error);
    await next();
  }
}

/**
 * CORS configuration
 * Adjust allowed origins for production
 */
export const corsMiddleware = cors({
  origin: (origin) => {
    // In production, restrict to specific domains
    const allowedOrigins = [
      /^https:\/\/.*\.workers\.dev$/,
      /^https:\/\/kids-home-hub\..*$/,
      'http://localhost:8787',
      'http://127.0.0.1:8787',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ];

    if (!origin) return null; // Allow requests with no origin (mobile apps, etc.)

    const isAllowed = allowedOrigins.some((allowed) => {
      if (typeof allowed === 'string') {
        return origin === allowed;
      }
      return allowed.test(origin);
    });

    return isAllowed ? origin : null;
  },
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  exposeHeaders: ['X-Request-ID', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
  maxAge: 86400, // 24 hours
  credentials: true,
});

/**
 * Security headers middleware
 * Adds HSTS, CSP, and other security headers
 */
export const securityHeadersMiddleware = secureHeaders({
  strictTransportSecurity: 'max-age=63072000; includeSubDomains; preload',
  contentSecurityPolicy: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", 'data:', 'https:'],
    connectSrc: ["'self'"],
    fontSrc: ["'self'", 'data:'],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'none'"],
  },
  xFrameOptions: 'DENY',
  xContentTypeOptions: 'nosniff',
  referrerPolicy: 'strict-origin-when-cross-origin',
  permissionsPolicy: {
    camera: ['none'],
    microphone: ['none'],
    geolocation: ['none'],
    payment: ['none'],
  },
});

/**
 * Request ID middleware
 * Adds unique request ID for tracing
 */
export async function requestIdMiddleware(
  c: Context<{ Bindings: Env; Variables: Variables }>,
  next: Next
): Promise<void> {
  const requestId = c.req.header('X-Request-ID') || crypto.randomUUID();
  c.set('requestId', requestId);
  c.header('X-Request-ID', requestId);
  await next();
}

/**
 * Request timing middleware
 * Tracks request duration
 */
export async function timingMiddleware(
  c: Context<{ Bindings: Env; Variables: Variables }>,
  next: Next
): Promise<void> {
  const startTime = Date.now();
  c.set('startTime', startTime);

  await next();

  const duration = Date.now() - startTime;
  c.header('X-Response-Time', `${duration}ms`);
}

/**
 * IP extraction middleware
 * Extracts client IP from CF headers
 */
export async function ipMiddleware(
  c: Context<{ Bindings: Env; Variables: Variables }>,
  next: Next
): Promise<void> {
  // Cloudflare provides the real IP in CF-Connecting-IP header
  const ip = c.req.header('CF-Connecting-IP')
    || c.req.header('X-Forwarded-For')?.split(',')[0]?.trim()
    || c.req.header('X-Real-IP')
    || 'unknown';

  c.set('ip', ip);
  await next();
}

/**
 * Content validation middleware
 * Ensures request has valid content type
 */
export async function contentTypeValidator(
  c: Context<{ Bindings: Env; Variables: Variables }>,
  next: Next
): Promise<Response | void> {
  const method = c.req.method;

  // Only validate POST requests
  if (method === 'POST') {
    const contentType = c.req.header('Content-Type');

    if (!contentType) {
      return c.json(
        {
          success: false,
          error: {
            code: 'INVALID_CONTENT_TYPE',
            message: 'Content-Type header is required',
          },
          meta: {
            timestamp: new Date().toISOString(),
            version: 'v1',
          },
        },
        400
      );
    }

    const validTypes = [
      'application/json',
      'application/x-www-form-urlencoded',
      'multipart/form-data',
    ];

    const isValid = validTypes.some((type) => contentType.includes(type));

    if (!isValid) {
      return c.json(
        {
          success: false,
          error: {
            code: 'INVALID_CONTENT_TYPE',
            message: 'Invalid Content-Type. Expected JSON or form data',
            details: { received: contentType, accepted: validTypes },
          },
          meta: {
            timestamp: new Date().toISOString(),
            version: 'v1',
          },
        },
        415
      );
    }
  }

  await next();
}

/**
 * Input sanitization helper
 * Prevents XSS and injection attacks
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/[^\w\s\-.,!?()]/g, '') // Allow only safe characters
    .substring(0, 500); // Limit length
}

/**
 * SQL injection prevention
 * Validates that input doesn't contain SQL patterns
 */
export function validateNoSqlInjection(input: string): boolean {
  const sqlPatterns = [
    /(\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b|\bCREATE\b)/i,
    /(\bUNION\b|\bJOIN\b)/i,
    /(--|\/\*|\*\/|;)/,
    /(\bOR\b|\bAND\b)\s+\d+\s*=\s*\d+/i,
  ];

  return !sqlPatterns.some((pattern) => pattern.test(input));
}
