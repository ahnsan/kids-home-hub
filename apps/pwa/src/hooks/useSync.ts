/**
 * Sync hook for components
 */

import { useEffect } from 'preact/hooks';
import { useSignal } from '@preact/signals';
import { syncService } from '../services/sync';
import { isAuthenticated } from '../stores/authStore';

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline';

/**
 * Hook to manage data synchronization
 */
export function useSync() {
  const syncStatus = useSignal<SyncStatus>('idle');
  const lastSyncTime = useSignal<Date | null>(null);
  const pendingActionsCount = useSignal<number>(0);

  useEffect(() => {
    if (!isAuthenticated.value) {
      syncStatus.value = 'offline';
      return;
    }

    // Initial sync
    sync();

    // Start periodic sync (every 5 minutes)
    syncService.startPeriodicSync();

    // Update pending actions count
    updatePendingCount();

    // Cleanup
    return () => {
      syncService.stopPeriodicSync();
    };
  }, []);

  /**
   * Perform sync
   */
  const sync = async () => {
    if (!isAuthenticated.value) {
      syncStatus.value = 'offline';
      return;
    }

    if (!navigator.onLine) {
      syncStatus.value = 'offline';
      return;
    }

    syncStatus.value = 'syncing';

    try {
      await syncService.fullSync();
      syncStatus.value = 'synced';
      lastSyncTime.value = new Date();

      // Update pending count
      await updatePendingCount();

      // Auto-hide after 3 seconds
      setTimeout(() => {
        if (syncStatus.value === 'synced') {
          syncStatus.value = 'idle';
        }
      }, 3000);
    } catch (error) {
      console.error('[useSync] Sync failed:', error);
      syncStatus.value = 'error';

      // Reset to idle after 5 seconds
      setTimeout(() => {
        if (syncStatus.value === 'error') {
          syncStatus.value = 'idle';
        }
      }, 5000);
    }
  };

  /**
   * Update pending actions count
   */
  const updatePendingCount = async () => {
    try {
      const count = await syncService.getPendingActionsCount();
      pendingActionsCount.value = count;
    } catch (error) {
      console.error('[useSync] Failed to get pending count:', error);
    }
  };

  /**
   * Force sync
   */
  const forceSync = () => {
    sync();
  };

  return {
    syncStatus,
    lastSyncTime,
    pendingActionsCount,
    sync: forceSync
  };
}
