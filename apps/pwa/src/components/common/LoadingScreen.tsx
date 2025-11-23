/**
 * Loading Screen - Full screen loading indicator
 */

import { type FunctionComponent } from 'preact';

export interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen: FunctionComponent<LoadingScreenProps> = ({
  message = 'Loading...'
}) => {
  return (
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-purple-50">
      <div class="text-center space-y-6">
        {/* App Logo */}
        <div class="w-20 h-20 bg-gradient-to-br from-primary-400 to-primary-600 rounded-3xl shadow-lg flex items-center justify-center mx-auto animate-pulse">
          <svg
            class="w-12 h-12 text-white"
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

        {/* Spinner */}
        <div class="flex items-center justify-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
        </div>

        {/* Loading Text */}
        <div class="space-y-2">
          <p class="text-lg font-medium text-surface-900">
            {message}
          </p>
          <p class="text-sm text-surface-600">
            Just a moment...
          </p>
        </div>
      </div>
    </div>
  );
};
