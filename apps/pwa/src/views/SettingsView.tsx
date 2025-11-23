/**
 * Settings View - Account and sync settings
 */

import { type FunctionComponent } from 'preact';
import { useSignal } from '@preact/signals';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { user, clearUser } from '../stores/authStore';
import { logout, deleteAccount } from '../lib/auth';
import { syncService } from '../services/sync';

export const SettingsView: FunctionComponent = () => {
  const showLogoutConfirm = useSignal(false);
  const showDeleteConfirm = useSignal(false);
  const showDeleteDoubleConfirm = useSignal(false);
  const isSyncing = useSignal(false);
  const lastSyncTime = useSignal<string>('');
  const syncStatus = useSignal<'idle' | 'syncing' | 'success' | 'error'>('idle');

  // Get last sync time
  const updateLastSyncTime = () => {
    const lastSync = localStorage.getItem('lastFullSync');
    if (lastSync) {
      const date = new Date(parseInt(lastSync));
      lastSyncTime.value = date.toLocaleString();
    } else {
      lastSyncTime.value = 'Never';
    }
  };

  updateLastSyncTime();

  const handleSyncNow = async () => {
    isSyncing.value = true;
    syncStatus.value = 'syncing';

    try {
      await syncService.fullSync();
      syncStatus.value = 'success';
      updateLastSyncTime();

      // Reset success message after 3 seconds
      setTimeout(() => {
        syncStatus.value = 'idle';
      }, 3000);
    } catch (error) {
      console.error('[Settings] Sync failed:', error);
      syncStatus.value = 'error';

      // Reset error message after 5 seconds
      setTimeout(() => {
        syncStatus.value = 'idle';
      }, 5000);
    } finally {
      isSyncing.value = false;
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      clearUser();
      // Reload to show login screen
      window.location.reload();
    } catch (error) {
      console.error('[Settings] Logout failed:', error);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount();
      clearUser();
      // Clear all local data
      localStorage.clear();
      // Reload to show login screen
      window.location.reload();
    } catch (error) {
      console.error('[Settings] Delete account failed:', error);
    }
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'Unknown';
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div class="space-y-4 p-4">
      <h1 class="text-2xl font-bold text-surface-900 mb-6">Settings</h1>

      {/* User Info Section */}
      <Card class="space-y-4">
        <h2 class="text-lg font-semibold text-surface-900 border-b border-surface-200 pb-2">
          Account Information
        </h2>

        <div class="space-y-3">
          <div>
            <label class="text-sm font-medium text-surface-600">Email</label>
            <p class="text-base text-surface-900">{user.value?.email || 'Not signed in'}</p>
          </div>

          <div>
            <label class="text-sm font-medium text-surface-600">Member since</label>
            <p class="text-base text-surface-900">
              {user.value?.createdAt ? formatDate(user.value.createdAt) : 'Unknown'}
            </p>
          </div>

          {user.value?.householdId && (
            <div>
              <label class="text-sm font-medium text-surface-600">Household ID</label>
              <p class="text-base text-surface-900 font-mono text-xs">
                {user.value.householdId}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Sync Section */}
      <Card class="space-y-4">
        <h2 class="text-lg font-semibold text-surface-900 border-b border-surface-200 pb-2">
          Sync & Backup
        </h2>

        <div class="space-y-3">
          <div>
            <label class="text-sm font-medium text-surface-600">Last synced</label>
            <p class="text-base text-surface-900">{lastSyncTime.value}</p>
          </div>

          <div>
            <label class="text-sm font-medium text-surface-600">Sync status</label>
            <div class="flex items-center gap-2 mt-1">
              {syncStatus.value === 'syncing' && (
                <>
                  <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600" />
                  <span class="text-sm text-primary-600">Syncing...</span>
                </>
              )}
              {syncStatus.value === 'success' && (
                <>
                  <svg class="w-4 h-4 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span class="text-sm text-success-600">Synced successfully</span>
                </>
              )}
              {syncStatus.value === 'error' && (
                <>
                  <svg class="w-4 h-4 text-error-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span class="text-sm text-error-600">Sync failed</span>
                </>
              )}
              {syncStatus.value === 'idle' && navigator.onLine && (
                <>
                  <svg class="w-4 h-4 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                  </svg>
                  <span class="text-sm text-surface-600">Ready</span>
                </>
              )}
              {!navigator.onLine && (
                <>
                  <svg class="w-4 h-4 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.415m-1.414-1.415L3 3" />
                  </svg>
                  <span class="text-sm text-surface-600">Offline</span>
                </>
              )}
            </div>
          </div>

          <Button
            variant="primary"
            fullWidth
            onClick={handleSyncNow}
            disabled={isSyncing.value || !navigator.onLine}
            loading={isSyncing.value}
          >
            {isSyncing.value ? 'Syncing...' : 'Sync Now'}
          </Button>
        </div>

        <div class="bg-primary-50 border border-primary-200 rounded-lg p-3">
          <p class="text-xs text-primary-900">
            Your data is automatically synced in the background. Use "Sync Now" to force an immediate sync.
          </p>
        </div>
      </Card>

      {/* Account Actions */}
      <Card class="space-y-4">
        <h2 class="text-lg font-semibold text-surface-900 border-b border-surface-200 pb-2">
          Account Actions
        </h2>

        <div class="space-y-3">
          <Button
            variant="ghost"
            fullWidth
            onClick={() => showLogoutConfirm.value = true}
          >
            Sign Out
          </Button>

          <Button
            variant="danger"
            fullWidth
            onClick={() => showDeleteConfirm.value = true}
          >
            Delete Account
          </Button>
        </div>
      </Card>

      {/* App Info */}
      <Card class="space-y-2">
        <h2 class="text-lg font-semibold text-surface-900 border-b border-surface-200 pb-2">
          About
        </h2>
        <div class="text-sm text-surface-600 space-y-1">
          <p>Kids Home Hub v1.0.0</p>
          <p>Built with Preact + Tailwind CSS</p>
          <p class="text-xs text-surface-500 mt-2">
            Made with care for families
          </p>
        </div>
      </Card>

      {/* Logout Confirmation Modal */}
      <Modal
        isOpen={showLogoutConfirm.value}
        onClose={() => showLogoutConfirm.value = false}
        title="Sign Out"
        size="sm"
      >
        <div class="space-y-4">
          <p class="text-surface-700">
            Are you sure you want to sign out? Your data will remain synced in the cloud.
          </p>
          <div class="flex gap-3">
            <Button
              variant="ghost"
              fullWidth
              onClick={() => showLogoutConfirm.value = false}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              fullWidth
              onClick={() => {
                showLogoutConfirm.value = false;
                handleLogout();
              }}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Account First Confirmation */}
      <Modal
        isOpen={showDeleteConfirm.value}
        onClose={() => showDeleteConfirm.value = false}
        title="Delete Account"
        size="sm"
      >
        <div class="space-y-4">
          <div class="bg-error-50 border border-error-200 rounded-lg p-3">
            <p class="text-sm text-error-900 font-semibold">
              Warning: This action cannot be undone!
            </p>
          </div>
          <p class="text-surface-700">
            Deleting your account will permanently remove:
          </p>
          <ul class="list-disc list-inside text-sm text-surface-700 space-y-1">
            <li>Your account and profile</li>
            <li>All children and their data</li>
            <li>All chores and tasks</li>
            <li>All transactions and history</li>
            <li>All synced data in the cloud</li>
          </ul>
          <p class="text-surface-700">
            Are you absolutely sure?
          </p>
          <div class="flex gap-3">
            <Button
              variant="ghost"
              fullWidth
              onClick={() => showDeleteConfirm.value = false}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              fullWidth
              onClick={() => {
                showDeleteConfirm.value = false;
                showDeleteDoubleConfirm.value = true;
              }}
            >
              Yes, Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Account Double Confirmation */}
      <Modal
        isOpen={showDeleteDoubleConfirm.value}
        onClose={() => showDeleteDoubleConfirm.value = false}
        title="Final Confirmation"
        size="sm"
      >
        <div class="space-y-4">
          <div class="bg-error-50 border border-error-200 rounded-lg p-4">
            <p class="text-error-900 font-semibold text-center">
              This is your last chance!
            </p>
          </div>
          <p class="text-surface-700 text-center">
            Once deleted, your data cannot be recovered.
          </p>
          <div class="flex gap-3">
            <Button
              variant="ghost"
              fullWidth
              onClick={() => {
                showDeleteDoubleConfirm.value = false;
                showDeleteConfirm.value = false;
              }}
            >
              Keep My Account
            </Button>
            <Button
              variant="danger"
              fullWidth
              onClick={() => {
                showDeleteDoubleConfirm.value = false;
                handleDeleteAccount();
              }}
            >
              Delete Forever
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
