# Email Templates

This directory contains HTML email templates for the Kids Home Hub application.

## Magic Link Email Template

Professional, kid-friendly HTML email template for magic link authentication.

### File Location
- **Template:** `/Users/Karim/kids-home-hub/apps/backend/src/templates/magicLinkEmail.ts`
- **Preview:** `/Users/Karim/kids-home-hub/apps/backend/email-preview.html`

### Features

1. **Professional Design**
   - Clean, modern layout with 600px max-width
   - Mobile-responsive design
   - Inline CSS for maximum email client compatibility

2. **Kid-Friendly Branding**
   - Beautiful gradient header (purple to blue)
   - Friendly, welcoming tone
   - Clear, easy-to-read typography

3. **Security Features**
   - Prominent 15-minute expiration notice with yellow alert styling
   - Clear "Didn't request this?" footer message
   - Plain text fallback link

4. **Email Client Compatibility**
   - All styles are inline (required for Gmail, Outlook, etc.)
   - Table-based layout for consistent rendering
   - Tested design patterns for major email clients

### Usage

```typescript
import { getMagicLinkEmailTemplate, getMagicLinkEmailPlainText } from '../templates/magicLinkEmail';

// Generate HTML email
const htmlContent = getMagicLinkEmailTemplate(magicLinkUrl);

// Generate plain text fallback
const textContent = getMagicLinkEmailPlainText(magicLinkUrl);

// Send with Resend
await resend.emails.send({
  from: 'Kids Home Hub <noreply@resend.dev>',
  to: [email],
  subject: 'Sign in to Kids Home Hub',
  html: htmlContent,
  text: textContent,
});
```

### Template Variables

- **`${magicLinkUrl}`** - The complete magic link URL with token and email parameters
- **`${new Date().getFullYear()}`** - Current year for copyright notice

### Design Specifications

**Colors:**
- Primary gradient: `#667eea` to `#764ba2` (purple-blue gradient)
- Background: `#f5f7fa` (light gray-blue)
- Text: `#1f2937` (dark gray)
- Secondary text: `#4b5563` (medium gray)
- Alert background: `#fef3c7` (light yellow)
- Alert border: `#f59e0b` (orange)

**Typography:**
- Font family: Arial, Helvetica, sans-serif
- Header: 32px bold
- Subheader: 24px semi-bold
- Body: 16px normal
- Small text: 12-14px

**Spacing:**
- Max width: 600px
- Padding: 40px (desktop), 20px (mobile)
- Border radius: 12px (container), 8px (button), 6px (alert)

### Preview

To preview the email template:

1. Open `/Users/Karim/kids-home-hub/apps/backend/email-preview.html` in a web browser
2. The preview shows the exact styling as it will appear in email clients

### Testing

Test the email in multiple clients:
- Gmail (web and mobile)
- Outlook (web and desktop)
- Apple Mail (macOS and iOS)
- Yahoo Mail
- ProtonMail

### Plain Text Fallback

The template includes a plain text version for email clients that don't support HTML:

```
Welcome back to Kids Home Hub!

We received a request to sign in to your account.

Click the link below to securely access your family's chore dashboard:
[MAGIC_LINK_URL]

Or copy and paste this link into your browser.

SECURITY NOTICE: This link will expire in 15 minutes for your protection.
If it expires, simply request a new one.

Didn't request this?
If you didn't try to sign in, you can safely ignore this email. No changes will be made to your account.

---
This is an automated message from Kids Home Hub. Please do not reply to this email.
Made with care for families
© 2025 Kids Home Hub. All rights reserved.
```

## Adding New Templates

To add a new email template:

1. Create a new file in this directory (e.g., `welcomeEmail.ts`)
2. Export two functions:
   - `get[TemplateName]EmailTemplate(params): string` - Returns HTML
   - `get[TemplateName]EmailPlainText(params): string` - Returns plain text
3. Use inline CSS for all styling
4. Follow the same design patterns for consistency
5. Create a preview HTML file for testing
6. Update this README with documentation

## Best Practices

1. **Always use inline CSS** - Email clients strip `<style>` tags
2. **Use table-based layouts** - Most reliable cross-client compatibility
3. **Keep width at 600px max** - Standard email width
4. **Include plain text version** - Required for accessibility
5. **Test in multiple clients** - Email rendering varies significantly
6. **Use semantic HTML** - Better accessibility and deliverability
7. **Optimize images** - Keep file sizes small (not applicable to current template)
8. **Include alt text** - For any images (not applicable to current template)
9. **Avoid JavaScript** - Not supported in email clients
10. **Use web-safe fonts** - Arial, Helvetica, Georgia, Times New Roman

## Resources

- [Email on Acid](https://www.emailonacid.com/) - Email testing platform
- [Can I Email](https://www.caniemail.com/) - Email client CSS support reference
- [Really Good Emails](https://reallygoodemails.com/) - Email design inspiration
- [Litmus](https://www.litmus.com/) - Email testing and analytics
