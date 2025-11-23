/**
 * Authentication service
 *
 * Uses a custom JWT + magic link solution for passwordless authentication.
 * This is optimal for a PWA because:
 * - Works on iOS (magic links can't open PWA directly)
 * - Simple implementation without external dependencies
 * - Full control over auth flow
 * - Compatible with Neon database
 */

import { api } from '../api/client';
import type { User, AuthSession, MagicLinkRequest, MagicLinkVerification } from '@kids-home-hub/shared';

const AUTH_TOKEN_KEY = 'auth_token';
const AUTH_USER_KEY = 'auth_user';
const AUTH_EXPIRES_KEY = 'auth_expires';

/**
 * Send magic link to email
 */
export async function sendMagicLink(email: string): Promise<void> {
  const request: MagicLinkRequest = {
    email,
    redirectUrl: window.location.origin
  };

  await api.post('v1/auth/magic-link', { json: request }).json();
}

/**
 * Verify magic link token and create session
 */
export async function verifyMagicLink(token: string, email: string): Promise<AuthSession> {
  const request: MagicLinkVerification = { token, email };

  const session = await api.post('v1/auth/verify', { json: request }).json<AuthSession>();

  // Store session in localStorage
  localStorage.setItem(AUTH_TOKEN_KEY, session.token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(session.user));
  localStorage.setItem(AUTH_EXPIRES_KEY, session.expiresAt.toString());

  return session;
}

/**
 * Get current auth token
 */
export function getAuthToken(): string | null {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  const expiresAt = localStorage.getItem(AUTH_EXPIRES_KEY);

  if (!token || !expiresAt) {
    return null;
  }

  // Check if token expired
  if (Date.now() > parseInt(expiresAt)) {
    clearAuthSession();
    return null;
  }

  return token;
}

/**
 * Get current user from localStorage
 */
export function getCurrentUser(): User | null {
  const userStr = localStorage.getItem(AUTH_USER_KEY);
  if (!userStr) {
    return null;
  }

  try {
    return JSON.parse(userStr) as User;
  } catch (error) {
    console.error('[Auth] Failed to parse user:', error);
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return getAuthToken() !== null;
}

/**
 * Clear auth session
 */
export function clearAuthSession(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  localStorage.removeItem(AUTH_EXPIRES_KEY);
}

/**
 * Logout user
 */
export async function logout(): Promise<void> {
  try {
    // Call logout endpoint to invalidate token
    await api.post('v1/auth/logout').json();
  } catch (error) {
    console.error('[Auth] Logout API call failed:', error);
  } finally {
    // Clear local session regardless
    clearAuthSession();
  }
}

/**
 * Refresh auth token if needed
 */
export async function refreshToken(): Promise<string | null> {
  const currentToken = getAuthToken();

  if (!currentToken) {
    return null;
  }

  try {
    const session = await api.post('v1/auth/refresh', {
      headers: {
        Authorization: `Bearer ${currentToken}`
      }
    }).json<AuthSession>();

    // Update stored session
    localStorage.setItem(AUTH_TOKEN_KEY, session.token);
    localStorage.setItem(AUTH_EXPIRES_KEY, session.expiresAt.toString());

    return session.token;
  } catch (error) {
    console.error('[Auth] Token refresh failed:', error);
    clearAuthSession();
    return null;
  }
}

/**
 * Delete account and all data
 */
export async function deleteAccount(): Promise<void> {
  await api.delete('v1/auth/account').json();
  clearAuthSession();
}
