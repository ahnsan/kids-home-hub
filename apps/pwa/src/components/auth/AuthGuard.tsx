/**
 * Auth Guard - Handles authentication routing logic
 */

import { type FunctionComponent, type ComponentChildren } from 'preact';
import { useSignal, useSignalEffect } from '@preact/signals';
import { isAuthenticated, isAuthLoading } from '../../stores/authStore';
import { children } from '../../stores/childrenStore';
import { LoginScreen } from './LoginScreen';
import { MigrationWizard } from '../migration/MigrationWizard';
import { LoadingScreen } from '../common/LoadingScreen';

export interface AuthGuardProps {
  children: ComponentChildren;
}

/**
 * Check if user has local data
 */
function hasLocalData(): boolean {
  const childrenData = children.value;
  const choresData = localStorage.getItem('customChores');
  const onboardingComplete = localStorage.getItem('onboarding_completed');

  // Has local data if:
  // 1. Has completed onboarding
  // 2. Has children
  // 3. Has chores
  return !!(
    onboardingComplete === 'true' ||
    childrenData.length > 0 ||
    (choresData && JSON.parse(choresData).length > 0)
  );
}

export const AuthGuard: FunctionComponent<AuthGuardProps> = ({ children }) => {
  const showMigrationWizard = useSignal(false);
  const isGuestMode = useSignal(false);

  // Check for guest mode on mount
  useSignalEffect(() => {
    const guestMode = localStorage.getItem('guest_mode');
    isGuestMode.value = guestMode === 'true';
  });

  // Show loading while checking auth
  if (isAuthLoading.value) {
    return <LoadingScreen />;
  }

  // If in guest mode, show the app
  if (isGuestMode.value) {
    return <>{children}</>;
  }

  // If authenticated, show the app
  if (isAuthenticated.value) {
    return <>{children}</>;
  }

  // Not authenticated - check if has local data
  const hasData = hasLocalData();

  // If has local data but not authenticated, show migration wizard
  if (hasData && showMigrationWizard.value) {
    return (
      <MigrationWizard
        isOpen={true}
        onClose={() => {
          // Don't allow closing without completing migration
          // User can click "Continue as Guest" instead
        }}
        onComplete={() => {
          showMigrationWizard.value = false;
          // Data is now synced, reload to show authenticated app
          window.location.reload();
        }}
      />
    );
  }

  // If has local data but wizard not shown yet, show it
  if (hasData && !showMigrationWizard.value) {
    showMigrationWizard.value = true;
    return <LoadingScreen />;
  }

  // No local data and not authenticated - show login screen
  return <LoginScreen />;
};
