/**
 * Onboarding store - Manages onboarding flow state
 */

import { signal, computed } from '@preact/signals';

export interface OnboardingChild {
  id: string;
  name: string;
  emoji: string;
}

export type OnboardingStep = 1 | 2 | 3 | 4;

interface OnboardingState {
  isComplete: boolean;
  currentStep: OnboardingStep;
  tempChildren: OnboardingChild[];
  choresConfigured: boolean;
}

const STORAGE_KEY = 'onboarding_complete';
const TEMP_STATE_KEY = 'onboarding_temp_state';

/**
 * Load onboarding completion status
 */
function loadOnboardingStatus(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'true';
  } catch (error) {
    console.error('[Onboarding] Failed to load status:', error);
    return false;
  }
}

/**
 * Load temporary onboarding state
 */
function loadTempState(): Partial<OnboardingState> {
  try {
    const stored = localStorage.getItem(TEMP_STATE_KEY);
    if (stored) {
      return JSON.parse(stored) as Partial<OnboardingState>;
    }
  } catch (error) {
    console.error('[Onboarding] Failed to load temp state:', error);
  }
  return {};
}

/**
 * Save temporary onboarding state
 */
function saveTempState(state: Partial<OnboardingState>): void {
  try {
    localStorage.setItem(TEMP_STATE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('[Onboarding] Failed to save temp state:', error);
  }
}

/**
 * Clear temporary onboarding state
 */
function clearTempState(): void {
  try {
    localStorage.removeItem(TEMP_STATE_KEY);
  } catch (error) {
    console.error('[Onboarding] Failed to clear temp state:', error);
  }
}

// Initialize state
const tempState = loadTempState();
const initialState: OnboardingState = {
  isComplete: loadOnboardingStatus(),
  currentStep: (tempState.currentStep as OnboardingStep) || 1,
  tempChildren: tempState.tempChildren || [],
  choresConfigured: tempState.choresConfigured || false
};

// Signals
export const onboardingComplete = signal<boolean>(initialState.isComplete);
export const currentStep = signal<OnboardingStep>(initialState.currentStep);
export const tempChildren = signal<OnboardingChild[]>(initialState.tempChildren);
export const choresConfigured = signal<boolean>(initialState.choresConfigured);

/**
 * Computed: Is onboarding in progress
 */
export const isOnboardingActive = computed(() => !onboardingComplete.value);

/**
 * Computed: Can proceed to next step
 */
export const canProceed = computed(() => {
  switch (currentStep.value) {
    case 1:
      return true; // Welcome screen, can always proceed
    case 2:
      return tempChildren.value.length > 0; // Need at least 1 child
    case 3:
      return true; // Chores are optional
    case 4:
      return true; // Complete screen
    default:
      return false;
  }
});

/**
 * Go to next step
 */
export function nextStep(): void {
  if (!canProceed.value) return;

  if (currentStep.value < 4) {
    currentStep.value = (currentStep.value + 1) as OnboardingStep;
    saveTempState({
      currentStep: currentStep.value,
      tempChildren: tempChildren.value,
      choresConfigured: choresConfigured.value
    });
  }
}

/**
 * Go to previous step
 */
export function previousStep(): void {
  if (currentStep.value > 1) {
    currentStep.value = (currentStep.value - 1) as OnboardingStep;
    saveTempState({
      currentStep: currentStep.value,
      tempChildren: tempChildren.value,
      choresConfigured: choresConfigured.value
    });
  }
}

/**
 * Go to specific step
 */
export function goToStep(step: OnboardingStep): void {
  currentStep.value = step;
  saveTempState({
    currentStep: currentStep.value,
    tempChildren: tempChildren.value,
    choresConfigured: choresConfigured.value
  });
}

/**
 * Add a child to temporary list
 */
export function addTempChild(name: string, emoji: string): void {
  if (tempChildren.value.length >= 6) {
    console.warn('[Onboarding] Maximum 6 children allowed');
    return;
  }

  const id = `child_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const newChild: OnboardingChild = { id, name, emoji };

  tempChildren.value = [...tempChildren.value, newChild];
  saveTempState({
    currentStep: currentStep.value,
    tempChildren: tempChildren.value,
    choresConfigured: choresConfigured.value
  });
}

/**
 * Remove a child from temporary list
 */
export function removeTempChild(id: string): void {
  tempChildren.value = tempChildren.value.filter(child => child.id !== id);
  saveTempState({
    currentStep: currentStep.value,
    tempChildren: tempChildren.value,
    choresConfigured: choresConfigured.value
  });
}

/**
 * Update a child in temporary list
 */
export function updateTempChild(id: string, updates: Partial<Omit<OnboardingChild, 'id'>>): void {
  tempChildren.value = tempChildren.value.map(child =>
    child.id === id ? { ...child, ...updates } : child
  );
  saveTempState({
    currentStep: currentStep.value,
    tempChildren: tempChildren.value,
    choresConfigured: choresConfigured.value
  });
}

/**
 * Mark chores as configured
 */
export function setChoresConfigured(configured: boolean): void {
  choresConfigured.value = configured;
  saveTempState({
    currentStep: currentStep.value,
    tempChildren: tempChildren.value,
    choresConfigured: choresConfigured.value
  });
}

/**
 * Complete onboarding
 */
export function completeOnboarding(): void {
  try {
    localStorage.setItem(STORAGE_KEY, 'true');
    onboardingComplete.value = true;
    clearTempState();
  } catch (error) {
    console.error('[Onboarding] Failed to save completion status:', error);
  }
}

/**
 * Reset onboarding (for testing/debugging)
 */
export function resetOnboarding(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    onboardingComplete.value = false;
    currentStep.value = 1;
    tempChildren.value = [];
    choresConfigured.value = false;
    clearTempState();
  } catch (error) {
    console.error('[Onboarding] Failed to reset onboarding:', error);
  }
}

/**
 * Initialize onboarding store
 */
export function initializeOnboardingStore(): void {
  const status = loadOnboardingStatus();
  const tempState = loadTempState();

  onboardingComplete.value = status;
  currentStep.value = (tempState.currentStep as OnboardingStep) || 1;
  tempChildren.value = tempState.tempChildren || [];
  choresConfigured.value = tempState.choresConfigured || false;

  console.log('[Onboarding] Initialized - Status:', status);
}

/**
 * Mark onboarding as complete based on external state (e.g., children exist)
 * Used when children are loaded from backend
 */
export function markOnboardingCompleteIfHasData(): void {
  try {
    // Import here to avoid circular dependency
    const childrenData = localStorage.getItem('children');

    if (childrenData) {
      const children = JSON.parse(childrenData);
      if (children && children.length > 0) {
        console.log('[Onboarding] Found existing children, marking onboarding complete');
        localStorage.setItem(STORAGE_KEY, 'true');
        onboardingComplete.value = true;
        clearTempState();
      }
    }
  } catch (error) {
    console.error('[Onboarding] Failed to check for existing data:', error);
  }
}
