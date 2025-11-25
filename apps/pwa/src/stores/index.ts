/**
 * Store exports
 */

export * from './childrenStore';
export * from './navigationStore';
export * from './offlineStore';
export * from './customChoresStore';
export * from './onboardingStore';
export * from './authStore';

// Export specific onboarding functions that may be used across stores
export { markOnboardingCompleteIfHasData } from './onboardingStore';

import { initializeChildStore } from './childrenStore';
import { initializeNavigationStore } from './navigationStore';
import { initializeOfflineStore } from './offlineStore';
import { initializeCustomChoresStore } from './customChoresStore';
import { initializeOnboardingStore } from './onboardingStore';
import { initializeAuthStore } from './authStore';

/**
 * Initialize all stores
 */
export function initializeStores(): void {
  initializeAuthStore(); // Initialize auth first
  initializeChildStore();
  initializeNavigationStore();
  initializeOfflineStore();
  initializeCustomChoresStore();
  initializeOnboardingStore();
}
