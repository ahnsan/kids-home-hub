/**
 * Chores Setup Screen - Step 3 of onboarding
 */

import { type FunctionComponent } from 'preact';
import { Button } from '../../common/Button';
import { Card } from '../../common/Card';

export interface ChoresSetupScreenProps {
  onUseDefaults: () => void;
  onCustomize: () => void;
  onSkip: () => void;
  onBack: () => void;
}

const DEFAULT_CHORES = [
  { label: 'Tidy bedroom', points: 10, icon: '🛏️' },
  { label: 'Finish homework', points: 8, icon: '📚' },
  { label: 'Set / clear the table', points: 5, icon: '🍽️' },
  { label: 'Feed pet / help pet', points: 6, icon: '🐕' },
  { label: 'Help with laundry', points: 7, icon: '👕' }
];

export const ChoresSetupScreen: FunctionComponent<ChoresSetupScreenProps> = ({
  onUseDefaults,
  onCustomize,
  onSkip,
  onBack
}) => {
  return (
    <div class="max-w-2xl mx-auto px-6 py-8">
      {/* Header */}
      <div class="text-center mb-8">
        <h2 class="text-2xl font-bold text-gray-900 mb-2">
          Set Up Chores
        </h2>
        <p class="text-gray-600">
          Choose how you want to configure chores for your children
        </p>
      </div>

      {/* Default Chores Preview */}
      <Card class="mb-6">
        <h3 class="font-semibold text-gray-900 mb-4">Default Chores</h3>
        <div class="space-y-2">
          {DEFAULT_CHORES.map((chore) => (
            <div
              key={chore.label}
              class="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"
            >
              <div class="flex items-center gap-3">
                <span class="text-2xl">{chore.icon}</span>
                <span class="text-gray-900">{chore.label}</span>
              </div>
              <span class="text-sm font-medium text-primary-600">
                {chore.points} pts
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Options */}
      <div class="space-y-3 mb-8">
        {/* Use Defaults */}
        <button type="button" onClick={onUseDefaults} class="w-full text-left">
          <Card interactive class="cursor-pointer hover:shadow-lg transition-all">
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div class="flex-1">
                <h4 class="font-semibold text-gray-900 mb-1">Use Defaults</h4>
                <p class="text-sm text-gray-600">
                  Start with 5 common chores. You can customize them later.
                </p>
              </div>
              <svg class="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Card>
        </button>

        {/* Customize Now */}
        <button type="button" onClick={onCustomize} class="w-full text-left">
          <Card interactive class="cursor-pointer hover:shadow-lg transition-all">
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div class="flex-1">
                <h4 class="font-semibold text-gray-900 mb-1">Customize Now</h4>
                <p class="text-sm text-gray-600">
                  Create your own chores from scratch or edit the defaults.
                </p>
              </div>
              <svg class="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Card>
        </button>

        {/* Skip for Now */}
        <button type="button" onClick={onSkip} class="w-full text-left">
          <Card interactive class="cursor-pointer hover:shadow-lg transition-all">
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div class="flex-1">
                <h4 class="font-semibold text-gray-900 mb-1">Skip for Now</h4>
                <p class="text-sm text-gray-600">
                  Set up chores later. You can always add them from the Chores tab.
                </p>
              </div>
              <svg class="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Card>
        </button>
      </div>

      {/* Info */}
      <div class="bg-primary-50 border border-primary-200 rounded-xl p-4 mb-8">
        <div class="flex gap-3">
          <svg class="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p class="text-sm text-primary-800">
            Tip: You can always add, edit, or remove chores later from the Chores view.
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div class="flex gap-3">
        <Button
          variant="ghost"
          onClick={onBack}
          class="flex-1"
        >
          Back
        </Button>
      </div>
    </div>
  );
};
