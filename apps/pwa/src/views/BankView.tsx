/**
 * Bank view - Money management
 */

import { type FunctionComponent } from 'preact';
import { useState } from 'preact/hooks';
import { Card } from '../components/common/Card';
import { AvatarUpload } from '../components/common/AvatarUpload';
import { currentChild, selectedChildId, updateChildData } from '../stores';
import { TransactionSheet } from '../components/transactions/TransactionSheet';
import { submitTransaction } from '../api/endpoints';
import type { TransactionData } from '../types/transactions';

export const BankView: FunctionComponent = () => {
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
        moneyTotal: child.moneyTotal + delta
      });
    }

    try {
      // Sync with backend - convert UI action ('remove') to API action ('deduct')
      await submitTransaction({
        feature: 'money',
        child: selectedChildId.value,
        action: data.action === 'remove' ? 'deduct' : data.action,
        amount: data.amount,
        currency: data.currency,
        reason: data.reason
      });
    } catch (err) {
      // Backend failed but transaction queued for offline sync
      const message = err instanceof Error ? err.message : 'Unknown error';
      // eslint-disable-next-line no-console
      console.log('[BankView] Queued for offline sync:', message);
    }

    // Close sheet on success
    setIsTransactionOpen(false);
  };

  return (
    <div class="space-y-4">
      <h2 class="text-lg font-semibold text-gray-900 mb-2">Bank Account</h2>

      <Card>
        <div class="flex items-center gap-3 mb-4">
          <AvatarUpload
            src={currentChild.value.avatar}
            alt={currentChild.value.name}
            size="md"
            editable={true}
            onImageChange={(imageData) => {
              updateChildData(selectedChildId.value, { avatar: imageData });
            }}
          />
          <div>
            <h3 class="font-semibold text-gray-900">{currentChild.value.name}'s Bank</h3>
            <p class="text-sm text-surface-500">Pocket money & gifts</p>
          </div>
        </div>

        <div class="mb-4">
          <div class="text-2xl font-bold text-primary-500">
            £{currentChild.value.moneyTotal.toFixed(2)}
          </div>
          <div class="text-sm text-surface-500 mt-1">
            ≈ A${(currentChild.value.moneyTotal / 0.56).toFixed(2)}
          </div>
        </div>

        <button
          onClick={() => setIsTransactionOpen(true)}
          class="w-full px-6 py-3 bg-primary-500 text-white rounded-full font-medium hover:bg-primary-600 transition-colors active:scale-95"
        >
          Add/Remove Money
        </button>
      </Card>

      <TransactionSheet
        isOpen={isTransactionOpen}
        onClose={() => setIsTransactionOpen(false)}
        onSubmit={handleTransaction}
        feature="money"
        childId={selectedChildId.value || ''}
      />
    </div>
  );
};
