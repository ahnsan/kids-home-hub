/**
 * Supabase client configuration
 *
 * This file sets up the Supabase client for authentication and database access.
 * The client is configured to:
 * - Use localStorage for session persistence
 * - Auto-refresh tokens before expiry
 * - Detect session changes across browser tabs
 */

import { createClient } from '@supabase/supabase-js';

// Get Supabase configuration from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate configuration
if (!supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable');
}

/**
 * Supabase client singleton
 *
 * Configuration:
 * - auth.storage: Uses localStorage for session persistence
 * - auth.autoRefreshToken: Automatically refreshes tokens before expiry
 * - auth.persistSession: Persists session across browser reloads
 * - auth.detectSessionInUrl: Detects auth tokens in URL (for magic links)
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: window.localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce', // Use PKCE flow for better security
  },
});

/**
 * Get current session
 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error('[Supabase] Failed to get session:', error);
    return null;
  }
  return data.session;
}

/**
 * Get current user
 */
export async function getUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.error('[Supabase] Failed to get user:', error);
    return null;
  }
  return data.user;
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(
  callback: (event: string, session: any) => void
) {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    console.log('[Supabase] Auth state changed:', event);
    callback(event, session);
  });

  // Return unsubscribe function
  return () => {
    subscription.unsubscribe();
  };
}
