/**
 * Authentication state management with Preact Signals
 *
 * Now integrated with Supabase Auth for:
 * - Automatic session management
 * - Token refresh handling
 * - Cross-tab synchronization
 * - Real-time auth state updates
 */

import { signal, computed } from '@preact/signals';
import type { User } from '@kids-home-hub/shared';
import type { Session } from '@supabase/supabase-js';
import { getCurrentUser, onAuthStateChange, getSession } from '../lib/auth';
import { api } from '../api/client';
import { children } from './childrenStore';

/**
 * User signal
 */
export const user = signal<User | null>(null);

/**
 * Session signal (Supabase session)
 */
export const session = signal<Session | null>(null);

/**
 * Loading state
 */
export const isAuthLoading = signal<boolean>(true);

/**
 * Error state
 */
export const authError = signal<string | null>(null);

/**
 * Computed: is user authenticated
 */
export const isAuthenticated = computed(() => user.value !== null && session.value !== null);

/**
 * Computed: has household
 */
export const hasHousehold = computed(() => user.value?.householdId !== undefined);

/**
 * Ensure user has a household, create one if needed
 */
async function ensureHouseholdExists(): Promise<void> {
  try {
    // Check if user already has a household
    const response = await api.get('v1/households').json<{ households: any[] }>();

    if (response.households.length === 0) {
      // Create default household
      console.log('[AuthStore] Creating default household');
      const createResponse = await api.post('v1/households', {
        json: { name: 'My Family' }
      }).json<{ household: any }>();

      // Update user object with householdId
      if (user.value) {
        user.value = { ...user.value, householdId: createResponse.household.id };
      }
      console.log('[AuthStore] Household created:', createResponse.household.id);
    } else {
      // Use first household
      if (user.value) {
        user.value = { ...user.value, householdId: response.households[0].id };
      }
      console.log('[AuthStore] Using existing household:', response.households[0].id);
    }
  } catch (error) {
    console.error('[AuthStore] Failed to ensure household exists:', error);
  }
}

/**
 * Load children from backend after authentication
 */
