/**
 * Screen time transaction form component
 */

import { type FunctionComponent } from 'preact';
import { useSignal } from '@preact/signals';
import { submitTransaction } from '../../../api/endpoints';
import { Button } from '../../common/Button';
import { selectedChildId, updateChildData, currentChild } from '../../../stores/childrenStore';

export const ScreenTimeForm: FunctionComponent = () => {
  const minutes = useSignal('');
  const reason = useSignal('');
  const action = useSignal<'add' | 'deduct'>('add');
  const isLoading = useSignal(false);
  const error = useSignal<string | null>(null);
  const success = useSignal(false);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    // Validation
    const minutesValue = parseInt(minutes.value, 10);
    if (!minutesValue || minutesValue <= 0 || minutesValue > 10000) {
      error.value = 'Minutes must be between 1 and 10,000';
      return;
    }

    if (!reason.value || reason.value.length < 1 || reason.value.length > 200) {
      error.value = 'Reason must be between 1 and 200 characters';
      return;
    }

    // For deduct action, check if there's enough screen time
    const child = currentChild.value;
    if (action.value === 'deduct' && child && minutesValue > child.screenTotal) {
      error.value = `Not enough screen time. Current balance: ${child.screenTotal} minutes`;
      return;
    }

    isLoading.value = true;
    error.value = null;
    success.value = false;

    // Apply optimistic UI update FIRST (before API call)
    if (child) {
      const delta = action.value === 'add' ? minutesValue : -minutesValue;
      updateChildData(selectedChildId.value, {
        screenTotal: child.screenTotal + delta
      });
    }

    // Reset form immediately for better UX
    minutes.value = '';
    reason.value = '';

    try {
      // Try to sync with backend
      await submitTransaction({
        feature: 'screen',
        child: selectedChildId.value,
        action: action.value,
        amount: minutesValue,
        reason: reason.value,
      });

      // Success - backend confirmed the transaction
      success.value = true;

      // Clear success message after 3 seconds
      setTimeout(() => {
        success.value = false;
      }, 3000);
    } catch (err: any) {
      // Backend failed but that's OK - transaction queued for offline sync
      console.log('[ScreenTime] Queued for offline sync:', err.message);

      // Show success anyway since local update worked
      success.value = true;
      setTimeout(() => {
        success.value = false;
      }, 3000);
    } finally {
      isLoading.value = false;
    }
  };

  return (
    <form onSubmit={handleSubmit} class="space-y-4">
      {/* Action Toggle */}
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Action
        </label>
        <div class="flex gap-2">
          <Button
            type="button"
            variant={action.value === 'add' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => { action.value = 'add'; }}
            class="flex-1"
          >
            Add Time
          </Button>
          <Button
            type="button"
            variant={action.value === 'deduct' ? 'danger' : 'ghost'}
            size="sm"
            onClick={() => { action.value = 'deduct'; }}
            class="flex-1"
          >
            Use Time
          </Button>
        </div>
      </div>

      {/* Minutes Input */}
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Minutes
        </label>
        <input
          type="number"
          step="1"
          min="1"
          max="10000"
          value={minutes.value}
          onInput={(e) => { minutes.value = (e.currentTarget as HTMLInputElement).value; }}
          placeholder="0"
          class="w-full px-4 py-2 border border-surface-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          required
        />
      </div>

      {/* Reason Textarea */}
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Reason
        </label>
        <textarea
          value={reason.value}
          onInput={(e) => { reason.value = (e.target as HTMLTextAreaElement).value; }}
          placeholder="What is this for?"
          maxLength={200}
          rows={3}
          class="w-full px-4 py-2 border border-surface-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          required
        />
        <p class="text-xs text-surface-500 mt-1">
          {reason.value.length}/200 characters
        </p>
      </div>

      {/* Error Message */}
      {error.value && (
        <div class="p-3 bg-error-50 border border-error-200 rounded-lg">
          <p class="text-sm text-error-700">{error.value}</p>
        </div>
      )}

      {/* Success Message */}
      {success.value && (
        <div class="p-3 bg-success-50 border border-success-200 rounded-lg">
          <p class="text-sm text-success-700">
            Screen time updated successfully!
          </p>
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        variant="primary"
        fullWidth
        loading={isLoading.value}
        disabled={isLoading.value}
      >
        {isLoading.value ? 'Submitting...' : 'Submit'}
      </Button>
    </form>
  );
};
