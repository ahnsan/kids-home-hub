/**
 * Migration Wizard - Multi-step modal for migrating local data to cloud
 */

import { type FunctionComponent } from 'preact';
import { useSignal } from '@preact/signals';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { syncService } from '../../services/sync';
import { user, isAuthenticated } from '../../stores/authStore';
import { children } from '../../stores/childrenStore';

type MigrationStep = 'explain' | 'login' | 'upload' | 'success';

export interface MigrationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export const MigrationWizard: FunctionComponent<MigrationWizardProps> = ({
  isOpen,
  onClose,
  onComplete
}) => {
  const currentStep = useSignal<MigrationStep>('explain');
  const uploadProgress = useSignal<string[]>([]);
  const error = useSignal<string | null>(null);
  const stats = useSignal({ children: 0, chores: 0, transactions: 0 });

  // Calculate stats from local data
  const calculateStats = () => {
    const childrenCount = children.value.length;
    const choresData = localStorage.getItem('customChores');
    const choresCount = choresData ? JSON.parse(choresData).length : 0;

    // Count transactions from localStorage (simplified)
    const transactionsCount = 0; // Would need to count from IndexedDB

    stats.value = {
      children: childrenCount,
      chores: choresCount,
      transactions: transactionsCount
    };
  };

  // Watch for authentication to move to upload step
  const handleAuthSuccess = async () => {
    if (isAuthenticated.value && currentStep.value === 'login') {
      currentStep.value = 'upload';
      await uploadData();
    }
  };

  // Upload local data to cloud
  const uploadData = async () => {
    if (!user.value) {
      error.value = 'User not authenticated';
      return;
    }

    try {
      error.value = null;
      uploadProgress.value = [];

      // Step 1: Upload children
      uploadProgress.value = [...uploadProgress.value, 'Uploading children...'];
      await syncService.syncChildren();
      uploadProgress.value = [...uploadProgress.value, 'Children uploaded'];

      // Step 2: Upload chores
      uploadProgress.value = [...uploadProgress.value, 'Uploading chores...'];
      await syncService.syncChores();
      uploadProgress.value = [...uploadProgress.value, 'Chores uploaded'];

      // Step 3: Full sync to ensure everything is uploaded
      uploadProgress.value = [...uploadProgress.value, 'Syncing all data...'];
      await syncService.fullSync();
      uploadProgress.value = [...uploadProgress.value, 'All data synced'];

      // Complete
      uploadProgress.value = [...uploadProgress.value, 'Migration complete!'];
      currentStep.value = 'success';
    } catch (err) {
      console.error('[Migration] Upload failed:', err);
      error.value = 'Failed to upload data. Please try again.';
    }
  };

  const handleClose = () => {
    // Don't allow closing during upload
    if (currentStep.value === 'upload') {
      return;
    }
    onClose();
  };

  const renderStep = () => {
    switch (currentStep.value) {
      case 'explain':
        return (
          <div class="space-y-6">
            <div class="text-center">
              <div class="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
              </div>
              <h2 class="text-2xl font-bold text-surface-900 mb-2">
                Sync your data across devices
              </h2>
              <p class="text-surface-600">
                Keep your data safe and accessible everywhere
              </p>
            </div>

            {/* Benefits */}
            <div class="space-y-4">
              <div class="flex items-start gap-3">
                <div class="flex-shrink-0 w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div class="flex-1">
                  <h3 class="font-semibold text-surface-900">Access from any device</h3>
                  <p class="text-sm text-surface-600">Use your phone, tablet, or computer</p>
                </div>
              </div>

              <div class="flex items-start gap-3">
                <div class="flex-shrink-0 w-10 h-10 bg-success-100 rounded-full flex items-center justify-center">
                  <svg class="w-5 h-5 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div class="flex-1">
                  <h3 class="font-semibold text-surface-900">Never lose your data</h3>
                  <p class="text-sm text-surface-600">Automatic cloud backup</p>
                </div>
              </div>

              <div class="flex items-start gap-3">
                <div class="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div class="flex-1">
                  <h3 class="font-semibold text-surface-900">Share with your partner</h3>
                  <p class="text-sm text-surface-600">Collaborate on family management</p>
                </div>
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => {
                calculateStats();
                currentStep.value = 'login';
              }}
            >
              Get Started
            </Button>
          </div>
        );

      case 'login':
        return (
          <div class="space-y-4">
            <div class="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-4">
              <p class="text-sm text-primary-900">
                Sign in to sync your existing data to the cloud. We'll upload {stats.value.children} children, {stats.value.chores} chores, and {stats.value.transactions} transactions.
              </p>
            </div>

            {/* Embedded login - we'll show a simplified version */}
            <div class="min-h-[300px] flex items-center justify-center">
              <div class="text-center space-y-4 w-full">
                <div class="text-4xl mb-4">📧</div>
                <h3 class="text-xl font-semibold text-surface-900">
                  Check the main screen for login
                </h3>
                <p class="text-surface-600">
                  After logging in, we'll automatically start uploading your data.
                </p>
                <Button
                  variant="ghost"
                  onClick={() => {
                    currentStep.value = 'explain';
                  }}
                >
                  Back
                </Button>
              </div>
            </div>
          </div>
        );

      case 'upload':
        return (
          <div class="space-y-6">
            <div class="text-center">
              <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4" />
              <h2 class="text-xl font-semibold text-surface-900 mb-2">
                Uploading your data...
              </h2>
              <p class="text-surface-600">
                This will only take a moment
              </p>
            </div>

            {/* Progress list */}
            <div class="space-y-2">
              {uploadProgress.value.map((message, index) => (
                <div
                  key={index}
                  class="flex items-center gap-2 text-sm"
                >
                  {message.includes('uploaded') || message.includes('complete') ? (
                    <svg class="w-5 h-5 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600" />
                  )}
                  <span class={message.includes('uploaded') || message.includes('complete') ? 'text-success-600' : 'text-surface-600'}>
                    {message}
                  </span>
                </div>
              ))}
            </div>

            {error.value && (
              <div class="bg-error-50 border border-error-200 rounded-lg p-4">
                <p class="text-sm text-error-900">{error.value}</p>
                <Button
                  variant="primary"
                  size="sm"
                  class="mt-2"
                  onClick={uploadData}
                >
                  Retry
                </Button>
              </div>
            )}

            <p class="text-xs text-surface-500 text-center">
              Please don't close this window
            </p>
          </div>
        );

      case 'success':
        return (
          <div class="space-y-6 text-center">
            <div class="flex items-center justify-center w-20 h-20 mx-auto bg-success-100 rounded-full">
              <svg class="w-10 h-10 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <div>
              <h2 class="text-2xl font-bold text-surface-900 mb-2">
                Your data is now synced!
              </h2>
              <p class="text-surface-600">
                Everything is backed up and accessible from any device
              </p>
            </div>

            {/* Summary */}
            <div class="bg-primary-50 border border-primary-200 rounded-lg p-4">
              <div class="flex items-center justify-center gap-6 text-sm">
                <div>
                  <div class="text-2xl font-bold text-primary-900">{stats.value.children}</div>
                  <div class="text-primary-700">Children</div>
                </div>
                <div>
                  <div class="text-2xl font-bold text-primary-900">{stats.value.chores}</div>
                  <div class="text-primary-700">Chores</div>
                </div>
                <div>
                  <div class="text-2xl font-bold text-primary-900">{stats.value.transactions}</div>
                  <div class="text-primary-700">Transactions</div>
                </div>
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => {
                onComplete();
                onClose();
              }}
            >
              Start Using App
            </Button>
          </div>
        );
    }
  };

  // Watch for auth changes
  if (isAuthenticated.value && currentStep.value === 'login') {
    handleAuthSuccess();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={currentStep.value === 'upload' ? 'Syncing Data' : 'Sync to Cloud'}
      size="md"
    >
      {renderStep()}
    </Modal>
  );
};
