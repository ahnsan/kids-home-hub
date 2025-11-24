/**
 * Authentication service
 *
 * Now uses Supabase Auth for passwordless authentication via magic links.
 * Benefits:
 * - Built-in magic link handling (no custom token management)
 * - Automatic token refresh
 * - OAuth provider support (Google, GitHub, etc.)
 * - Session management across tabs
 * - Secure by default with JWT tokens
 * - Better iOS PWA support
 */

import type { User } from '@kids-home-hub/shared';
import type { Session } from '@supabase/supabase-js';
import {
  sendMagicLink as supabaseSendMagicLink,
  signInWithOAuth as supabaseSignInWithOAuth,
  getAuthSession,
  getCurrentUser as supabaseGetCurrentUser,
  getAuthToken as supabaseGetAuthToken,
  isAuthenticated as supabaseIsAuthenticated,
  logout as supabaseLogout,
  refreshToken as supabaseRefreshToken,
  mapSupabaseUserToAppUser,
  onAuthStateChange as supabaseOnAuthStateChange,
  devLogin as supabaseDevLogin,
} from './supabaseAuth';

/**
 * Send magic link to email
 *
 * Supabase handles:
 * - Email sending
 * - Token generation
 * - Link expiration
 * - One-time use enforcement
 */
export async function sendMagicLink(email: string): Promise<void> {
  try {
    console.log('[Auth] Sending magic link via Supabase');
    await supabaseSendMagicLink(email);
    console.log('[Auth] Magic link sent successfully');
  } catch (error) {
    console.error('[Auth] Failed to send magic link:', error);
    throw error;
  }
}

/**
 * Sign in with OAuth provider
 *
 * Supported providers: google, github, gitlab, bitbucket
 */
export async function signInWithOAuth(
  provider: 'google' | 'github' | 'gitlab' | 'bitbucket'
): Promise<void> {
  try {
    console.log('[Auth] Signing in with OAuth provider:', provider);
    await supabaseSignInWithOAuth(provider);
  } catch (error) {
    console.error('[Auth] OAuth sign-in failed:', error);
    throw error;
  }
}

/**
 * Get current auth session
 */
export async function getSession(): Promise<Session | null> {
  return await getAuthSession();
}

/**
 * Get current auth token
 *
 * This token should be used in API requests:
 * Authorization: Bearer <token>
 */
export async function getAuthToken(): Promise<string | null> {
  return await supabaseGetAuthToken();
}

/**
 * Get current user
 *
 * Returns the Supabase user mapped to app User type
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const supabaseUser = await supabaseGetCurrentUser();

    if (!supabaseUser) {
      return null;
    }

    // Map Supabase user to app User type
    // You may need to fetch additional user data from your backend API
    return mapSupabaseUserToAppUser(supabaseUser);
  } catch (error) {
    console.error('[Auth] Failed to get current user:', error);
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  return await supabaseIsAuthenticated();
}

/**
 * Logout user
 *
 * Clears Supabase session and local storage
 */
export async function logout(): Promise<void> {
  try {
    console.log('[Auth] Logging out user');
    await supabaseLogout();
    console.log('[Auth] Logout successful');
  } catch (error) {
    console.error('[Auth] Logout failed:', error);
    throw error;
  }
}

/**
 * Refresh auth token
 *
 * Supabase automatically refreshes tokens, but this can be called manually
 */
export async function refreshToken(): Promise<Session | null> {
  try {
    console.log('[Auth] Refreshing auth token');
    const session = await supabaseRefreshToken();
    console.log('[Auth] Token refresh successful');
    return session;
  } catch (error) {
    console.error('[Auth] Token refresh failed:', error);
    return null;
  }
}

/**
 * Listen to auth state changes
 *
 * This is useful for:
 * - Updating UI when user signs in/out
 * - Handling token refresh
 * - Syncing auth state across tabs
 */
export function onAuthStateChange(
  callback: (event: string, session: Session | null) => void
): () => void {
  return supabaseOnAuthStateChange(callback);
}

/**
 * Delete account
 *
 * Note: Account deletion should be handled by your backend API
 * This is a placeholder that calls your API endpoint
 */
export async function deleteAccount(): Promise<void> {
  try {
    console.log('[Auth] Deleting account');

    // Get auth token
    const token = await getAuthToken();

    if (!token) {
      throw new Error('Not authenticated');
    }

    // Call your backend API to delete the account
    // This should handle both Supabase user deletion and app data cleanup
    const response = await fetch(`${import.meta.env.VITE_API_URL}/v1/auth/account`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete account');
    }

    // Sign out after deletion
    await logout();

    console.log('[Auth] Account deleted successfully');
  } catch (error) {
    console.error('[Auth] Failed to delete account:', error);
    throw error;
  }
}

/**
 * Dev login - bypass email verification (development only)
 *
 * In development, this sends a magic link that can be used immediately
 * In production, this will throw an error
 */
export async function devLogin(email: string): Promise<void> {
  if (!isDevMode()) {
    throw new Error('Dev login is only available in development mode');
  }

  try {
    console.log('[Auth] Dev login for:', email);
    await supabaseDevLogin(email);
    console.log('[Auth] Dev login successful - check email for magic link');
  } catch (error) {
    console.error('[Auth] Dev login failed:', error);
    throw error;
  }
}

/**
 * Check if dev mode is enabled
 */
export function isDevMode(): boolean {
  return import.meta.env.DEV || import.meta.env.MODE === 'development';
}

/**
 * Clear auth session (local helper for backwards compatibility)
 * Use logout() instead for complete sign out
 */
export async function clearAuthSession(): Promise<void> {
  console.warn('[Auth] clearAuthSession() is deprecated, use logout() instead');
  await logout();
}

/**
 * Verify magic link token (deprecated - Supabase handles this automatically)
 *
 * Supabase automatically handles magic link verification when the user
 * clicks the link. The session is established automatically.
 *
 * This function is kept for backwards compatibility but just checks
 * if there's an active session.
 */
export async function verifyMagicLink(_token: string, _email: string): Promise<{ user: User; token: string }> {
  console.warn('[Auth] verifyMagicLink() is deprecated - Supabase handles this automatically');

  // Check if we have an active session
  const session = await getAuthSession();
  if (!session) {
    throw new Error('No active session found after magic link click');
  }

  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Failed to get user after magic link verification');
  }

  return {
    user,
    token: session.access_token,
  };
}
