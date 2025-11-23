/**
 * QuickActions component - Quick action buttons
 */

import { type FunctionComponent } from 'preact';
import { Card } from '../common/Card';
import { navigateTo, type ViewId } from '../../stores';

export interface QuickAction {
  id: ViewId;
  label: string;
  icon: string;
  description: string;
  color: string;
  bgColor: string;
}

const quickActions: QuickAction[] = [
  {
    id: 'bank',
    label: 'Add Money',
    icon: '💰',
    description: 'Manage savings',
    color: 'text-primary-700',
    bgColor: 'bg-primary-50 hover:bg-primary-100'
  },
  {
    id: 'points',
    label: 'Points',
    icon: '⭐',
    description: 'Redeem rewards',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50 hover:bg-amber-100'
  },
  {
    id: 'chores',
    label: 'Chores',
    icon: '🧹',
    description: 'Submit chores',
    color: 'text-green-700',
    bgColor: 'bg-green-50 hover:bg-green-100'
  },
  {
    id: 'screen',
    label: 'Screen Time',
    icon: '📱',
    description: 'Track usage',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50 hover:bg-purple-100'
  }
];

export const QuickActions: FunctionComponent = () => {
  const handleActionClick = (actionId: ViewId) => {
    navigateTo(actionId);
  };

  return (
    <Card>
      <div class="mb-4">
        <h3 class="font-semibold text-gray-900">Quick Actions</h3>
        <p class="text-xs text-surface-500 mt-0.5">Jump to what you need</p>
      </div>

      <div class="grid grid-cols-2 gap-3">
        {quickActions.map(action => (
          <button
            key={action.id}
            onClick={() => handleActionClick(action.id)}
            class={`
              p-4 rounded-xl text-left transition-all duration-200
              ${action.bgColor}
              active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
            `}
          >
            <div class="text-3xl mb-2">{action.icon}</div>
            <div class={`text-sm font-semibold ${action.color} mb-0.5`}>{action.label}</div>
            <div class="text-xs text-surface-500">{action.description}</div>
          </button>
        ))}
      </div>
    </Card>
  );
};
