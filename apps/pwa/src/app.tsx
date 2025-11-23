/**
 * Root application component
 */

import { type FunctionComponent } from 'preact';
import { Header } from './components/layout/Header';
import { BottomNav } from './components/layout/BottomNav';
import { ViewContainer } from './components/layout/ViewContainer';
import { ChildSwitch } from './components/features/child/ChildSwitch';
import { OnboardingFlow } from './components/features/onboarding/OnboardingFlow';
import { BankView } from './views/BankView';
import { PointsView } from './views/PointsView';
import { ChoresView } from './views/ChoresView';
import { ScreenView } from './views/ScreenView';
import { activeView, isOnboardingActive } from './stores';

export const App: FunctionComponent = () => {
  const view = activeView.value;
  const showOnboarding = isOnboardingActive.value;

  // Show onboarding if not completed
  if (showOnboarding) {
    return <OnboardingFlow onComplete={() => {
      // Onboarding complete - the component will re-render automatically
      // due to the signal update
    }} />;
  }

  // Show main app
  return (
    <div class="flex flex-col h-full bg-surface-50">
      <Header />

      <div class="flex justify-center mb-2 safe-top">
        <ChildSwitch />
      </div>

      <main class="flex-1 overflow-y-auto pb-18 safe-bottom">
        <ViewContainer>
          {view === 'bank' && <BankView />}
          {view === 'points' && <PointsView />}
          {view === 'chores' && <ChoresView />}
          {view === 'screen' && <ScreenView />}
        </ViewContainer>
      </main>

      <BottomNav />
    </div>
  );
};
