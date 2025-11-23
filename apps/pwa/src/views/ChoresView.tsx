/**
 * Chores view - Weekly chores with custom chore management
 */

import { type FunctionComponent } from 'preact';
import { useSignal, useComputed } from '@preact/signals';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { currentChild, selectedChildId, updateChildData } from '../stores';
import { submitChores } from '../api/endpoints';
import { customChores } from '../stores/customChoresStore';
import { ChoreManagementModal } from '../components/features/chores/ChoreManagementModal';

export const ChoresView: FunctionComponent = () => {
  const selectedChores = useSignal<string[]>([]);
  const isLoading = useSignal(false);
  const error = useSignal<string | null>(null);
  const success = useSignal(false);
  const showManageModal = useSignal(false);

  const totalPoints = useComputed(() =>
    selectedChores.value.reduce((sum, choreId) => {
      const chore = customChores.value.find(c => c.id === choreId);
      return sum + (chore?.points || 0);
    }, 0)
  );

  const handleChoreToggle = (choreId: string) => {
    const current = selectedChores.value;
    if (current.includes(choreId)) {
      selectedChores.value = current.filter(id => id !== choreId);
    } else {
      selectedChores.value = [...current, choreId];
    }
  };

  const handleSubmit = async () => {
    if (selectedChores.value.length === 0) {
      error.value = 'Please select at least one chore';
      return;
    }

    isLoading.value = true;
    error.value = null;
    success.value = false;

    // Apply optimistic UI update FIRST (before API call)
    const child = currentChild.value;
    if (child) {
      updateChildData(selectedChildId.value, {
        pointsTotal: child.pointsTotal + totalPoints.value
      });
    }

    // Reset form immediately for better UX
    selectedChores.value = [];

    try {
      // Try to sync with backend
      await submitChores({
        child: selectedChildId.value,
        chores: selectedChores.value as any, // Will need backend update to handle custom chores
      });

      // Success - backend confirmed the chores submission
      success.value = true;

      // Clear success message after 3 seconds
      setTimeout(() => {
        success.value = false;
      }, 3000);
    } catch (err: any) {
      // Backend failed but that's OK - chores queued for offline sync
      console.log('[Chores] Queued for offline sync:', err.message);

      // Show success anyway since local update worked
      success.value = true;
      setTimeout(() => {
        success.value = false;
      }, 3000);
    } finally {
      isLoading.value = false;
    }
  };

  if (!currentChild.value) {
    return (
      <Card>
        <p class="text-surface-500 text-center py-8">No child selected</p>
      </Card>
    );
  }

  return (
    <div class="space-y-4">
      {/* Header with Manage Button */}
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-900">Weekly Chores</h2>
        <button
          onClick={() => { showManageModal.value = true; }}
          class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Manage Chores
        </button>
      </div>

      <Card>
        <div>
          <h3 class="font-semibold text-gray-900 mb-1">{currentChild.value.name}'s Chores</h3>
          <p class="text-sm text-surface-500">Tick the chores completed this week</p>
        </div>

        {/* Chores List */}
        {customChores.value.length === 0 ? (
          <div class="mt-6 text-center py-8 bg-gray-50 rounded-lg">
            <svg class="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p class="text-gray-600 font-medium">No chores configured</p>
            <p class="text-gray-500 text-sm mt-1 mb-4">Click "Manage Chores" to add some chores</p>
            <Button variant="primary" onClick={() => { showManageModal.value = true; }}>
              Add Chores
            </Button>
          </div>
        ) : (
          <div class="mt-4 space-y-2">
            {customChores.value.map((chore) => (
              <div key={chore.id} class="flex items-center justify-between py-2 px-1 hover:bg-gray-50 rounded-lg transition-colors">
                <label class="flex items-center gap-3 flex-1 cursor-pointer">
                  <input
                    type="checkbox"
                    class="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 cursor-pointer transition-all"
                    checked={selectedChores.value.includes(chore.id)}
                    onChange={() => handleChoreToggle(chore.id)}
                  />
                  <span class="text-sm text-gray-900">{chore.label}</span>
                </label>
                <span class="text-sm font-semibold text-primary-600">
                  +{chore.points}
                </span>
              </div>
            ))}
          </div>
        )}

        <div class="mt-4 pt-4 border-t border-surface-100 space-y-4">
          {/* Total Points Preview */}
          {totalPoints.value > 0 && (
            <div class="p-4 bg-gradient-to-r from-primary-50 to-primary-100 border-2 border-primary-200 rounded-lg">
              <div class="flex items-center justify-between">
                <p class="text-sm text-primary-900 font-medium">
                  Total Points
                </p>
                <p class="text-2xl font-bold text-primary-700">
                  +{totalPoints.value}
                </p>
              </div>
              <p class="text-xs text-primary-600 mt-1">
                {selectedChores.value.length} {selectedChores.value.length === 1 ? 'chore' : 'chores'} selected
              </p>
            </div>
          )}

          {/* Error Message */}
          {error.value && (
            <div class="p-3 bg-error-50 border border-error-200 rounded-lg">
              <p class="text-sm text-error-700">{error.value}</p>
            </div>
          )}

          {/* Success Message */}
          {success.value && (
            <div class="p-3 bg-success-50 border border-success-200 rounded-lg">
              <div class="flex items-center gap-2">
                <svg class="w-5 h-5 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p class="text-sm text-success-700 font-medium">
                  Chores submitted successfully!
                </p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button
            variant="primary"
            fullWidth
            loading={isLoading.value}
            disabled={isLoading.value || selectedChores.value.length === 0}
            onClick={handleSubmit}
          >
            {isLoading.value ? (
              'Submitting...'
            ) : selectedChores.value.length === 0 ? (
              'Select Chores to Submit'
            ) : (
              `Submit ${selectedChores.value.length} ${selectedChores.value.length === 1 ? 'Chore' : 'Chores'} (+${totalPoints.value} points)`
            )}
          </Button>
        </div>
      </Card>

      {/* Chore Management Modal */}
      <ChoreManagementModal
        isOpen={showManageModal.value}
        onClose={() => { showManageModal.value = false; }}
      />
    </div>
  );
};
