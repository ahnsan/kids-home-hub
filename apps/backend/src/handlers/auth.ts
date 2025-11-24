/**
 * Authentication handlers
 */

import type { Context } from 'hono';
import type { Env } from '../types/env';
import { createDbConnection } from '../utils/db';
import { signToken } from '../utils/jwt';
import {
  generateMagicLinkToken,
  getMagicLinkExpiration,
  buildMagicLinkUrl,
  sendMagicLinkEmail,
} from '../utils/magicLink';

/**
 * POST /v1/auth/magic-link
 * Send magic link to email
 */
export async function sendMagicLink(c: Context<{ Bindings: Env }>) {
  try {
    const body = await c.req.json();
    const { email, redirectUrl } = body;

    if (!email || !redirectUrl) {
      return c.json({ error: 'Email and redirectUrl are required' }, 400);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return c.json({ error: 'Invalid email format' }, 400);
    }

    const sql = createDbConnection(c.env.DATABASE_URL);

    // Generate token and expiration
    const token = generateMagicLinkToken();
    const expiresAt = getMagicLinkExpiration();

    // Store magic link token in database
    await sql`
      INSERT INTO magic_link_tokens (email, token, expires_at)
      VALUES (${email.toLowerCase()}, ${token}, ${expiresAt})
    `;

    // Build magic link URL
    const magicLinkUrl = buildMagicLinkUrl(redirectUrl, token, email);

    // Send email via Resend
    await sendMagicLinkEmail(email, magicLinkUrl, c.env.RESEND_API_KEY);

    return c.json({
      success: true,
      message: 'Magic link sent to email',
    });
  } catch (error) {
    console.error('[Auth] Send magic link error:', error);
    return c.json({ error: 'Failed to send magic link' }, 500);
  }
}

/**
 * POST /v1/auth/verify
 * Verify magic link token and create session
 */
