/**
 * Email service using Resend
 */

import { Resend } from 'resend';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export class EmailService {
  private resend: Resend;
  private fromEmail: string;

  constructor(apiKey: string, fromEmail = 'Kids Home Hub <noreply@kids-home-hub.com>') {
    this.resend = new Resend(apiKey);
    this.fromEmail = fromEmail;
  }

  /**
   * Send an email using Resend
   */
  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });

      if (error) {
        console.error('[EmailService] Error sending email:', error);
        throw new Error(`Failed to send email: ${error.message}`);
      }

      console.log('[EmailService] Email sent successfully:', data?.id);
    } catch (error) {
      console.error('[EmailService] Exception sending email:', error);
      throw error;
    }
  }

  /**
   * Send magic link email
   */
  async sendMagicLinkEmail(email: string, magicLinkUrl: string): Promise<void> {
    const html = this.getMagicLinkEmailTemplate(magicLinkUrl);

    await this.sendEmail({
      to: email,
      subject: 'Sign in to Kids Home Hub',
      html,
    });
  }

  /**
   * Get magic link email template
   */
  private getMagicLinkEmailTemplate(magicLinkUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Sign in to Kids Home Hub</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background-color: #ffffff;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
              overflow: hidden;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              padding: 30px;
              text-align: center;
            }
            .header h1 {
              color: #ffffff;
              margin: 0;
              font-size: 24px;
              font-weight: 600;
            }
            .content {
              padding: 40px 30px;
            }
            .content p {
              margin: 0 0 20px;
              color: #555;
            }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: #ffffff;
              text-decoration: none;
              padding: 14px 40px;
              border-radius: 6px;
              font-weight: 600;
              margin: 20px 0;
              text-align: center;
            }
            .button:hover {
              opacity: 0.9;
            }
            .footer {
              background-color: #f9f9f9;
              padding: 20px 30px;
              text-align: center;
              color: #999;
              font-size: 12px;
              border-top: 1px solid #e0e0e0;
            }
            .security-note {
              background-color: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 12px;
              margin: 20px 0;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏠 Kids Home Hub</h1>
            </div>
            <div class="content">
              <p>Hi there!</p>
              <p>Click the button below to sign in to your Kids Home Hub account. This link will expire in 15 minutes for security.</p>

              <div style="text-align: center;">
                <a href="${magicLinkUrl}" class="button">Sign In to Kids Home Hub</a>
              </div>

              <div class="security-note">
                <strong>⚠️ Security Note:</strong> This is a one-time login link. If you didn't request this email, you can safely ignore it.
              </div>

              <p>If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #667eea; font-size: 12px;">
                ${magicLinkUrl}
              </p>
            </div>
            <div class="footer">
              <p>Kids Home Hub - Making parenting easier, one task at a time</p>
              <p>This is an automated email. Please do not reply.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}
