/**
 * Auth callback component for Supabase magic link verification
 *
 * Supabase automatically handles magic link verification when the user
 * clicks the link. This component:
 * 1. Shows a loading state while Supabase processes the auth callback
 * 2. Detects session establishment
 * 3. Redirects to the app or shows errors
 *
 * Note: With Supabase, the magic link includes auth tokens in the URL.
 * The Supabase client automatically detects and processes them.
 */

import { type FunctionComponent } from 'preact';
import { useSignal, useSignalEffect } from '@preact/signals';
import { getSession } from '../../lib/auth';

export const VerifyMagicLink: FunctionComponent = () => {
  const isVerifying = useSignal(true);
  const error = useSignal<string | null>(null);

  useSignalEffect(() => {
    const verifyAuth = async () => {
      try {
        console.log('[Verify] Checking for Supabase auth session');

        // Wait a moment for Supabase to process the auth callback
        // Supabase client automatically detects auth tokens in URL
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Check if we have a session
        const session = await getSession();

        if (!session) {
          console.error('[Verify] No session found after auth callback');
          error.value = 'Authentication failed. Please try logging in again.';
          isVerifying.value = false;
          return;
        }

        console.log('[Verify] Session established successfully');

        // Get user from session
        if (session.user) {
          // The authStore will automatically update via the auth state listener
          // But we can also manually trigger it here for immediate feedback
          console.log('[Verify] User authenticated:', session.user.id);
        }

        // Redirect to app
        console.log('[Verify] Redirecting to app');
        window.location.href = '/';
      } catch (err) {
        console.error('[Verify] Failed to verify authentication:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('[Verify] Error details:', errorMessage);

        // Provide user-friendly error messages
        if (errorMessage.includes('expired')) {
          error.value = 'This link has expired. Please request a new login link.';
        } else if (errorMessage.includes('invalid')) {
          error.value = 'Invalid authentication link. Please request a new login link.';
        } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
          error.value = 'Network error. Please check your connection and try again.';
        } else {
          error.value = 'Authentication failed. Please try logging in again.';
        }

        isVerifying.value = false;
      }
    };

    void verifyAuth();
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
