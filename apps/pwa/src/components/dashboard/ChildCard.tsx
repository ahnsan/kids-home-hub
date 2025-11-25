/**
 * ChildCard component - Individual child summary card
 */

import { type FunctionComponent } from 'preact';
import type { Child } from '@kids-home-hub/shared';
import { Card } from '../common/Card';
import { AvatarUpload } from '../common/AvatarUpload';
import { clsx } from 'clsx';
import { updateChildData } from '../../stores';

export interface ChildCardProps {
  child: Child;
  onClick?: () => void;
  isSelected?: boolean;
}

export const ChildCard: FunctionComponent<ChildCardProps> = ({
  child,
  onClick,
  isSelected = false
}) => {
  return (
    <Card
      interactive={!!onClick}
      class={clsx(
        'transition-all duration-200',
        isSelected && 'ring-2 ring-primary-500 ring-offset-2',
        onClick && 'hover:shadow-card-hover active:scale-98'
      )}
    >
      <div onClick={onClick} class={clsx(onClick && 'cursor-pointer')}>
        {/* Header with Avatar and Name */}
        <div class="flex items-center gap-3 mb-4">
          <div class="relative">
            <AvatarUpload
              src={child.avatar}
              alt={child.name}
              size="lg"
              editable={true}
              onImageChange={(imageData) => {
                updateChildData(child.id, { avatar: imageData });
              }}
              class="ring-2 ring-white shadow-sm"
            />
            {isSelected && (
              <div class="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center ring-2 ring-white">
                <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
            )}
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="font-semibold text-gray-900 truncate">{child.name}</h3>
            <p class="text-xs text-surface-500">Quick overview</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div class="grid grid-cols-3 gap-3">
          {/* Money */}
          <div class="text-center p-2 bg-primary-50 rounded-lg">
            <div class="text-lg mb-1">💰</div>
            <div class="text-xs font-semibold text-primary-700">£{child.moneyTotal.toFixed(2)}</div>
            <div class="text-xs text-surface-500 mt-0.5">Bank</div>
          </div>

          {/* Points */}
          <div class="text-center p-2 bg-amber-50 rounded-lg">
            <div class="text-lg mb-1">⭐</div>
            <div class="text-xs font-semibold text-amber-700">{child.pointsTotal}</div>
            <div class="text-xs text-surface-500 mt-0.5">Points</div>
          </div>

          {/* Screen Time */}
          <div class="text-center p-2 bg-purple-50 rounded-lg">
            <div class="text-lg mb-1">📱</div>
            <div class="text-xs font-semibold text-purple-700">{child.screenTotal}m</div>
            <div class="text-xs text-surface-500 mt-0.5">Screen</div>
          </div>
        </div>
      </div>
    </Card>
  );
};
