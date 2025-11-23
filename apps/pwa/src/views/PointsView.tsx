/**
 * Points view - Reward points management
 */

import { type FunctionComponent } from 'preact';
import { Card } from '../components/common/Card';
import { currentChild } from '../stores';
import { PointsAdjustForm } from '../components/features/points/PointsAdjustForm';
import { RedeemPointsForm } from '../components/features/points/RedeemPointsForm';

export const PointsView: FunctionComponent = () => {
  if (!currentChild.value) {
    return (
      <Card>
        <p class="text-surface-500 text-center py-8">No child selected</p>
      </Card>
    );
  }

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
          <div class="text-sm text-surface-500 mt-1">
            Total reward points
          </div>
        </div>

      </Card>

      <Card>
        <h3 class="font-semibold text-gray-900 mb-4">Adjust Points</h3>
        <PointsAdjustForm />
      </Card>

      <Card>
        <h3 class="font-semibold text-gray-900 mb-4">Redeem for Screen Time</h3>
        <p class="text-sm text-surface-500 mb-4">
          Exchange points for screen time (1 point = 1 minute)
        </p>
        <RedeemPointsForm />
      </Card>
    </div>
  );
};
