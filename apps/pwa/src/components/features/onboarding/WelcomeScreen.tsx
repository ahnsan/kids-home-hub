/**
 * Welcome Screen - First step of onboarding
 */

import { type FunctionComponent } from 'preact';
import { Button } from '../../common/Button';

export interface WelcomeScreenProps {
  onNext: () => void;
}

export const WelcomeScreen: FunctionComponent<WelcomeScreenProps> = ({ onNext }) => {
  return (
    <div class="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
      {/* App Icon/Logo */}
      <div class="mb-8">
        <div class="w-24 h-24 bg-gradient-to-br from-primary-400 to-primary-600 rounded-3xl shadow-lg flex items-center justify-center transform hover:scale-105 transition-transform">
          <svg
            class="w-14 h-14 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
        </div>
      </div>

      {/* Welcome Title */}
      <h1 class="text-3xl font-bold text-gray-900 mb-4">
        Welcome to Kids Home Hub!
      </h1>

      {/* Description */}
      <p class="text-lg text-gray-600 mb-8 max-w-md">
        The fun way to manage chores, track allowance, earn points, and build great habits together.
      </p>

      {/* Key Features */}
      <div class="space-y-4 mb-12 max-w-md">
        <div class="flex items-start gap-3 text-left">
          <div class="flex-shrink-0 w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
            <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 class="font-semibold text-gray-900">Track Chores</h3>
            <p class="text-sm text-gray-600">Assign tasks and watch progress in real-time</p>
          </div>
        </div>

        <div class="flex items-start gap-3 text-left">
          <div class="flex-shrink-0 w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
            <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 class="font-semibold text-gray-900">Manage Allowance</h3>
            <p class="text-sm text-gray-600">Track savings and teach money skills</p>
          </div>
        </div>

        <div class="flex items-start gap-3 text-left">
          <div class="flex-shrink-0 w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
            <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
          <div>
            <h3 class="font-semibold text-gray-900">Earn Points</h3>
            <p class="text-sm text-gray-600">Reward good behavior and milestones</p>
          </div>
        </div>
      </div>

      {/* CTA Button */}
      <Button
        variant="primary"
        size="lg"
        onClick={onNext}
        class="min-w-[200px]"
      >
        Get Started
      </Button>

      <p class="text-xs text-gray-500 mt-6">Takes less than 2 minutes to set up</p>
    </div>
  );
};