async function loadChildrenFromBackend(): Promise<void> {
  try {
    // Wait for householdId with retries (it might still be loading)
    let retries = 0;
    const maxRetries = 5;

    while (!user.value?.householdId && retries < maxRetries) {
      console.log(`[AuthStore] Waiting for householdId (attempt ${retries + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, 500));
      retries++;
    }

    if (!user.value?.householdId) {
      console.error('[AuthStore] No householdId after retries - cannot load children');
      return;
    }

    const response = await api
      .get(`v1/households/${user.value.householdId}/children`)
      .json<{ children: any[] }>();

    console.log('[AuthStore] Loaded children from backend:', response.children.length);

    // Update childrenStore with server data
    children.value = response.children.map((c: any) => ({
      id: c.id,
      name: c.name,
      avatar: c.avatar,
      moneyTotal: c.money_total || 0,
      pointsTotal: c.points_total || 0,
      screenTotal: c.screen_total || 0
    }));

    // Also save to localStorage for offline access
    localStorage.setItem('children', JSON.stringify(children.value));

    // If user has children from backend, mark onboarding as complete
    if (response.children.length > 0) {
      console.log('[AuthStore] User has children - marking onboarding complete');
      localStorage.setItem('onboarding_complete', 'true');

      // Import and call the onboarding store function to update its state
      // This must be done dynamically to avoid circular dependencies
      const { onboardingComplete } = await import('./onboardingStore');
      onboardingComplete.value = true;
    }
  } catch (error) {
    console.error('[AuthStore] Failed to load children from backend:', error);
    // Re-throw so callers know about the failure
    throw error;
  }
}

/**
 * Initialize auth store from Supabase session
 *
 * This function:
 * 1. Loads the current session from Supabase
 * 2. Sets up auth state change listener
 * 3. Updates user/session signals when auth state changes
 */
export function initializeAuthStore(): void {
  console.log('[AuthStore] Initializing with Supabase Auth');

  // Load initial session - awaited within an IIFE to ensure sequential loading
  (async () => {
    await loadSession();
  })();

  // Listen to auth state changes
  const unsubscribe = onAuthStateChange(async (event, newSession) => {
    console.log('[AuthStore] Auth state changed:', event);

    // Update session signal
    session.value = newSession;

    // Handle different auth events
    switch (event) {
      case 'SIGNED_IN':
        console.log('[AuthStore] 1. User signed in - Starting auth sequence');
        await loadUserData();
        console.log('[AuthStore] 2. User data loaded');
        await ensureHouseholdExists();
        console.log('[AuthStore] 3. Household ensured');
        try {
          await loadChildrenFromBackend();
          console.log('[AuthStore] 4. Children loaded from backend - count:', children.value.length);
        } catch (error) {
          console.error('[AuthStore] 4. Failed to load children from backend:', error);
          // Continue - user can still use the app
        }
        break;

      case 'SIGNED_OUT':
        console.log('[AuthStore] User signed out');
        user.value = null;
        session.value = null;
        authError.value = null;
        break;

      case 'TOKEN_REFRESHED':
        console.log('[AuthStore] Token refreshed');
        // Session is already updated, just log
        break;

      case 'USER_UPDATED':
        console.log('[AuthStore] User updated');
        await loadUserData();
        break;

      default:
        console.log('[AuthStore] Unknown auth event:', event);
    }
  });

  // Store unsubscribe function for cleanup
  (window as any).__authUnsubscribe = unsubscribe;
}

/**
 * Load session from Supabase
 */
async function loadSession(): Promise<void> {
  try {
    console.log('[AuthStore] Loading session from Supabase');

    const currentSession = await getSession();

    if (currentSession) {
      console.log('[AuthStore] Session found - Restoring user data');
      session.value = currentSession;
      await loadUserData();
      console.log('[AuthStore] User data restored');
      await ensureHouseholdExists();
      console.log('[AuthStore] Household ensured');
      try {
        await loadChildrenFromBackend();
        console.log('[AuthStore] Children loaded from backend - count:', children.value.length);
      } catch (error) {
        console.error('[AuthStore] Failed to load children from backend:', error);
        // Continue - user can still use the app
      }
    } else {
      console.log('[AuthStore] No session found');
      user.value = null;
      session.value = null;
    }
  } catch (error) {
    console.error('[AuthStore] Failed to load session:', error);
    authError.value = 'Failed to restore session';
    user.value = null;
    session.value = null;
  } finally {
    isAuthLoading.value = false;
  }
}

/**
 * Load user data from Supabase
 */
async function loadUserData(): Promise<void> {
  try {
    console.log('[AuthStore] Loading user data');

    const currentUser = await getCurrentUser();

    if (currentUser) {
      console.log('[AuthStore] User data loaded:', currentUser.id);
      user.value = currentUser;
      authError.value = null;
    } else {
      console.warn('[AuthStore] No user data found');
      user.value = null;
    }
  } catch (error) {
    console.error('[AuthStore] Failed to load user data:', error);
    authError.value = 'Failed to load user data';
    user.value = null;
  }
}

/**
 * Set current user (for manual updates)
 */
export function setUser(newUser: User | null): void {
  console.log('[AuthStore] Setting user:', newUser?.id);
  user.value = newUser;
}

/**
 * Update user data
 *
 * This updates the local signal. For persistent updates,
 * use the Supabase updateUserProfile() function
 */
export function updateUser(updates: Partial<User>): void {
  if (user.value) {
    console.log('[AuthStore] Updating user data');
    user.value = { ...user.value, ...updates };
  }
}

/**
 * Clear user session
 *
 * Note: This only clears local state. Use logout() from auth.ts
 * for a complete sign out that also clears Supabase session
 */
export function clearUser(): void {
  console.log('[AuthStore] Clearing user session');
  user.value = null;
  session.value = null;
  authError.value = null;
}

/**
 * Set auth error
 */
export function setAuthError(error: string | null): void {
  console.log('[AuthStore] Setting auth error:', error);
  authError.value = error;
}

/**
 * Set loading state
 */
export function setAuthLoading(loading: boolean): void {
  isAuthLoading.value = loading;
}

/**
 * Refresh user data
 *
 * Call this after making changes to user data via API
 */
export async function refreshUserData(): Promise<void> {
  console.log('[AuthStore] Refreshing user data');
  await loadUserData();
}

/**
 * Cleanup function
 *
 * Call this when unmounting the app (usually not needed)
 */
export function cleanupAuthStore(): void {
  console.log('[AuthStore] Cleaning up');

  // Unsubscribe from auth state changes
  const unsubscribe = (window as any).__authUnsubscribe;
  if (unsubscribe) {
    unsubscribe();
    delete (window as any).__authUnsubscribe;
  }

  // Clear state
  user.value = null;
  session.value = null;
  authError.value = null;
  isAuthLoading.value = false;
}
