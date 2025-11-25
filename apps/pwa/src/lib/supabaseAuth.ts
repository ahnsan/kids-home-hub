/**
 * Supabase Authentication Service
 *
 * This service provides authentication functionality using Supabase Auth.
 * It replaces the custom magic link implementation with Supabase's built-in auth.
 *
 * Features:
 * - Magic link authentication (passwordless)
 * - OAuth providers (Google, GitHub, etc.)
 * - Automatic token refresh
 * - Session management across tabs
 * - Email verification
 */

import { supabase, getSession, getUser } from './supabase';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';
import type { User } from '@kids-home-hub/shared';

/**
 * Send magic link to email
 *
 * Supabase will:
 * 1. Send an email with a magic link
 * 2. User clicks the link
 * 3. Supabase redirects back to your app with auth tokens in URL
 * 4. Client automatically detects and stores the session
 */
export async function sendMagicLink(email: string): Promise<void> {
  try {
    console.log('[SupabaseAuth] ========== MAGIC LINK REQUEST START ==========');
    console.log('[SupabaseAuth] Sending magic link to:', email);

    // Log current location details
    console.log('[SupabaseAuth] Location details:', {
      href: window.location.href,
      origin: window.location.origin,
      hostname: window.location.hostname,
      port: window.location.port,
      protocol: window.location.protocol,
    });

    // Dynamically determine redirect URL based on current hostname
    // This ensures production URLs work even when building locally
    const getRedirectUrl = (): string => {
      // If VITE_APP_URL is explicitly set (e.g., in .env.local), use it
      if (import.meta.env.VITE_APP_URL) {
        console.log('[SupabaseAuth] Using VITE_APP_URL from env');
        return `${import.meta.env.VITE_APP_URL}/auth/callback`;
      }

      // Otherwise, use current origin (works for both localhost and production)
      console.log('[SupabaseAuth] Using window.location.origin (no VITE_APP_URL set)');
      return `${window.location.origin}/auth/callback`;
    };

    const redirectUrl = getRedirectUrl();

    console.log('[SupabaseAuth] Environment check:', {
      'import.meta.env.VITE_APP_URL': import.meta.env.VITE_APP_URL,
      'import.meta.env.PROD': import.meta.env.PROD,
      'import.meta.env.DEV': import.meta.env.DEV,
      'window.location.origin': window.location.origin,
      'final redirectUrl': redirectUrl
    });

    // Build the request payload
    const requestPayload = {
      email,
      options: {
        // The URL to redirect to after clicking the magic link
        emailRedirectTo: redirectUrl,
        // Don't create user if they don't exist (set to false to auto-create)
        shouldCreateUser: true,
      },
    };

    console.log('[SupabaseAuth] Request payload:', JSON.stringify(requestPayload, null, 2));
    console.log('[SupabaseAuth] Calling supabase.auth.signInWithOtp...');

    const { error } = await supabase.auth.signInWithOtp(requestPayload);

    if (error) {
      console.error('[SupabaseAuth] Failed to send magic link:', error);
      throw new Error(error.message);
    }

    console.log('[SupabaseAuth] Magic link sent successfully');
    console.log('[SupabaseAuth] ========== MAGIC LINK REQUEST END ==========');
  } catch (error) {
    console.error('[SupabaseAuth] sendMagicLink error:', error);
    throw error;
  }
}

/**
 * Sign in with OAuth provider
 *
 * Supported providers: google, github, gitlab, bitbucket, etc.
 */
export async function signInWithOAuth(
  provider: 'google' | 'github' | 'gitlab' | 'bitbucket'
): Promise<void> {
  try {
    console.log('[SupabaseAuth] Signing in with OAuth provider:', provider);

    // Dynamically determine redirect URL based on current hostname
    const getRedirectUrl = (): string => {
      // If VITE_APP_URL is explicitly set (e.g., in .env.local), use it
      if (import.meta.env.VITE_APP_URL) {
        return `${import.meta.env.VITE_APP_URL}/auth/callback`;
      }

      // Otherwise, use current origin (works for both localhost and production)
      return `${window.location.origin}/auth/callback`;
    };

    const redirectUrl = getRedirectUrl();

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectUrl,
      },
    });

    if (error) {
      console.error('[SupabaseAuth] OAuth sign-in failed:', error);
      throw new Error(error.message);
    }

    // Browser will redirect to OAuth provider
    console.log('[SupabaseAuth] Redirecting to OAuth provider...');
  } catch (error) {
    console.error('[SupabaseAuth] signInWithOAuth error:', error);
    throw error;
  }
}

/**
 * Get current auth session
 *
 * Returns null if not authenticated or session expired
 */
