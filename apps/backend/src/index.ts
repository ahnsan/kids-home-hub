/**
 * Kids Home Hub API - Cloudflare Worker
 *
 * Multi-device sync API for the Kids Home Hub PWA
 */

import { Hono } from 'hono';
import type { Env } from './types/env';
import { cors } from './middleware/cors';
import { requireAuth } from './middleware/auth';

// Import handlers
import * as auth from './handlers/auth';
import * as households from './handlers/households';
import * as children from './handlers/children';
import * as chores from './handlers/chores';
import * as sync from './handlers/sync';

// Create Hono app
const app = new Hono<{ Bindings: Env }>();

// Global middleware
app.use('*', cors);

// Health check
app.get('/', (c) => {
  return c.json({
    name: 'Kids Home Hub API',
    version: '2.0.0',
    status: 'healthy',
    environment: c.env.ENVIRONMENT || 'development',
  });
});

// =============================================================================
// PUBLIC ROUTES (No authentication required)
// =============================================================================

const publicRoutes = app.basePath('/v1');

// Authentication
publicRoutes.post('/auth/magic-link', auth.sendMagicLink);
publicRoutes.post('/auth/verify', auth.verifyMagicLink);

// =============================================================================
// PROTECTED ROUTES (Authentication required)
// =============================================================================

const protectedRoutes = app.basePath('/v1');
protectedRoutes.use('*', requireAuth);

// Authentication (authenticated endpoints)
protectedRoutes.post('/auth/logout', auth.logout);
protectedRoutes.post('/auth/refresh', auth.refreshToken);
protectedRoutes.delete('/auth/account', auth.deleteAccount);

// Households
protectedRoutes.get('/households', households.getHouseholds);
protectedRoutes.post('/households', households.createHousehold);
protectedRoutes.get('/households/:id', households.getHousehold);
protectedRoutes.patch('/households/:id', households.updateHousehold);
protectedRoutes.delete('/households/:id', households.deleteHousehold);

// Children
protectedRoutes.get('/households/:householdId/children', children.getChildren);
protectedRoutes.post('/children', children.createChild);
protectedRoutes.patch('/children/:id', children.updateChild);
protectedRoutes.delete('/children/:id', children.deleteChild);

// Transactions
protectedRoutes.post('/transactions', children.createTransaction);

// Chores
protectedRoutes.get('/chores', chores.getChores);
protectedRoutes.post('/chores', chores.createChore);
protectedRoutes.put('/chores/:id', chores.updateChore);
protectedRoutes.delete('/chores/:id', chores.deleteChore);
protectedRoutes.post('/chores/complete', chores.completeChore);
protectedRoutes.get('/chores/completions', chores.getChoreCompletions);

// Sync (main multi-device sync endpoint)
protectedRoutes.post('/sync', sync.sync);

// =============================================================================
// ERROR HANDLING
// =============================================================================

app.onError((err, c) => {
  console.error('[API] Error:', err);
  return c.json(
    {
      error: 'Internal server error',
      message: err.message,
    },
    500
  );
});

app.notFound((c) => {
  return c.json(
    {
      error: 'Not found',
      message: `Route ${c.req.method} ${c.req.path} not found`,
    },
    404
  );
});

// Export for Cloudflare Workers
export default app;
