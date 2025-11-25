/**
 * Points view - Reward points management
 */

import { type FunctionComponent } from 'preact';
import { useState } from 'preact/hooks';
import { Card } from '../components/common/Card';
import { currentChild, selectedChildId, updateChildData } from '../stores';
import { TransactionSheet } from '../components/transactions/TransactionSheet';
import { RedeemPointsForm } from '../components/features/points/RedeemPointsForm';
import { submitTransaction } from '../api/endpoints';
import type { TransactionData } from '../types/transactions';

export const PointsView: FunctionComponent = () => {
  const [isTransactionOpen, setIsTransactionOpen] = useState(false);

  if (!currentChild.value) {
    return (
      <Card>
        <p class="text-surface-500 text-center py-8">No child selected</p>
      </Card>
    );
  }

  const handleTransaction = async (data: TransactionData) => {
    // Apply optimistic UI update
    const child = currentChild.value;
    if (child) {
      const delta = data.action === 'add' ? data.amount : -data.amount;
      updateChildData(selectedChildId.value, {
        pointsTotal: child.pointsTotal + delta
      });
    }

    try {
      // Sync with backend - convert UI action ('remove') to API action ('deduct')
      await submitTransaction({
        childId: selectedChildId.value,
        type: 'points',
        action: data.action === 'remove' ? 'deduct' : data.action,
        amount: data.amount,
        reason: data.reason
      });
    } catch (err) {
      // Backend failed but transaction queued for offline sync
      const message = err instanceof Error ? err.message : 'Unknown error';
      // eslint-disable-next-line no-console
      console.log('[PointsView] Queued for offline sync:', message);
    }

    // Close sheet on success
    setIsTransactionOpen(false);
  };

  return (
    <div class="space-y-4">
      <h2 class="text-lg font-semibold text-gray-900 mb-2">Reward Points</h2>

      <Card>
        <div>
          <h3 class="font-semibold text-gray-900 mb-1">{currentChild.value.name}'s Points</h3>
          <p class="text-sm text-surface-500">Rewards, chores & screen time</p>
        </div>

        <div class="my-4">
          <div class="text-2xl font-bold text-primary-500">
            {currentChild.value.pointsTotal} pts
          </div>
          <div class="text-sm text-surface-500 mt-1">Total reward points</div>
        </div>

        <button
          onClick={() => setIsTransactionOpen(true)}
          class="w-full px-6 py-3 bg-primary-500 text-white rounded-full font-medium hover:bg-primary-600 transition-colors active:scale-95"
        >
          Add/Remove Points
        </button>
      </Card>

      <Card>
        <h3 class="font-semibold text-gray-900 mb-4">Redeem for Screen Time</h3>
        <p class="text-sm text-surface-500 mb-4">
          Exchange points for screen time (1 point = 1 minute)
        </p>
        <RedeemPointsForm />
      </Card>

      <TransactionSheet
        isOpen={isTransactionOpen}
        onClose={() => setIsTransactionOpen(false)}
        onSubmit={handleTransaction}
        feature="points"
        childId={selectedChildId.value || ''}
      />
    </div>
  );
};
