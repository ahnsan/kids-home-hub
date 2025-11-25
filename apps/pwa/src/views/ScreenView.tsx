/**
 * Screen view - Screen time management
 */

import { type FunctionComponent } from 'preact';
import { useState } from 'preact/hooks';
import { Card } from '../components/common/Card';
import { currentChild, selectedChildId, updateChildData } from '../stores';
import { TransactionSheet } from '../components/transactions/TransactionSheet';
import { submitTransaction } from '../api/endpoints';
import type { TransactionData } from '../types/transactions';

export const ScreenView: FunctionComponent = () => {
  const [isTransactionOpen, setIsTransactionOpen] = useState(false);

  if (!currentChild.value) {
    return (
      <Card>
        <p class="text-surface-500 text-center py-8">No child selected</p>
      </Card>
    );
  }

  const hours = Math.floor(currentChild.value.screenTotal / 60);
  const mins = currentChild.value.screenTotal % 60;

  const handleTransaction = async (data: TransactionData) => {
    // Apply optimistic UI update
    const child = currentChild.value;
    if (child) {
      const delta = data.action === 'add' ? data.amount : -data.amount;
      updateChildData(selectedChildId.value, {
        screenTotal: child.screenTotal + delta
      });
    }

    try {
      // Sync with backend - convert UI action ('remove') to API action ('deduct')
      await submitTransaction({
        feature: 'screen',
        child: selectedChildId.value,
        action: data.action === 'remove' ? 'deduct' : data.action,
        amount: data.amount,
        reason: data.reason
      });
    } catch (err) {
      // Backend failed but transaction queued for offline sync
      const message = err instanceof Error ? err.message : 'Unknown error';
      // eslint-disable-next-line no-console
      console.log('[ScreenView] Queued for offline sync:', message);
    }

    // Close sheet on success
    setIsTransactionOpen(false);
  };

  return (
    <div class="space-y-4">
      <h2 class="text-lg font-semibold text-gray-900 mb-2">Screen Time Bank</h2>

      <Card>
        <div>
          <h3 class="font-semibold text-gray-900 mb-1">{currentChild.value.name}'s Screen Time</h3>
          <p class="text-sm text-surface-500">Screen time bank</p>
        </div>

        <div class="my-4">
          <div class="text-2xl font-bold text-primary-500">
            {currentChild.value.screenTotal} min
          </div>
          <div class="text-sm text-surface-500 mt-1">
            {hours} h {mins} min in bank
          </div>
        </div>

        <div class="mt-4">
          <div class="h-2 bg-surface-100 rounded-full overflow-hidden">
            <div
              class="h-full bg-primary-500 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, (currentChild.value.screenTotal / 120) * 100)}%` }}
            />
          </div>
          <p class="text-xs text-surface-500 mt-2">Approx. out of 120 min reference</p>
        </div>

        <button
          onClick={() => setIsTransactionOpen(true)}
          class="w-full mt-4 px-6 py-3 bg-primary-500 text-white rounded-full font-medium hover:bg-primary-600 transition-colors active:scale-95"
        >
          Add/Remove Time
        </button>
      </Card>

      <TransactionSheet
        isOpen={isTransactionOpen}
        onClose={() => setIsTransactionOpen(false)}
        onSubmit={handleTransaction}
        feature="screen"
        childId={selectedChildId.value || ''}
      />
    </div>
  );
};
