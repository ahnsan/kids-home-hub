/**
 * Dashboard view - Home page with family overview and quick actions
 */

import { type FunctionComponent } from 'preact';
import { children, selectedChildId, selectChild, navigateTo } from '../stores';
import { ChildCard } from '../components/dashboard/ChildCard';
import { QuickActions } from '../components/dashboard/QuickActions';
import { ActivityFeed, type Activity } from '../components/dashboard/ActivityFeed';

export const DashboardView: FunctionComponent = () => {
  // Mock recent activities - in a real app, this would come from a store or API
  const recentActivities: Activity[] = [];

  const handleChildSelect = (childId: string) => {
    selectChild(childId);
  };

  return (
    <div class="space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div class="px-1">
        <h1 class="text-2xl font-bold text-gray-900 mb-1">Welcome Back!</h1>
        <p class="text-sm text-surface-500">Here's what's happening with your family today</p>
      </div>

      {/* Children Overview */}
      {children.value.length > 0 && (
        <div class="animate-slide-up" style="animation-delay: 0.1s; animation-fill-mode: both;">
          <h2 class="text-lg font-semibold text-gray-900 mb-3 px-1">Your Children</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {children.value.map(child => (
              <ChildCard
                key={child.id}
                child={child}
                isSelected={child.id === selectedChildId.value}
                onClick={() => handleChildSelect(child.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div class="animate-slide-up" style="animation-delay: 0.2s; animation-fill-mode: both;">
        <QuickActions />
      </div>

      {/* Recent Activity Feed */}
      <div class="animate-slide-up" style="animation-delay: 0.3s; animation-fill-mode: both;">
        <ActivityFeed activities={recentActivities} maxItems={5} />
      </div>

      {/* Empty State - Only show if no children */}
      {children.value.length === 0 && (
        <div class="text-center py-12 animate-fade-in">
          <div class="w-24 h-24 mx-auto mb-4 bg-primary-50 rounded-full flex items-center justify-center">
            <span class="text-5xl">👋</span>
          </div>
          <h2 class="text-xl font-bold text-gray-900 mb-2">Welcome to Kids Home Hub!</h2>
          <p class="text-surface-500 mb-6 max-w-md mx-auto">
            Get started by adding your children in the settings or complete the onboarding process.
          </p>
          <button
            onClick={() => void navigateTo('settings')}
            class="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-full font-medium hover:bg-primary-600 transition-colors active:scale-95"
          >
            <span>Go to Settings</span>
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};
