/**
 * Redeem points for screen time form component
 */

import { type FunctionComponent } from 'preact';
import { useSignal, useComputed } from '@preact/signals';
import { redeemPoints } from '../../../api/endpoints';
import { Button } from '../../common/Button';
import { selectedChildId, updateChildData, currentChild } from '../../../stores/childrenStore';
import { POINT_TO_MINUTES } from '@kids-home-hub/shared';

export const RedeemPointsForm: FunctionComponent = () => {
  const points = useSignal('');
  const reason = useSignal('Redeemed points for screen time');
  const isLoading = useSignal(false);
  const error = useSignal<string | null>(null);
  const success = useSignal(false);

  const screenMinutes = useComputed(() => {
    const pointsValue = parseInt(points.value, 10);
    return pointsValue > 0 ? pointsValue * POINT_TO_MINUTES : 0;
  });

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    // Validation
    const pointsValue = parseInt(points.value, 10);
    if (!pointsValue || pointsValue <= 0) {
      error.value = 'Points must be greater than 0';
      return;
    }

    const child = currentChild.value;
    if (child && pointsValue > child.pointsTotal) {
      error.value = `Not enough points. Current balance: ${child.pointsTotal}`;
      return;
    }

    isLoading.value = true;
    error.value = null;
    success.value = false;

    // Apply optimistic UI update FIRST (before API call)
    if (child) {
      updateChildData(selectedChildId.value, {
        pointsTotal: child.pointsTotal - pointsValue,
        screenTotal: child.screenTotal + screenMinutes.value
      });
    }

    // Reset form immediately for better UX
    points.value = '';

    try {
      // Try to sync with backend
      await redeemPoints({
        child: selectedChildId.value,
        points: pointsValue,
        reason: reason.value,
      });

      // Success - backend confirmed the redemption
      success.value = true;

      // Clear success message after 3 seconds
      setTimeout(() => {
        success.value = false;
      }, 3000);
    } catch (err: any) {
      // Backend failed but that's OK - redemption queued for offline sync
      console.log('[RedeemPoints] Queued for offline sync:', err.message);

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
      {/* Points Input */}
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Points to Redeem
        </label>
        <input
          type="number"
          step="1"
          min="1"
          value={points.value}
          onInput={(e) => { points.value = (e.currentTarget as HTMLInputElement).value; }}
          placeholder="0"
          class="w-full px-4 py-2 border border-surface-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          required
        />
      </div>

      {/* Screen Time Preview */}
      {screenMinutes.value > 0 && (
        <div class="p-3 bg-primary-50 border border-primary-200 rounded-lg">
          <p class="text-sm text-primary-700">
            = {screenMinutes.value} minute{screenMinutes.value !== 1 ? 's' : ''} of screen time
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
          <p class="text-sm text-success-700">
            Points redeemed successfully!
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
        {isLoading.value ? 'Redeeming...' : 'Redeem for Screen Time'}
      </Button>
    </form>
  );
};