export async function getAuthSession(): Promise<Session | null> {
  try {
    const session = await getSession();

    if (!session) {
      console.log('[SupabaseAuth] No active session');
      return null;
    }

    // Check if session is expired
    const expiresAt = session.expires_at;
    if (expiresAt && Date.now() / 1000 > expiresAt) {
      console.log('[SupabaseAuth] Session expired');
      return null;
    }

    return session;
  } catch (error) {
    console.error('[SupabaseAuth] Failed to get session:', error);
    return null;
  }
}

/**
 * Get current authenticated user
 *
 * Returns null if not authenticated
 */
export async function getCurrentUser(): Promise<SupabaseUser | null> {
  try {
    const user = await getUser();

    if (!user) {
      console.log('[SupabaseAuth] No authenticated user');
      return null;
    }

    return user;
  } catch (error) {
    console.error('[SupabaseAuth] Failed to get user:', error);
    return null;
  }
}

/**
 * Get auth token for API requests
 *
 * This token should be sent in the Authorization header:
 * Authorization: Bearer <token>
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    const session = await getAuthSession();

    if (!session) {
      return null;
    }

    return session.access_token;
  } catch (error) {
    console.error('[SupabaseAuth] Failed to get auth token:', error);
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getAuthSession();
  return session !== null;
}

/**
 * Sign out user
 */
export async function logout(): Promise<void> {
  try {
    console.log('[SupabaseAuth] Logging out user');

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('[SupabaseAuth] Logout failed:', error);
      throw new Error(error.message);
    }

    console.log('[SupabaseAuth] Logout successful');
  } catch (error) {
    console.error('[SupabaseAuth] logout error:', error);
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
    console.log('[SupabaseAuth] Refreshing auth token');

    const { data, error } = await supabase.auth.refreshSession();

    if (error) {
      console.error('[SupabaseAuth] Token refresh failed:', error);
      throw new Error(error.message);
    }

    console.log('[SupabaseAuth] Token refresh successful');
    return data.session;
  } catch (error) {
    console.error('[SupabaseAuth] refreshToken error:', error);
    return null;
  }
}

/**
 * Convert Supabase user to app User type
 *
 * This maps Supabase's user object to your app's User type.
 * Adjust the mapping based on your User type definition.
 */
export function mapSupabaseUserToAppUser(
  supabaseUser: SupabaseUser,
  additionalData?: Partial<User>
): User {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    createdAt: new Date(supabaseUser.created_at),
    updatedAt: new Date(supabaseUser.updated_at || supabaseUser.created_at),
    // Add additional fields from your User type
    householdId: additionalData?.householdId,
    name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || '',
    ...additionalData,
  } as User;
}

/**
 * Delete user account
 *
 * Note: This requires admin privileges or a custom edge function
 * For now, you'll need to handle this via your backend API
 */
export async function deleteAccount(): Promise<void> {
  console.warn('[SupabaseAuth] Account deletion must be handled by backend API');
  throw new Error('Account deletion not implemented - use backend API');
}

/**
 * Update user profile
 */
export async function updateUserProfile(updates: {
  email?: string;
  password?: string;
  data?: Record<string, any>;
}): Promise<SupabaseUser | null> {
  try {
    console.log('[SupabaseAuth] Updating user profile');

    const { data, error } = await supabase.auth.updateUser(updates);

    if (error) {
      console.error('[SupabaseAuth] Profile update failed:', error);
      throw new Error(error.message);
    }

    console.log('[SupabaseAuth] Profile updated successfully');
    return data.user;
  } catch (error) {
    console.error('[SupabaseAuth] updateUserProfile error:', error);
    return null;
  }
}

/**
 * Listen to auth state changes
 *
 * Callback will be called whenever:
 * - User signs in
 * - User signs out
 * - Token is refreshed
 * - Session expires
 */
export function onAuthStateChange(
  callback: (event: string, session: Session | null) => void
): () => void {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    console.log('[SupabaseAuth] Auth state changed:', event);
    callback(event, session);
  });

  // Return unsubscribe function
  return () => {
    subscription.unsubscribe();
  };
}

/**
 * Dev login - for development only
 *
 * This uses Supabase's dev mode or a custom implementation
 * In production, this should be disabled
 */
export async function devLogin(email: string): Promise<void> {
  if (import.meta.env.PROD) {
    throw new Error('Dev login is only available in development mode');
  }

  console.log('[SupabaseAuth] Dev login - sending magic link without verification');

  // In development, just send a magic link
  // You can configure Supabase to skip email verification in dev
  await sendMagicLink(email);
}
