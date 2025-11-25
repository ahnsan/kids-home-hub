/**
 * Offline sync state management
 */

import { signal, computed } from '@preact/signals';
import type { SyncStats } from '@kids-home-hub/shared';

/**
 * Online status
 */
export const isOnline = signal<boolean>(navigator.onLine);

/**
 * Sync stats
 */
export const syncStats = signal<SyncStats>({
  pending: 0,
  processing: 0,
  failed: 0,
  total: 0
});

/**
 * Sync in progress flag
 */
export const isSyncing = signal<boolean>(false);

/**
 * Has pending changes
 */
export const hasPendingChanges = computed(() => syncStats.value.pending > 0);

/**
 * Has sync errors
 */
export const hasSyncErrors = computed(() => syncStats.value.failed > 0);

/**
 * Update online status
 */
export function setOnlineStatus(online: boolean): void {
  isOnline.value = online;
}

/**
 * Update sync stats
 */
export function updateSyncStats(stats: SyncStats): void {
  syncStats.value = stats;
}

/**
 * Set syncing flag
 */
export function setSyncing(syncing: boolean): void {
  isSyncing.value = syncing;
}

/**
 * Initialize online/offline listeners
 */
export function initializeOfflineStore(): void {
  console.log('[OfflineStore] Initializing - current navigator.onLine:', navigator.onLine);

  // Set initial state
  isOnline.value = navigator.onLine;

  // Listen to browser online/offline events
  window.addEventListener('online', () => {
    console.log('[OfflineStore] Browser went online');
    setOnlineStatus(true);
  });

  window.addEventListener('offline', () => {
    console.log('[OfflineStore] Browser went offline');
    setOnlineStatus(false);
  });

  console.log('[OfflineStore] Initialized successfully');
}
