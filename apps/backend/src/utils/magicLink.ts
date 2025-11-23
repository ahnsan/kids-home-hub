/**
 * Magic link utilities
 */

import { nanoid } from 'nanoid';
import { Resend } from 'resend';
import { getMagicLinkEmailTemplate, getMagicLinkEmailPlainText } from '../templates/magicLinkEmail';

/**
 * Generate a secure magic link token
 */
export function generateMagicLinkToken(): string {
  // Generate a 32-character URL-safe token
  return nanoid(32);
}

/**
 * Calculate expiration timestamp (default 15 minutes)
 */
export function getMagicLinkExpiration(minutes = 15): Date {
  const now = new Date();
  now.setMinutes(now.getMinutes() + minutes);
  return now;
}

/**
 * Build magic link URL
 */
export function buildMagicLinkUrl(redirectUrl: string, token: string, email: string): string {
  const url = new URL('/auth/verify', redirectUrl);
  url.searchParams.set('token', token);
  url.searchParams.set('email', email);
  return url.toString();
}

/**
 * Send magic link email via Resend
 *
 * DEV MODE: When Resend testing restrictions prevent sending emails (403 validation_error),
 * the function falls back to logging the magic link URL instead of throwing an error.
 * This allows testing with any email address during development.
 */
export async function sendMagicLinkEmail(
  email: string,
  magicLinkUrl: string,
  resendApiKey: string
): Promise<void> {
  try {
    console.log('[MagicLink] Sending email to:', email);
    console.log('[MagicLink] Magic link URL:', magicLinkUrl);

    // Initialize Resend client
    const resend = new Resend(resendApiKey);

    // Get email templates
    const htmlContent = getMagicLinkEmailTemplate(magicLinkUrl);
    const textContent = getMagicLinkEmailPlainText(magicLinkUrl);

    // Send email with Resend
    const { data, error } = await resend.emails.send({
      from: 'Kids Home Hub <onboarding@resend.dev>',
      to: [email],
      subject: 'Sign in to Kids Home Hub',
      html: htmlContent,
      text: textContent,
    });

    if (error) {
      console.error('[MagicLink] Resend error:', error);

      // Check if it's a testing restriction (403 validation_error)
      if (error.statusCode === 403 && error.name === 'validation_error') {
        console.log('[MagicLink] DEV MODE: Resend testing restriction - magic link logged above');
        console.log('[MagicLink] DEV MODE: Copy this URL to test: ', magicLinkUrl);
        // Don't throw error - allow dev testing to continue
        return;
      }

      // For other errors, throw
      throw new Error(`Failed to send email: ${error.message}`);
    }

    console.log('[MagicLink] Email sent successfully:', data);
  } catch (error) {
    console.error('[MagicLink] Send email error:', error);
    throw error;
  }
}
