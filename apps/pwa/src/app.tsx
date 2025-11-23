/**
 * Root application component
 */

import { type FunctionComponent } from 'preact';
import { useSignal, useSignalEffect } from '@preact/signals';
import { Header } from './components/layout/Header';
import { BottomNav } from './components/layout/BottomNav';
import { ViewContainer } from './components/layout/ViewContainer';
import { ChildSwitch } from './components/features/child/ChildSwitch';
import { OnboardingFlow } from './components/features/onboarding/OnboardingFlow';
import { AuthGuard } from './components/auth/AuthGuard';
import { VerifyMagicLink } from './components/auth/VerifyMagicLink';
import { SyncIndicator } from './components/common/SyncIndicator';
import { DashboardView } from './views/DashboardView';
import { BankView } from './views/BankView';
import { PointsView } from './views/PointsView';
import { ChoresView } from './views/ChoresView';
import { ScreenView } from './views/ScreenView';
import { SettingsView } from './views/SettingsView';
import { activeView, isOnboardingActive } from './stores';
import { isAuthenticated } from './stores/authStore';

export const App: FunctionComponent = () => {
  const view = activeView.value;
  const showOnboarding = isOnboardingActive.value;
  const isVerifyingMagicLink = useSignal(false);

  // Check if we're on the magic link verification route
  useSignalEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const email = params.get('email');

    if (token && email) {
      isVerifyingMagicLink.value = true;
    }
  });

  // If verifying magic link, show verification component
  if (isVerifyingMagicLink.value) {
    return <VerifyMagicLink />;
  }

  // Wrap everything in AuthGuard
  return (
    <AuthGuard>
      {/* Show onboarding if not completed */}
      {showOnboarding ? (
        <OnboardingFlow
          onComplete={() => {
            // Onboarding complete - the component will re-render automatically
            // due to the signal update
          }}
        />
      ) : (
        // Show main app
        <div class="flex flex-col h-full bg-surface-50">
          <Header />

          {/* Only show child switch on specific views (not home or settings) */}
          {view !== 'settings' && view !== 'home' && (
            <div class="flex justify-center mb-2 safe-top">
              <ChildSwitch />
            </div>
          )}

          <main class="flex-1 overflow-y-auto pb-18 safe-bottom">
            <ViewContainer>
              {view === 'home' && <DashboardView />}
              {view === 'bank' && <BankView />}
              {view === 'points' && <PointsView />}
              {view === 'chores' && <ChoresView />}
              {view === 'screen' && <ScreenView />}
              {view === 'settings' && <SettingsView />}
            </ViewContainer>
          </main>

          <BottomNav />

          {/* Sync indicator - only show when authenticated */}
          {isAuthenticated.value && <SyncIndicator />}
        </div>
      )}
    </AuthGuard>
  );
};
