/**
 * Bank view - Money management
 */

import { type FunctionComponent } from 'preact';
import { Card } from '../components/common/Card';
import { currentChild } from '../stores';
import { MoneyTransactionForm } from '../components/features/money/MoneyTransactionForm';

export const BankView: FunctionComponent = () => {
  if (!currentChild.value) {
    return (
      <Card>
        <p class="text-surface-500 text-center py-8">No child selected</p>
      </Card>
    );
  }

  return (
    <div class="space-y-4">
      <h2 class="text-lg font-semibold text-gray-900 mb-2">Bank Account</h2>

      <Card>
        <div class="flex items-center gap-3 mb-4">
          <img
            src={currentChild.value.avatar}
            alt={currentChild.value.name}
            class="w-12 h-12 rounded-full"
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

      </Card>

      <Card>
        <h3 class="font-semibold text-gray-900 mb-4">Add or Deduct Money</h3>
        <MoneyTransactionForm />
      </Card>
    </div>
  );
};
