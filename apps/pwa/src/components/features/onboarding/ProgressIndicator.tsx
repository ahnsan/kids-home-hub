/**
 * Progress Indicator - Shows current onboarding step
 */

import { type FunctionComponent } from 'preact';
import { clsx } from 'clsx';
import type { OnboardingStep } from '../../../stores/onboardingStore';

export interface ProgressIndicatorProps {
  currentStep: OnboardingStep;
  totalSteps: number;
}

export const ProgressIndicator: FunctionComponent<ProgressIndicatorProps> = ({
  currentStep,
  totalSteps
}) => {
  return (
    <div class="flex items-center justify-center gap-2 py-4">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
        <div
          key={step}
          class={clsx(
            'h-2 rounded-full transition-all duration-300',
            step === currentStep ? 'w-8 bg-primary-500' : 'w-2 bg-gray-300',
            step < currentStep && 'bg-primary-300'
          )}
          aria-label={`Step ${step} of ${totalSteps}`}
          aria-current={step === currentStep ? 'step' : undefined}
        />
      ))}
    </div>
  );
};
