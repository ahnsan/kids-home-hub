/**
 * Screen view - Screen time management
 */

import { type FunctionComponent } from 'preact';
import { Card } from '../components/common/Card';
import { currentChild } from '../stores';
import { ScreenTimeForm } from '../components/features/screen/ScreenTimeForm';

export const ScreenView: FunctionComponent = () => {
  if (!currentChild.value) {
    return (
      <Card>
        <p class="text-surface-500 text-center py-8">No child selected</p>
      </Card>
    );
  }

  const hours = Math.floor(currentChild.value.screenTotal / 60);
  const mins = currentChild.value.screenTotal % 60;

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
          <p class="text-xs text-surface-500 mt-2">
            Approx. out of 120 min reference
          </p>
        </div>

      </Card>

      <Card>
        <h3 class="font-semibold text-gray-900 mb-4">Manage Screen Time</h3>
        <ScreenTimeForm />
      </Card>
    </div>
  );
};