export async function verifyMagicLink(c: Context<{ Bindings: Env }>) {
  try {
    const body = await c.req.json();
    const { email, token } = body;

    if (!email || !token) {
      return c.json({ error: 'Email and token are required' }, 400);
    }

    const sql = createDbConnection(c.env.DATABASE_URL);

    // Find and verify token
    const magicLinkResult = await sql`
      SELECT * FROM magic_link_tokens
      WHERE email = ${email.toLowerCase()}
        AND token = ${token}
        AND expires_at > NOW()
        AND used_at IS NULL
      LIMIT 1
    ` as any[];

    const magicLink = magicLinkResult[0];

    if (!magicLink) {
      return c.json({ error: 'Invalid or expired magic link' }, 401);
    }

    // Mark token as used
    await sql`
      UPDATE magic_link_tokens
      SET used_at = NOW()
      WHERE id = ${magicLink.id}
    `;

    // Get or create user
    const userResult = await sql`
      SELECT get_or_create_user(${email.toLowerCase()}) as id
    ` as any[];

    const userId = userResult[0]?.id;

    if (!userId) {
      throw new Error('Failed to get or create user');
    }

    // Get full user details
    const userDetailsResult = await sql`
      SELECT u.id, u.email, u.created_at, u.updated_at,
             h.id as household_id, h.name as household_name
      FROM users u
      LEFT JOIN households h ON h.created_by = u.id
      WHERE u.id = ${userId}
    ` as any[];

    const userDetails = userDetailsResult[0];

    // Create session token
    const sessionToken = await signToken(
      {
        userId: userDetails.id,
        email: userDetails.email,
        householdId: userDetails.household_id || undefined,
      },
      c.env.JWT_SECRET,
      '30d'
    );

    // Store session in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    await sql`
      INSERT INTO user_sessions (user_id, token, expires_at)
      VALUES (${userId}, ${sessionToken}, ${expiresAt})
    `;

    // Return session
    return c.json({
      token: sessionToken,
      expiresAt: expiresAt.toISOString(),
      user: {
        id: userDetails.id,
        email: userDetails.email,
        householdId: userDetails.household_id || undefined,
      },
    });
  } catch (error) {
    console.error('[Auth] Verify magic link error:', error);
    return c.json({ error: 'Failed to verify magic link' }, 500);
  }
}

/**
 * POST /v1/auth/logout
 * Invalidate session token
 */
export async function logout(c: Context<{ Bindings: Env }>) {
  try {
    const user = c.get('user');
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return c.json({ success: true });
    }

    const sql = createDbConnection(c.env.DATABASE_URL);

    // Delete session
    await sql`
      DELETE FROM user_sessions
      WHERE user_id = ${user.userId}
        AND token = ${token}
    `;

    return c.json({ success: true });
  } catch (error) {
    console.error('[Auth] Logout error:', error);
    return c.json({ error: 'Logout failed' }, 500);
  }
}

/**
 * POST /v1/auth/refresh
 * Refresh authentication token
 */
export async function refreshToken(c: Context<{ Bindings: Env }>) {
  try {
    const user = c.get('user');
    const sql = createDbConnection(c.env.DATABASE_URL);

    // Verify session exists
    const sessionResult = await sql`
      SELECT * FROM user_sessions
      WHERE user_id = ${user.userId}
        AND expires_at > NOW()
      LIMIT 1
    ` as any[];

    const session = sessionResult[0];

    if (!session) {
      return c.json({ error: 'Session expired' }, 401);
    }

    // Get current user details
    const userDetailsResult = await sql`
      SELECT u.id, u.email,
             h.id as household_id
      FROM users u
      LEFT JOIN households h ON h.created_by = u.id
      WHERE u.id = ${user.userId}
    ` as any[];

    const userDetails = userDetailsResult[0];

    // Create new token
    const newToken = await signToken(
      {
        userId: userDetails.id,
        email: userDetails.email,
        householdId: userDetails.household_id || undefined,
      },
      c.env.JWT_SECRET,
      '30d'
    );

    // Update session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await sql`
      UPDATE user_sessions
      SET token = ${newToken}, expires_at = ${expiresAt}, last_active_at = NOW()
      WHERE id = ${session.id}
    `;

    return c.json({
      token: newToken,
      expiresAt: expiresAt.toISOString(),
      user: {
        id: userDetails.id,
        email: userDetails.email,
        householdId: userDetails.household_id || undefined,
      },
    });
  } catch (error) {
    console.error('[Auth] Refresh token error:', error);
    return c.json({ error: 'Failed to refresh token' }, 500);
  }
}

/**
 * DELETE /v1/auth/account
 * Delete user account and all data
 */
export async function deleteAccount(c: Context<{ Bindings: Env }>) {
  try {
    const user = c.get('user');
    const sql = createDbConnection(c.env.DATABASE_URL);

    // Delete user (cascades to all related data)
    await sql`
      DELETE FROM users
      WHERE id = ${user.userId}
    `;

    return c.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    console.error('[Auth] Delete account error:', error);
    return c.json({ error: 'Failed to delete account' }, 500);
  }
}

/**
 * POST /v1/auth/dev-login
 * Development-only login bypass (skips email verification)
 *
 * Security measures:
 * - Only works when ENVIRONMENT is set to 'development'
 * - Auto-creates user if they don't exist
 * - Creates session directly without magic link
 * - Returns same response format as verify endpoint
 */
export async function devLogin(c: Context<{ Bindings: Env }>) {
  try {
    // SECURITY: Only allow in development environment
    const environment = c.env.ENVIRONMENT || 'development';

    if (environment !== 'development') {
      console.warn('[Auth] Dev login attempted in non-development environment:', environment);
      return c.json({
        error: 'Dev login is only available in development environment'
      }, 403);
    }

    const body = await c.req.json();
    const { email } = body;

    if (!email) {
      return c.json({ error: 'Email is required' }, 400);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return c.json({ error: 'Invalid email format' }, 400);
    }

    console.log('[Auth] Dev login for:', email);

    const sql = createDbConnection(c.env.DATABASE_URL);

    // Get or create user (same as magic link flow)
    const userResult = await sql`
      SELECT get_or_create_user(${email.toLowerCase()}) as id
    ` as any[];

    const userId = userResult[0]?.id;

    if (!userId) {
      throw new Error('Failed to get or create user');
    }

    // Get full user details
    const userDetailsResult = await sql`
      SELECT u.id, u.email, u.created_at, u.updated_at,
             h.id as household_id, h.name as household_name
      FROM users u
      LEFT JOIN households h ON h.created_by = u.id
      WHERE u.id = ${userId}
    ` as any[];

    const userDetails = userDetailsResult[0];

    // Create session token
    const sessionToken = await signToken(
      {
        userId: userDetails.id,
        email: userDetails.email,
        householdId: userDetails.household_id || undefined,
      },
      c.env.JWT_SECRET,
      '30d'
    );

    // Store session in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    await sql`
      INSERT INTO user_sessions (user_id, token, expires_at)
      VALUES (${userId}, ${sessionToken}, ${expiresAt})
    `;

    console.log('[Auth] Dev login successful for:', email);

    // Return session (same format as verify endpoint)
    return c.json({
      token: sessionToken,
      expiresAt: expiresAt.toISOString(),
      user: {
        id: userDetails.id,
        email: userDetails.email,
        householdId: userDetails.household_id || undefined,
      },
    });
  } catch (error) {
    console.error('[Auth] Dev login error:', error);
    return c.json({ error: 'Failed to perform dev login' }, 500);
  }
}
