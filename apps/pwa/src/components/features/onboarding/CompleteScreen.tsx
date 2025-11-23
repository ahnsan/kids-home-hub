/**
 * Complete Screen - Final step of onboarding
 */

import { type FunctionComponent } from 'preact';
import { Button } from '../../common/Button';

export interface CompleteScreenProps {
  childrenCount: number;
  choresConfigured: boolean;
  onComplete: () => void;
}

export const CompleteScreen: FunctionComponent<CompleteScreenProps> = ({
  childrenCount,
  choresConfigured,
  onComplete
}) => {
  return (
    <div class="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
      {/* Success Animation */}
      <div class="mb-8 relative">
        <div class="w-32 h-32 bg-gradient-to-br from-success-400 to-success-600 rounded-full shadow-lg flex items-center justify-center animate-bounce">
          <svg
            class="w-16 h-16 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="3"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        {/* Confetti effect */}
        <div class="absolute inset-0 animate-ping opacity-20">
          <div class="w-32 h-32 bg-success-400 rounded-full" />
        </div>
      </div>

      {/* Success Message */}
      <h1 class="text-3xl font-bold text-gray-900 mb-4">
        All Set!
      </h1>

      <p class="text-lg text-gray-600 mb-8 max-w-md">
        You're ready to start managing chores, tracking allowance, and building great habits together!
      </p>

      {/* Summary */}
      <div class="bg-primary-50 border border-primary-200 rounded-xl p-6 mb-8 max-w-md w-full">
        <h3 class="font-semibold text-gray-900 mb-4">Setup Summary</h3>
        <div class="space-y-3 text-left">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span class="text-gray-700">
              {childrenCount} {childrenCount === 1 ? 'child' : 'children'} added
            </span>
          </div>

          <div class="flex items-center gap-3">
            <div class="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span class="text-gray-700">
              {choresConfigured ? 'Chores configured' : 'Chores can be added later'}
            </span>
          </div>

          <div class="flex items-center gap-3">
            <div class="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span class="text-gray-700">
              Ready to track progress
            </span>
          </div>
        </div>
      </div>

      {/* Quick Tips */}
      <div class="max-w-md w-full mb-8">
        <h3 class="font-semibold text-gray-900 mb-4">Quick Tips</h3>
        <div class="text-left space-y-2 text-sm text-gray-600">
          <div class="flex items-start gap-2">
            <span class="text-primary-500 mt-0.5">•</span>
            <span>Use the bottom navigation to switch between Bank, Points, Chores, and Screen Time</span>
          </div>
          <div class="flex items-start gap-2">
            <span class="text-primary-500 mt-0.5">•</span>
            <span>Switch between children using the child selector at the top</span>
          </div>
          <div class="flex items-start gap-2">
            <span class="text-primary-500 mt-0.5">•</span>
            <span>Tap the + button in each view to add transactions, points, or chores</span>
          </div>
          <div class="flex items-start gap-2">
            <span class="text-primary-500 mt-0.5">•</span>
            <span>All data is synced automatically across your devices</span>
          </div>
        </div>
      </div>

      {/* CTA Button */}
      <Button
        variant="primary"
        size="lg"
        onClick={onComplete}
        class="min-w-[200px]"
      >
        Get Started
      </Button>

      <p class="text-xs text-gray-500 mt-6">
        Let's make managing your home fun and easy!
      </p>
    </div>
  );
};
