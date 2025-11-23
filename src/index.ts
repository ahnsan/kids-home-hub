/**
 * Kids Home Hub - Production-Grade Cloudflare Worker API
 *
 * Security Features:
 * - Rate limiting (100 req/min per IP)
 * - Input validation with Zod
 * - CORS configuration
 * - Security headers (HSTS, CSP, etc.)
 * - SQL injection prevention
 * - Request sanitization
 *
 * Performance:
 * - Response compression
 * - Efficient KV operations
 * - Parallel data fetching
 * - Request timeout handling
 *
 * Reliability:
 * - Graceful error handling
 * - Proper HTTP status codes
 * - Circuit breaker pattern
 * - Comprehensive logging
 */

import { Hono } from 'hono';
import { compress } from 'hono/compress';
import { cache } from 'hono/cache';
import type { Env, Variables } from './types';

// Middleware
import {
  corsMiddleware,
  securityHeadersMiddleware,
  rateLimiter,
  requestIdMiddleware,
  timingMiddleware,
  ipMiddleware,
  contentTypeValidator,
} from './middleware/security';

// Handlers
import { transactionHandler } from './handlers/transaction';
import { submitChoresHandler, getChoresHandler } from './handlers/chores';
import { redeemHandler } from './handlers/redeem';
import { getDataHandler } from './handlers/data';

// Utils
import { errorHandler } from './utils/error-handler';
import { Logger } from './utils/logger';

// Create Hono app
const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// ========== GLOBAL MIDDLEWARE ==========

// Request tracking and timing
app.use('*', requestIdMiddleware);
app.use('*', timingMiddleware);
app.use('*', ipMiddleware);

// Security middleware
app.use('*', corsMiddleware);
app.use('*', securityHeadersMiddleware);
app.use('*', rateLimiter);

// Content type validation for POST requests
app.use('/v1/*', contentTypeValidator);

// Response compression
app.use('*', compress());

// ========== HEALTH CHECK ==========

app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: 'v1',
  });
});

app.get('/v1/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: 'v1',
  });
});

// ========== API ROUTES - VERSION 1 ==========

/**
 * POST /v1/transaction
 * Create a transaction (money, points, or screen time)
 */
app.post('/v1/transaction', transactionHandler);

/**
 * POST /v1/chores
 * Submit completed chores
 */
app.post('/v1/chores', submitChoresHandler);

/**
 * GET /v1/chores
 * Get list of available chores
 */
app.get(
  '/v1/chores',
  cache({
    cacheName: 'chores-cache',
    cacheControl: 'public, max-age=3600', // Cache for 1 hour
  }),
  getChoresHandler
);

/**
 * POST /v1/redeem
 * Redeem points for screen time
 */
app.post('/v1/redeem', redeemHandler);

/**
 * GET /v1/data
 * Get all data for children
 * Query params: ?child=adam|sami (optional)
 */
app.get('/v1/data', getDataHandler);

// ========== LEGACY ROUTES (for backward compatibility) ==========

// Redirect old routes to new versioned routes
app.post('/transaction', (c) => {
  return c.redirect('/v1/transaction', 301);
});

app.post('/chores', (c) => {
  return c.redirect('/v1/chores', 301);
});

app.post('/redeem', (c) => {
  return c.redirect('/v1/redeem', 301);
});

// ========== UI ROUTES ==========

// Serve the original UI at root
app.get('/', async (c) => {
  // Import the UI rendering function
  const { serveUI } = await import('./ui/renderer');
  return serveUI(c.env.CHILD_SPEND);
});

app.get('/manifest.webmanifest', async (c) => {
  const manifest = {
    name: "Kids Home Hub",
    short_name: "KidsHub",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f7fa",
    theme_color: "#01579b",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png"
      }
    ]
  };

  return c.json(manifest, 200, {
    'Content-Type': 'application/manifest+json',
    'Cache-Control': 'public, max-age=86400',
  });
});

app.get('/sw.js', async (c) => {
  const sw = `
const CACHE_NAME = 'kids-hub-v1';
const ASSETS = ['/', '/manifest.webmanifest'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;
  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request))
  );
});
`;

  return c.text(sw, 200, {
    'Content-Type': 'application/javascript',
    'Cache-Control': 'public, max-age=86400',
  });
});

// ========== 404 HANDLER ==========

app.notFound((c) => {
  const logger = new Logger(c);
  logger.warn('Route not found', { path: c.req.path });

  return c.json(
    {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'The requested resource was not found',
        details: {
          path: c.req.path,
          method: c.req.method,
        },
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: 'v1',
        requestId: c.get('requestId'),
      },
    },
    404
  );
});

// ========== ERROR HANDLER ==========

app.onError(errorHandler);

// ========== EXPORT ==========

export default app;
