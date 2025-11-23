/**
 * Store exports
 */

export * from './childrenStore';
export * from './navigationStore';
export * from './offlineStore';
export * from './customChoresStore';
export * from './onboardingStore';

import { initializeChildStore } from './childrenStore';
import { initializeNavigationStore } from './navigationStore';
import { initializeOfflineStore } from './offlineStore';
import { initializeCustomChoresStore } from './customChoresStore';
import { initializeOnboardingStore } from './onboardingStore';

/**
 * Initialize all stores
 */
export function initializeStores(): void {
  initializeChildStore();
  initializeNavigationStore();
  initializeOfflineStore();
  initializeCustomChoresStore();
  initializeOnboardingStore();
}
