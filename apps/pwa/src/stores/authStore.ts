/**
 * Authentication state management with Preact Signals
 */

import { signal, computed } from '@preact/signals';
import type { User } from '@kids-home-hub/shared';
import { getCurrentUser, getAuthToken, clearAuthSession } from '../lib/auth';

/**
 * User signal
 */
export const user = signal<User | null>(null);

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
export const isAuthenticated = computed(() => user.value !== null);

/**
 * Computed: has household
 */
export const hasHousehold = computed(() => user.value?.householdId !== undefined);

/**
 * Initialize auth state from localStorage
 */
export function initializeAuthStore(): void {
  try {
    const token = getAuthToken();
    const storedUser = getCurrentUser();

    if (token && storedUser) {
      user.value = storedUser;
    }
  } catch (error) {
    console.error('[AuthStore] Failed to initialize:', error);
    authError.value = 'Failed to restore session';
  } finally {
    isAuthLoading.value = false;
  }
}

/**
 * Set current user
 */
export function setUser(newUser: User | null): void {
  user.value = newUser;
}

/**
 * Update user data
 */
export function updateUser(updates: Partial<User>): void {
  if (user.value) {
    user.value = { ...user.value, ...updates };
    // Persist to localStorage
    localStorage.setItem('auth_user', JSON.stringify(user.value));
  }
}

/**
 * Clear user session
 */
export function clearUser(): void {
  user.value = null;
  authError.value = null;
  clearAuthSession();
}

/**
 * Set auth error
 */
export function setAuthError(error: string | null): void {
  authError.value = error;
}

/**
 * Set loading state
 */
export function setAuthLoading(loading: boolean): void {
  isAuthLoading.value = loading;
}
