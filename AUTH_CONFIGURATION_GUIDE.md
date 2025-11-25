# Supabase Authentication Configuration Guide

This guide walks you through enabling and configuring email authentication in your Supabase project.

**Supabase Project:** https://qojanjzukgkkrqmnyaai.supabase.co

---

## Overview

Your Kids Home Hub application uses Supabase Authentication with:
- **Email Authentication:** Primary method
- **Magic Links:** Passwordless login option
- **Auto User Profile Creation:** Triggers sync auth.users to public.users

---

## Step 1: Access Authentication Settings

1. Navigate to your Supabase Dashboard: https://qojanjzukgkkrqmnyaai.supabase.co
2. Click **Authentication** in the left sidebar
3. Click **Providers** tab at the top

---

## Step 2: Enable Email Provider

### Enable Email Authentication

1. Find **Email** in the list of providers
2. Toggle **Enable Email provider** to ON
3. Configure the following settings:

#### Confirm Email
**Setting:** Confirm email
**Recommendation:** Enable for production, disable for development
**Purpose:** Requires users to verify email before accessing the app

- **Production:** ON (users must verify email)
- **Development:** OFF (skip verification for faster testing)

#### Secure Email Change
**Setting:** Secure email change
**Recommendation:** Enable
**Purpose:** Requires email verification when changing email address

- **Recommended:** ON

#### Magic Link
**Setting:** Enable Magic Link
**Recommendation:** Enable
**Purpose:** Allows passwordless login via email link

- **Recommended:** ON
- Users can sign in by clicking a link in their email
- No password needed

### Settings Screenshot Reference

You should see a form like this:

```
Email Provider
├─ Enable Email provider: ✓ ON
├─ Confirm email: ○ ON (production) / ○ OFF (development)
├─ Secure email change: ✓ ON
└─ Magic Link: ✓ ON
```

---

## Step 3: Configure Email Templates

### Access Email Templates

1. Stay in **Authentication** section
2. Click **Email Templates** tab
3. Customize templates for your brand

### Available Templates

#### 1. Confirm Signup
**When sent:** User signs up with email
**Purpose:** Verify email address

**Default subject:** `Confirm your signup`

**Recommended customization:**
```
Subject: Welcome to Kids Home Hub - Confirm Your Email

Hi there!

Welcome to Kids Home Hub - the fun way to manage chores, rewards, and screen time for your family!

Click the link below to confirm your email address and get started:

{{ .ConfirmationURL }}

This link expires in 24 hours.

If you didn't create an account, you can safely ignore this email.

Happy parenting!
The Kids Home Hub Team
```

#### 2. Magic Link
**When sent:** User requests magic link login
**Purpose:** Passwordless authentication

**Default subject:** `Your Magic Link`

**Recommended customization:**
```
Subject: Your Kids Home Hub Magic Link

Hi there!

Click the link below to sign in to Kids Home Hub:

{{ .ConfirmationURL }}

This link expires in 60 minutes.

If you didn't request this, you can safely ignore this email.

The Kids Home Hub Team
```

#### 3. Change Email Address
**When sent:** User changes email
**Purpose:** Confirm new email address

**Recommended customization:**
```
Subject: Confirm Your New Email Address

Hi there!

You recently requested to change your email address for Kids Home Hub.

Click the link below to confirm your new email:

{{ .ConfirmationURL }}

If you didn't make this change, please contact support immediately.

The Kids Home Hub Team
```

#### 4. Reset Password
**When sent:** User requests password reset
**Purpose:** Allow user to set new password

**Recommended customization:**
```
Subject: Reset Your Kids Home Hub Password

Hi there!

Click the link below to reset your password:

{{ .ConfirmationURL }}

This link expires in 60 minutes.

If you didn't request this, you can safely ignore this email.

The Kids Home Hub Team
```

### Template Variables

Available in all email templates:
- `{{ .ConfirmationURL }}` - Action link (signup, magic link, reset)
- `{{ .Token }}` - Raw token (if needed for custom flows)
- `{{ .TokenHash }}` - Hashed token
- `{{ .SiteURL }}` - Your site URL (from redirect settings)

---

## Step 4: Configure Redirect URLs

### Site URL

1. Go to **Authentication** > **URL Configuration**
2. Set **Site URL** to your production domain:

