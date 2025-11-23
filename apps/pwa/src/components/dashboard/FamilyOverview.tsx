/**
 * FamilyOverview component - Total family stats
 */

import { type FunctionComponent } from 'preact';
import { useComputed } from '@preact/signals';
import { children } from '../../stores';
import { Card } from '../common/Card';

export const FamilyOverview: FunctionComponent = () => {
  const totalMoney = useComputed(() =>
    children.value.reduce((sum, child) => sum + child.moneyTotal, 0)
  );

  const totalPoints = useComputed(() =>
    children.value.reduce((sum, child) => sum + child.pointsTotal, 0)
  );

  const totalScreenTime = useComputed(() =>
    children.value.reduce((sum, child) => sum + child.screenTotal, 0)
  );

  const childCount = useComputed(() => children.value.length);

  return (
    <Card class="bg-gradient-to-br from-primary-500 to-primary-700 text-white">
      <div class="mb-4">
        <div class="flex items-center gap-2 mb-1">
          <span class="text-2xl">👨‍👩‍👧‍👦</span>
          <h3 class="text-lg font-bold">Family Overview</h3>
        </div>
        <p class="text-primary-100 text-sm">
          {childCount.value} {childCount.value === 1 ? 'child' : 'children'} in your family
        </p>
      </div>

      <div class="grid grid-cols-3 gap-4">
        {/* Total Money */}
        <div class="text-center">
          <div class="w-12 h-12 mx-auto mb-2 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <span class="text-2xl">💰</span>
          </div>
          <div class="text-2xl font-bold mb-1">£{totalMoney.value.toFixed(2)}</div>
          <div class="text-xs text-primary-100">Total Savings</div>
        </div>

        {/* Total Points */}
        <div class="text-center">
          <div class="w-12 h-12 mx-auto mb-2 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <span class="text-2xl">⭐</span>
          </div>
          <div class="text-2xl font-bold mb-1">{totalPoints.value}</div>
          <div class="text-xs text-primary-100">Total Points</div>
        </div>

        {/* Total Screen Time */}
        <div class="text-center">
          <div class="w-12 h-12 mx-auto mb-2 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <span class="text-2xl">📱</span>
          </div>
          <div class="text-2xl font-bold mb-1">{totalScreenTime.value}m</div>
          <div class="text-xs text-primary-100">Screen Time</div>
        </div>
      </div>
    </Card>
  );
};
