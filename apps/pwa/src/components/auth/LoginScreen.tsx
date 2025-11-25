/**
 * Login screen with Supabase magic link authentication
 *
 * Now uses Supabase Auth for:
 * - Magic link authentication (passwordless)
 * - Automatic session management
 * - Cross-tab synchronization
 * - Optional OAuth providers
 */

import { type FunctionComponent } from 'preact';
import { useSignal } from '@preact/signals';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { sendMagicLink, devLogin, isDevMode, signInWithOAuth } from '../../lib/auth';

export const LoginScreen: FunctionComponent = () => {
  const email = useSignal('');
  const isLoading = useSignal(false);
  const message = useSignal('');
  const error = useSignal('');
  const step = useSignal<'email' | 'sent'>('email');

  const handleSendMagicLink = async () => {
    // Validate email
    if (!email.value || !email.value.includes('@')) {
      error.value = 'Please enter a valid email address';
      return;
    }

    // Additional email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.value)) {
      error.value = 'Please enter a valid email address';
      return;
    }

    isLoading.value = true;
    error.value = '';

    try {
      console.log('[Login] Sending magic link to:', email.value);
      await sendMagicLink(email.value);
      console.log('[Login] Magic link sent successfully');
      message.value = `We've sent a login link to ${email.value}`;
      step.value = 'sent';
    } catch (err) {
      console.error('[Login] Failed to send magic link:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('[Login] Error details:', errorMessage);

      // Provide more specific error messages
      if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        error.value = 'Network error. Please check your connection and try again.';
      } else if (errorMessage.includes('rate limit')) {
        error.value = 'Too many requests. Please wait a moment and try again.';
      } else {
        error.value = 'Failed to send login link. Please try again.';
      }
    } finally {
      isLoading.value = false;
    }
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading.value) {
      void handleSendMagicLink();
    }
  };

  const handleContinueAsGuest = () => {
    // Set a flag to continue without authentication
    localStorage.setItem('guest_mode', 'true');
    window.location.reload();
  };

  const handleDevLogin = async () => {
    // Validate email
    if (!email.value || !email.value.includes('@')) {
      error.value = 'Please enter a valid email address';
      return;
    }

    // Additional email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.value)) {
      error.value = 'Please enter a valid email address';
      return;
    }

    isLoading.value = true;
    error.value = '';

    try {
      console.log('[Login] Dev login for:', email.value);
      await devLogin(email.value);
      console.log('[Login] Dev login successful - magic link sent');
      message.value = `Dev magic link sent to ${email.value}. Check your email.`;
      step.value = 'sent';
    } catch (err) {
      console.error('[Login] Dev login failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('[Login] Error details:', errorMessage);

      if (errorMessage.includes('403')) {
        error.value = 'Dev login is only available in development environment.';
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        error.value = 'Network error. Please check your connection and try again.';
      } else {
        error.value = 'Failed to log in. Please try again.';
      }
    } finally {
      isLoading.value = false;
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    isLoading.value = true;
    error.value = '';

    try {
      console.log('[Login] OAuth login with:', provider);
      await signInWithOAuth(provider);
      // Browser will redirect to OAuth provider
    } catch (err) {
      console.error('[Login] OAuth login failed:', err);
      error.value = `Failed to sign in with ${provider}. Please try again.`;
      isLoading.value = false;
    }
  };

  // Expose handleOAuthLogin for potential future use (OAuth buttons)
  // @ts-expect-error - Reserved for future OAuth implementation
  const _oauthLogin = handleOAuthLogin;

  return (
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-purple-50 p-4">
      <Card class="max-w-md w-full space-y-6 p-8">
        {/* Logo and welcome message */}
        <div class="text-center">
          <div class="w-20 h-20 bg-gradient-to-br from-primary-400 to-primary-600 rounded-3xl shadow-lg flex items-center justify-center mx-auto mb-4">
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
          <h1 class="text-3xl font-bold text-surface-900 mb-2">
            Kids Home Hub
          </h1>
          <p class="text-surface-600 font-medium">
            Sync across all devices
          </p>
        </div>

        {step.value === 'email' ? (
          <>
            {/* Email input */}
            <div class="space-y-4">
              <div>
                <label
                  for="email"
                  class="block text-sm font-medium text-surface-700 mb-2"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email.value}
                  onInput={(e) => {
                    email.value = (e.target as HTMLInputElement).value;
                    error.value = '';
                  }}
                  onKeyPress={handleKeyPress}
                  placeholder="you@example.com"
                  class="w-full px-4 py-3 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  disabled={isLoading.value}
                />
                {error.value && (
                  <p class="mt-2 text-sm text-error-600">
                    {error.value}
                  </p>
                )}
              </div>

              {/* Send magic link button */}
              <Button
                onClick={handleSendMagicLink}
                disabled={isLoading.value}
                loading={isLoading.value}
                variant="primary"
                fullWidth
              >
                Send Magic Link
              </Button>

              {/* Dev mode: Quick login button */}
              {isDevMode() && (
                <Button
                  onClick={handleDevLogin}
                  disabled={isLoading.value}
                  loading={isLoading.value}
                  variant="secondary"
                  fullWidth
                >
                  Dev Login (Skip Email)
                </Button>
              )}
            </div>

            {/* Dev mode indicator */}
            {isDevMode() && (
              <div class="bg-warning-50 border border-warning-200 rounded-lg p-3">
                <div class="flex items-center gap-2">
                  <svg class="w-5 h-5 text-warning-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p class="text-sm font-medium text-warning-800">
                    Development Mode: Email verification bypass enabled
                  </p>
                </div>
              </div>
            )}

            {/* Divider */}
            <div class="relative">
              <div class="absolute inset-0 flex items-center">
                <div class="w-full border-t border-surface-300" />
              </div>
              <div class="relative flex justify-center text-sm">
                <span class="px-2 bg-white text-surface-500">or</span>
              </div>
            </div>

            {/* Continue as guest */}
            <Button
              onClick={handleContinueAsGuest}
              variant="ghost"
              fullWidth
            >
              Continue as Guest
            </Button>

            <p class="text-xs text-surface-500 text-center">
              Guest mode stores data locally on this device only.
            </p>
          </>
        ) : (
          <>
            {/* Success message */}
            <div class="space-y-4">
              <div class="flex items-center justify-center w-16 h-16 mx-auto bg-success-100 rounded-full">
                <svg class="w-8 h-8 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
                </svg>
              </div>

              <div class="text-center">
                <h2 class="text-xl font-semibold text-surface-900 mb-2">
                  Check your email
                </h2>
                <p class="text-surface-600">
                  {message.value}
                </p>
              </div>

              <div class="bg-primary-50 border border-primary-200 rounded-lg p-4">
                <h3 class="text-sm font-medium text-primary-900 mb-2">
                  Next steps:
                </h3>
                <ol class="text-sm text-primary-800 space-y-1 list-decimal list-inside">
                  <li>Open the email we sent you</li>
                  <li>Click the login link</li>
                  <li>You'll be automatically signed in</li>
                </ol>
              </div>

              <Button
                onClick={() => {
                  step.value = 'email';
                  email.value = '';
                  message.value = '';
                }}
                variant="ghost"
                fullWidth
              >
                Back to Login
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};