**Production:**
```
https://your-app-domain.com
```

**Development:**
```
http://localhost:5173
```

### Redirect URLs (Whitelist)

Add allowed redirect URLs for authentication callbacks:

**Production:**
```
https://your-app-domain.com/**
https://your-app-domain.com/auth/callback
```

**Development:**
```
http://localhost:5173/**
http://localhost:5173/auth/callback
http://localhost:3000/**
```

**Why whitelist?**
- Security: Prevents redirect attacks
- Flexibility: Allows auth from multiple domains during development

### Configuration Example

```
URL Configuration
├─ Site URL: http://localhost:5173 (dev) or https://your-domain.com (prod)
└─ Redirect URLs:
   ├─ http://localhost:5173/**
   ├─ http://localhost:5173/auth/callback
   ├─ https://your-domain.com/**
   └─ https://your-domain.com/auth/callback
```

---

## Step 5: Configure Session Settings

### Access Session Settings

1. Go to **Authentication** > **Policies**
2. Configure session behavior

### Recommended Settings

#### JWT Expiry
**Setting:** JWT expiry
**Default:** 3600 seconds (1 hour)
**Recommendation:** Keep default or increase to 7200 (2 hours)

**Purpose:** How long access tokens remain valid

#### Refresh Token Expiry
**Setting:** Refresh token expiry
**Default:** 2592000 seconds (30 days)
**Recommendation:** Keep default or adjust based on security needs

**Purpose:** How long users stay logged in

#### Additional Security

**Enable Refresh Token Rotation:**
- **Recommended:** ON
- **Purpose:** Invalidates old refresh tokens on use (prevents token replay)

---

## Step 6: Test Authentication

### Test Email Signup

1. Open your frontend application: http://localhost:5173 (or your URL)
2. Click **Sign Up** or create account
3. Enter test email: `test@example.com`
4. Enter password: `testpassword123`
5. Submit form

### Expected Behavior

**With "Confirm email" enabled:**
1. User receives confirmation email
2. User clicks link in email
3. Email is verified
4. User is redirected to app
5. Trigger creates record in public.users

**With "Confirm email" disabled (dev mode):**
1. User is immediately logged in
2. No email verification required
3. Trigger creates record in public.users

### Test Magic Link

1. Go to login page
2. Click **Sign in with Magic Link**
3. Enter your email
4. Check email inbox
5. Click magic link
6. Should be logged in automatically

### Verify User Profile Created

Run this in SQL Editor:

```sql
-- Check that user profile was created
SELECT
  id,
  email,
  email_verified,
  display_name,
  created_at
FROM users
ORDER BY created_at DESC
LIMIT 5;
```

You should see your test user(s) listed.

---

## Step 7: Configure Environment Variables

### Frontend (.env)

Update `/Users/Karim/kids-home-hub/apps/pwa/.env`:

```env
VITE_SUPABASE_URL=https://qojanjzukgkkrqmnyaai.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

### Backend (.env)

Update `/Users/Karim/kids-home-hub/apps/backend/.env`:

```env
SUPABASE_URL=https://qojanjzukgkkrqmnyaai.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_KEY=<your-service-key>
```

### Finding Your Keys

1. Go to **Settings** > **API** in Supabase Dashboard
2. Copy your keys:
   - **Project URL:** Your SUPABASE_URL
   - **anon public:** Your SUPABASE_ANON_KEY
   - **service_role:** Your SUPABASE_SERVICE_KEY (⚠️ keep secret!)

---

## Step 8: Configure SMTP (Optional)

By default, Supabase sends emails via their service. For production, configure your own SMTP.

### Access SMTP Settings

1. Go to **Settings** > **Authentication**
2. Scroll to **SMTP Settings**

### Recommended SMTP Providers

#### Option 1: SendGrid (Recommended)
- Free tier: 100 emails/day
- Easy setup
- Good deliverability

#### Option 2: AWS SES
- Pay-as-you-go pricing
- Very reliable
- More complex setup

#### Option 3: Mailgun
- Free tier: 5,000 emails/month
- Good for startups

### SMTP Configuration Example

```
SMTP Settings
├─ Enable Custom SMTP: ✓ ON
├─ Host: smtp.sendgrid.net
├─ Port: 587
├─ Username: apikey
├─ Password: <your-sendgrid-api-key>
└─ Sender email: noreply@your-domain.com
```

**Note:** Using custom SMTP requires verifying your domain with the provider.

---

## Authentication Flow Diagram

```
User Signs Up
     │
     ├─> [Supabase Auth] Creates auth.users record
     │         │
     │         ├─> Trigger: handle_auth_user_created()
     │         │         │
     │         │         └─> Creates public.users record
     │         │
     │         └─> Sends confirmation email (if enabled)
     │
     └─> User confirms email
               │
               └─> User logs in
                     │
                     ├─> JWT token generated
                     ├─> RLS policies activate
                     └─> User can access their data
