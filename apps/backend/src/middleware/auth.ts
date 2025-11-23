/**
 * Authentication middleware
 */

import type { Context, Next } from 'hono';
import type { Env } from '../types/env';
import { extractBearerToken, verifyToken, type JWTPayload } from '../utils/jwt';

// Extend Hono context with user
declare module 'hono' {
  interface ContextVariableMap {
    user: JWTPayload;
  }
}

/**
 * Middleware to verify JWT and attach user to context
 */
export async function requireAuth(c: Context<{ Bindings: Env }>, next: Next) {
  const authHeader = c.req.header('Authorization');
  const token = extractBearerToken(authHeader);

  if (!token) {
    return c.json({ error: 'Missing authentication token' }, 401);
  }

  try {
    const payload = await verifyToken(token, c.env.JWT_SECRET);
    c.set('user', payload);
    return await next();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Authentication failed';
    return c.json({ error: message }, 401);
  }
}

/**
 * Optional auth middleware - doesn't fail if no token
 */
export async function optionalAuth(c: Context<{ Bindings: Env }>, next: Next) {
  const authHeader = c.req.header('Authorization');
  const token = extractBearerToken(authHeader);

  if (token) {
    try {
      const payload = await verifyToken(token, c.env.JWT_SECRET);
      c.set('user', payload);
    } catch {
      // Invalid token, continue without user
    }
  }

  return await next();
}
