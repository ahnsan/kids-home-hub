/**
 * CORS middleware
 */

import type { Context, Next } from 'hono';

const ALLOWED_ORIGINS = [
  'https://kids-home-hub-pwa.pages.dev',
  'https://kids-home-hub.com',
  'http://localhost:3000',
  'http://localhost:5173', // Vite dev server
];

/**
 * CORS middleware for PWA access
 */
export async function cors(c: Context, next: Next) {
  const origin = c.req.header('Origin');

  // Check if origin is allowed
  if (origin && (ALLOWED_ORIGINS.includes(origin) || origin.startsWith('http://localhost:'))) {
    c.header('Access-Control-Allow-Origin', origin);
    c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    c.header('Access-Control-Max-Age', '86400'); // 24 hours
    c.header('Access-Control-Allow-Credentials', 'true');
  }

  // Handle preflight requests
  if (c.req.method === 'OPTIONS') {
    return c.body(null, 204);
  }

  return await next();
}