```

---

## Common Authentication Issues

### Issue: No confirmation email received
**Solutions:**
1. Check spam folder
2. Verify SMTP settings (if using custom SMTP)
3. Check Supabase logs: Dashboard > Logs > Auth Logs
4. Disable "Confirm email" for testing

### Issue: "Invalid login credentials"
**Solutions:**
1. Verify email is confirmed (if confirmation enabled)
2. Check password meets requirements (min 6 characters)
3. Try password reset flow

### Issue: User created in auth.users but not in public.users
**Solutions:**
1. Verify trigger exists: `handle_auth_user_created`
2. Check trigger is enabled on auth.users table
3. Re-run migration script to recreate trigger

### Issue: Magic link doesn't work
**Solutions:**
1. Verify redirect URLs are whitelisted
2. Check link hasn't expired (60 minutes)
3. Ensure Magic Link is enabled in provider settings

### Issue: Can't access data after login
**Solutions:**
1. Verify user exists in public.users table
2. Check RLS policies are enabled
3. Ensure user is member of a household (household_members)
4. Verify JWT token contains user ID

---

## Security Best Practices

### Production Checklist

- [x] Enable email confirmation
- [x] Enable secure email change
- [x] Use custom SMTP (not Supabase SMTP)
- [x] Whitelist only necessary redirect URLs
- [x] Enable refresh token rotation
- [x] Keep service_role key secret (never expose in frontend)
- [x] Use HTTPS for all URLs
- [x] Set up rate limiting (if available)

### Development vs Production

| Setting | Development | Production |
|---------|------------|------------|
| Confirm email | OFF | ON |
| Site URL | localhost | Your domain |
| SMTP | Supabase | Custom |
| JWT expiry | 1 hour | 1 hour |
| Refresh token | 30 days | 30 days |

---

## Testing Checklist

After configuration, test these flows:

### Email/Password Flow
- [x] Sign up with new email
- [x] Receive confirmation email (if enabled)
- [x] Confirm email
- [x] Log in with email/password
- [x] Log out
- [x] Log back in
- [x] User profile exists in public.users

### Magic Link Flow
- [x] Request magic link
- [x] Receive magic link email
- [x] Click link
- [x] Automatically logged in
- [x] User profile exists in public.users

### Password Reset Flow
- [x] Request password reset
- [x] Receive reset email
- [x] Click reset link
- [x] Set new password
- [x] Log in with new password

### Email Change Flow
- [x] Log in
- [x] Request email change
- [x] Receive confirmation email at new address
- [x] Confirm new email
- [x] Email updated in auth.users and public.users

---

## Next Steps

1. **Load Test Data**
   - See: TEST_DATA_LOADING_GUIDE.md
   - Create test households and children

2. **Test API Integration**
   - Configure environment variables
   - Test backend endpoints with authenticated requests
   - Verify RLS policies work correctly

3. **Frontend Integration**
   - Implement signup/login UI
   - Add authentication context
   - Test protected routes

4. **Create Your First Household**
   - Sign up as a real user
   - Create a household
   - Add children and chores

---

## Support Resources

- Supabase Auth Docs: https://supabase.com/docs/guides/auth
- Email Templates: https://supabase.com/docs/guides/auth/auth-email-templates
- Magic Links: https://supabase.com/docs/guides/auth/auth-magic-link
- Custom SMTP: https://supabase.com/docs/guides/auth/auth-smtp

---

**Status:** Ready to Configure Authentication
**Project URL:** https://qojanjzukgkkrqmnyaai.supabase.co
**Next Step:** Enable email provider and configure templates
