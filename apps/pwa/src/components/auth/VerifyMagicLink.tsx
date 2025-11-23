/**
 * Magic link verification component
 * Handles the callback when user clicks the magic link
 */

import { type FunctionComponent } from 'preact';
import { useSignal, useSignalEffect } from '@preact/signals';
import { verifyMagicLink } from '../../lib/auth';
import { setUser, setAuthError } from '../../stores/authStore';

export const VerifyMagicLink: FunctionComponent = () => {
  const isVerifying = useSignal(true);
  const error = useSignal<string | null>(null);

  useSignalEffect(() => {
    const verifyToken = async () => {
      try {
        // Parse URL params
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        const email = params.get('email');

        if (!token || !email) {
          error.value = 'Invalid verification link';
          isVerifying.value = false;
          return;
        }

        // Verify the magic link
        const session = await verifyMagicLink(token, email);
        setUser(session.user);

        // Redirect to app
        window.location.href = '/';
      } catch (err) {
        console.error('[Verify] Failed to verify magic link:', err);
        error.value = 'Verification failed. Please try logging in again.';
        setAuthError('Verification failed');
        isVerifying.value = false;
      }
    };

    void verifyToken();
  });

  return (
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-purple-50 p-4">
      <div class="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {isVerifying.value ? (
          <>
            <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4" />
            <h2 class="text-xl font-semibold text-surface-900 mb-2">
              Verifying your login...
            </h2>
            <p class="text-surface-600">
              Please wait while we sign you in
            </p>
          </>
        ) : (
          <>
            <div class="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-error-100 rounded-full">
              <svg class="w-8 h-8 text-error-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 class="text-xl font-semibold text-surface-900 mb-2">
              Verification Failed
            </h2>
            <p class="text-surface-600 mb-6">
              {error.value}
            </p>
            <a
              href="/"
              class="inline-block px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
              Return to Login
            </a>
          </>
        )}
      </div>
    </div>
  );
};
