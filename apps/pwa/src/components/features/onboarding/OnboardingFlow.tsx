/**
 * Onboarding Flow - Main container for onboarding screens
 */

import { type FunctionComponent } from 'preact';
import { useSignal } from '@preact/signals';
import {
  currentStep,
  tempChildren,
  choresConfigured,
  nextStep,
  previousStep,
  addTempChild,
  removeTempChild,
  updateTempChild,
  setChoresConfigured,
  completeOnboarding
} from '../../../stores/onboardingStore';
import { setChildren } from '../../../stores/childrenStore';
import { WelcomeScreen } from './WelcomeScreen';
import { ChildrenSetupScreen } from './ChildrenSetupScreen';
import { ChoresSetupScreen } from './ChoresSetupScreen';
import { CompleteScreen } from './CompleteScreen';
import { ProgressIndicator } from './ProgressIndicator';
import { ChoreManagementModal } from '../chores/ChoreManagementModal';

export interface OnboardingFlowProps {
  onComplete: () => void;
}

export const OnboardingFlow: FunctionComponent<OnboardingFlowProps> = ({ onComplete }) => {
  const showChoreModal = useSignal(false);

  const handleUseDefaults = () => {
    // Default chores are already loaded in customChoresStore
    setChoresConfigured(true);
    nextStep();
  };

  const handleCustomizeChores = () => {
    showChoreModal.value = true;
  };

  const handleChoreModalClose = () => {
    showChoreModal.value = false;
    setChoresConfigured(true);
    nextStep();
  };

  const handleSkipChores = () => {
    setChoresConfigured(false);
    nextStep();
  };

  const handleCompleteOnboarding = async () => {
    // Create actual children from temp children
    const childrenToCreate = tempChildren.value.map(child => ({
      name: child.name,
      avatar: child.emoji // Using emoji as avatar
    }));

    // Wait for children to sync to backend
    await setChildren(childrenToCreate);

    // Mark onboarding as complete
    completeOnboarding();
    onComplete();
  };

  return (
    <div class="fixed inset-0 z-50 bg-white overflow-y-auto">
      {/* Progress Indicator (hidden on welcome and complete screens) */}
      {currentStep.value !== 1 && currentStep.value !== 4 && (
        <div class="sticky top-0 bg-white border-b border-gray-200 z-10">
          <ProgressIndicator currentStep={currentStep.value} totalSteps={4} />
        </div>
      )}

      {/* Screen Content */}
      <div class="min-h-full">
        {currentStep.value === 1 && (
          <WelcomeScreen onNext={nextStep} />
        )}

        {currentStep.value === 2 && (
          <ChildrenSetupScreen
            children={tempChildren.value}
            onAddChild={addTempChild}
            onRemoveChild={removeTempChild}
            onUpdateChild={updateTempChild}
            onNext={nextStep}
            onBack={previousStep}
          />
        )}

        {currentStep.value === 3 && (
          <ChoresSetupScreen
            onUseDefaults={handleUseDefaults}
            onCustomize={handleCustomizeChores}
            onSkip={handleSkipChores}
            onBack={previousStep}
          />
        )}

        {currentStep.value === 4 && (
          <CompleteScreen
            childrenCount={tempChildren.value.length}
            choresConfigured={choresConfigured.value}
            onComplete={handleCompleteOnboarding}
          />
        )}
      </div>

      {/* Chore Management Modal */}
      <ChoreManagementModal
        isOpen={showChoreModal.value}
        onClose={handleChoreModalClose}
      />
    </div>
  );
};
