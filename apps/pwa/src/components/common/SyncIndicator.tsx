/**
 * Sync Status Indicator
 * Shows current sync status in a non-intrusive way
 */

import { type FunctionComponent } from 'preact';
import { useSignal, useSignalEffect } from '@preact/signals';
import { syncService } from '../../services/sync';
import { isAuthenticated } from '../../stores/authStore';

type SyncStatus = 'syncing' | 'synced' | 'error' | 'offline';

export const SyncIndicator: FunctionComponent = () => {
  const status = useSignal<SyncStatus>('offline');
  const isVisible = useSignal(false);
  const lastSyncTime = useSignal<string>('');
  const showDetails = useSignal(false);

  // Check sync status periodically
  useSignalEffect(() => {
    // eslint-disable-next-line no-console
    console.log('[SyncIndicator] Checking status - isAuthenticated:', isAuthenticated.value);

    if (!isAuthenticated.value) {
      // eslint-disable-next-line no-console
      console.log('[SyncIndicator] Not authenticated - hiding indicator');
      status.value = 'offline';
      isVisible.value = false;
      return;
    }

    const checkStatus = () => {
      const syncStatus = syncService.getSyncStatus();
      // eslint-disable-next-line no-console
      console.log('[SyncIndicator] Sync status from service:', syncStatus);

      if (syncStatus === 'syncing') {
        status.value = 'syncing';
        isVisible.value = true;
      } else if (syncStatus === 'synced') {
        status.value = 'synced';
        isVisible.value = true;
        // Auto-hide after 3 seconds
        setTimeout(() => {
          if (status.value === 'synced') {
            isVisible.value = false;
          }
        }, 3000);
      } else if (syncStatus === 'pending') {
        // Pending sync - hide indicator instead of showing misleading "Offline"
        // The sync will happen automatically via periodic sync
        isVisible.value = false;
      } else if (!navigator.onLine) {
        status.value = 'offline';
        isVisible.value = true;
      }

      // Update last sync time
      const lastSync = localStorage.getItem('lastFullSync');
      if (lastSync) {
        const date = new Date(parseInt(lastSync));
        lastSyncTime.value = date.toLocaleTimeString();
      }
    };

    checkStatus();
    const interval = setInterval(() => checkStatus(), 5000);

    return () => clearInterval(interval);
  });

  // Don't render if not visible
  if (!isVisible.value) {
    return null;
  }

  const getStatusIcon = () => {
    switch (status.value) {
      case 'syncing':
        return (
          <svg
            class="w-4 h-4 animate-spin"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        );
      case 'synced':
        return (
          <svg
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 13l4 4L19 7"
            />
          </svg>
        );
      case 'error':
        return (
          <svg
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        );
      case 'offline':
        return (
          <svg
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 3l18 18"
            />
          </svg>
        );
    }
  };

  const getStatusText = () => {
    switch (status.value) {
      case 'syncing':
        return 'Syncing...';
      case 'synced':
        return 'Synced';
      case 'error':
        return 'Sync failed';
      case 'offline':
        return 'Offline';
    }
  };

  const getStatusColor = () => {
    switch (status.value) {
      case 'syncing':
        return 'bg-primary-500 text-white';
      case 'synced':
        return 'bg-success-500 text-white';
      case 'error':
        return 'bg-error-500 text-white';
      case 'offline':
        return 'bg-surface-400 text-white';
    }
  };

  return (
    <div class="fixed bottom-20 right-4 z-40">
      <button
        onClick={() => showDetails.value = !showDetails.value}
        class={`
          flex items-center gap-2 px-3 py-2 rounded-full shadow-lg
          transition-all duration-200 hover:scale-105
          ${getStatusColor()}
        `}
        aria-label={`Sync status: ${getStatusText()}`}
      >
        {getStatusIcon()}
        <span class="text-sm font-medium">{getStatusText()}</span>
      </button>

      {/* Details popup */}
      {showDetails.value && lastSyncTime.value && (
        <div class="absolute bottom-full right-0 mb-2 bg-white rounded-lg shadow-xl p-3 min-w-[200px]">
          <div class="text-xs text-surface-600">
            Last synced at
          </div>
          <div class="text-sm font-medium text-surface-900">
            {lastSyncTime.value}
          </div>
          <button
            onClick={() => {
              status.value = 'syncing';
              syncService.fullSync()
                .then(() => {
                  status.value = 'synced';
                })
                .catch((error) => {
                  console.error('[SyncIndicator] Manual sync failed:', error);
                  status.value = 'error';
                });
            }}
            class="mt-2 w-full px-3 py-1.5 bg-primary-500 text-white text-xs font-medium rounded-lg hover:bg-primary-600 transition-colors"
          >
            Sync Now
          </button>
        </div>
      )}
    </div>
  );
};
