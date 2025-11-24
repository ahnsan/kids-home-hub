# Supabase Auth Migration Guide

This guide documents the migration from custom JWT + magic link authentication to Supabase Auth.

## Table of Contents

1. [Overview](#overview)
2. [Setup Instructions](#setup-instructions)
3. [Architecture Changes](#architecture-changes)
4. [Auth Flow Comparison](#auth-flow-comparison)
5. [API Changes](#api-changes)
6. [Backend Migration](#backend-migration)
7. [Testing](#testing)
8. [Rollback Plan](#rollback-plan)

---

## Overview

### Why Migrate to Supabase Auth?

**Benefits:**
- **Reduced Complexity**: No need to maintain custom JWT token generation, magic link creation, or email sending logic
- **Better Security**: Industry-standard auth implementation with built-in protection against common attacks
- **Automatic Token Refresh**: Handles token expiration and refresh automatically
- **Cross-Tab Synchronization**: Auth state syncs across browser tabs automatically
- **OAuth Support**: Easy integration with Google, GitHub, and other OAuth providers
- **Better iOS PWA Support**: Handles deep linking and session restoration better on iOS
- **Compliance**: GDPR/CCPA compliant out of the box
- **Audit Logs**: Built-in audit logging for security compliance

**Trade-offs:**
- External dependency on Supabase service
- Need to migrate existing user data
- Requires Supabase account and configuration

---

## Setup Instructions

### 1. Create Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Fill in project details:
   - Name: `kids-home-hub`
   - Database Password: (secure password)
   - Region: (closest to your users)
4. Wait for project to be created (~2 minutes)

### 2. Configure Supabase Auth

1. Navigate to **Authentication > Settings**
2. Configure Email Auth:
   - Enable "Email" provider
   - Enable "Email Confirmations"
   - Set "Confirm email" to your preference (recommended: enabled for production)
3. Configure Magic Links:
   - In Email Templates, customize the "Magic Link" template
   - Set redirect URL: `https://your-app.com/auth/callback`
4. Configure Site URL:
   - Set "Site URL" to your production URL
   - Add redirect URLs for development: `http://localhost:5173/auth/callback`

### 3. Configure OAuth Providers (Optional)

#### Google OAuth:
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials
3. Add authorized redirect URI: `https://<your-project>.supabase.co/auth/v1/callback`
4. Copy Client ID and Secret to Supabase Auth Settings

#### GitHub OAuth:
1. Go to GitHub Settings > Developer Settings > OAuth Apps
2. Create new OAuth App
3. Set Authorization callback URL: `https://<your-project>.supabase.co/auth/v1/callback`
4. Copy Client ID and Secret to Supabase Auth Settings

### 4. Get API Keys

1. Navigate to **Settings > API**
2. Copy the following values:
   - `URL`: Your Supabase project URL
   - `anon/public key`: The anonymous key (safe for client-side use)

### 5. Configure Environment Variables

Create or update `/apps/pwa/.env.local`:

```env
VITE_API_URL=https://your-api.workers.dev
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Update `.env.example` with template values.

### 6. Install Dependencies

```bash
cd apps/pwa
pnpm add @supabase/supabase-js
```

---

## Architecture Changes

### File Structure

**New Files:**
- `/apps/pwa/src/lib/supabase.ts` - Supabase client configuration
- `/apps/pwa/src/lib/supabaseAuth.ts` - Supabase auth service layer

**Modified Files:**
- `/apps/pwa/src/lib/auth.ts` - Updated to use Supabase Auth
- `/apps/pwa/src/api/client.ts` - Updated to use Supabase tokens
- `/apps/pwa/src/stores/authStore.ts` - Updated for Supabase session management
- `/apps/pwa/src/components/auth/LoginScreen.tsx` - Minor updates
- `/apps/pwa/src/components/auth/VerifyMagicLink.tsx` - Simplified for Supabase
- `/apps/pwa/.env.example` - Added Supabase configuration

### Component Architecture

```
┌─────────────────────────────────────────┐
│          Preact Components               │
│  (LoginScreen, AuthGuard, etc.)         │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│         lib/auth.ts                     │
│    (Unified Auth Interface)             │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│      lib/supabaseAuth.ts                │
│   (Supabase-specific logic)             │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│       lib/supabase.ts                   │
│    (Supabase Client Config)             │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│    @supabase/supabase-js                │
│      (Supabase SDK)                     │
└─────────────────────────────────────────┘
```

### State Management

**Auth Store Changes:**

```typescript
// Before (Custom Auth)
export const user = signal<User | null>(null);
// Loaded from localStorage

// After (Supabase Auth)
export const user = signal<User | null>(null);
export const session = signal<Session | null>(null);
// Loaded from Supabase session
// Automatically synced across tabs
```

---

## Auth Flow Comparison

### Old Flow: Custom Magic Link

```
1. User enters email in LoginScreen
   ↓
2. Frontend calls POST /v1/auth/magic-link
   ↓
3. Backend generates JWT token
   ↓
4. Backend stores token in database with expiry
   ↓
5. Backend sends email via Resend API
   ↓
6. User clicks link: /verify?token=xxx&email=yyy
   ↓
7. Frontend calls POST /v1/auth/verify
   ↓
8. Backend validates token (check expiry, used status)
   ↓
9. Backend creates session, returns JWT
   ↓
10. Frontend stores JWT in localStorage
   ↓
11. Frontend manually adds JWT to API requests
   ↓
12. Frontend manually checks expiry
   ↓
13. Frontend manually refreshes token
```

**Issues:**
- Complex token management
- Manual session handling
- No cross-tab sync
- iOS PWA deep linking issues
- Need to manage token expiry manually

### New Flow: Supabase Magic Link

```
1. User enters email in LoginScreen
   ↓
2. Frontend calls supabase.auth.signInWithOtp()
   ↓
3. Supabase generates secure token
   ↓
4. Supabase sends email (built-in templates)
   ↓
5. User clicks link: redirects to /auth/callback
   ↓
6. Supabase client detects auth tokens in URL
   ↓
7. Supabase automatically establishes session
   ↓
8. Auth state listener fires SIGNED_IN event
   ↓
9. Frontend redirects to app
   ↓
10. Supabase automatically:
    - Stores session in localStorage
    - Adds tokens to requests
    - Refreshes tokens before expiry
    - Syncs session across tabs
```

**Benefits:**
- Simplified code (no custom token management)
- Automatic session handling
- Cross-tab synchronization
- Better security (industry-standard implementation)
- OAuth support ready

---

## API Changes

### Authentication API

| Function | Old Implementation | New Implementation |
|----------|-------------------|-------------------|
| `sendMagicLink()` | POST to `/v1/auth/magic-link` | `supabase.auth.signInWithOtp()` |
| `verifyMagicLink()` | POST to `/v1/auth/verify` | Automatic (Supabase handles) |
| `getAuthToken()` | Read from localStorage | `supabase.auth.getSession()` |
| `refreshToken()` | POST to `/v1/auth/refresh` | Automatic (Supabase handles) |
| `logout()` | POST to `/v1/auth/logout` | `supabase.auth.signOut()` |
| `getCurrentUser()` | Parse from localStorage | `supabase.auth.getUser()` |
| `isAuthenticated()` | Check token expiry | Check session validity |

### New Features

```typescript
// OAuth Sign-in (not available in old system)
await signInWithOAuth('google');
await signInWithOAuth('github');

// Listen to auth state changes
onAuthStateChange((event, session) => {
  // Handle SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, etc.
});

// Update user profile
await updateUserProfile({
  data: { name: 'John Doe' }
});
```

### API Client Changes

**Before:**
```typescript
// Manual token management
const token = localStorage.getItem('auth_token');
api.post('v1/endpoint', {
  headers: {
    Authorization: `Bearer ${token}`
  }
});
```

**After:**
```typescript
// Automatic token injection
const token = await getAuthToken();
api.post('v1/endpoint'); // Token added automatically in beforeRequest hook
```

---

## Backend Migration

### Required Backend Changes

The backend needs to be updated to validate Supabase JWT tokens instead of custom tokens.

#### 1. Update Auth Middleware

**Before (Custom JWT):**
```typescript
// Validate custom JWT token
const token = request.headers.get('Authorization')?.replace('Bearer ', '');
const decoded = await verifyJWT(token, env.JWT_SECRET);
const user = await db.query('SELECT * FROM users WHERE id = ?', [decoded.userId]);
```

**After (Supabase JWT):**
```typescript
// Validate Supabase JWT token
const token = request.headers.get('Authorization')?.replace('Bearer ', '');

// Verify JWT using Supabase JWT secret
const decoded = await verifySupabaseJWT(token, env.SUPABASE_JWT_SECRET);

// Get user from Supabase or your database
const user = await getUserBySupabaseId(decoded.sub);
```

#### 2. Get Supabase JWT Secret

1. Go to Supabase Dashboard > Settings > API
2. Copy the "JWT Secret" (used to verify tokens)
3. Add to your backend environment:
   ```
   SUPABASE_JWT_SECRET=your-jwt-secret
   ```

#### 3. JWT Verification Function

```typescript
import { jwtVerify, createRemoteJWKSet } from 'jose';

async function verifySupabaseJWT(token: string, jwtSecret: string) {
  try {
    // Option 1: Verify with secret directly
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(jwtSecret)
    );

    return payload;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

// Option 2: Verify with JWKS (more secure, recommended)
const JWKS = createRemoteJWKSet(
  new URL('https://<project-ref>.supabase.co/auth/v1/jwks')
);

async function verifySupabaseJWTWithJWKS(token: string) {
  const { payload } = await jwtVerify(token, JWKS);
  return payload;
}
```

#### 4. User Migration

You need to migrate existing users to Supabase:

```typescript
// Migration script
async function migrateUsersToSupabase() {
  const users = await db.query('SELECT * FROM users');

  for (const user of users) {
    // Create user in Supabase
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: user.email,
      email_confirm: true, // Skip email confirmation
      user_metadata: {
        migrated_from: 'custom_auth',
        original_id: user.id,
        created_at: user.created_at
      }
    });

    if (error) {
      console.error('Failed to migrate user:', user.email, error);
      continue;
    }

    // Update your database to link old user ID with Supabase ID
    await db.query(
      'UPDATE users SET supabase_id = ? WHERE id = ?',
      [data.user.id, user.id]
    );
  }
}
```

#### 5. Update Backend Endpoints

**Endpoints to Remove:**
- `POST /v1/auth/magic-link` (Supabase handles)
- `POST /v1/auth/verify` (Supabase handles)
- `POST /v1/auth/refresh` (Supabase handles)

**Endpoints to Update:**
- `POST /v1/auth/logout` - Update to invalidate Supabase session if needed
- `DELETE /v1/auth/account` - Update to delete Supabase user

**Example:**
```typescript
// Delete account endpoint
app.delete('/v1/auth/account', async (req) => {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  const decoded = await verifySupabaseJWT(token, env.SUPABASE_JWT_SECRET);

  // Delete from Supabase
  await supabaseAdmin.auth.admin.deleteUser(decoded.sub);

  // Delete from your database
  await db.query('DELETE FROM users WHERE supabase_id = ?', [decoded.sub]);

  return { success: true };
});
```

---

## Testing

### Manual Testing Checklist

#### Frontend Tests

- [ ] Magic link sign-in works
- [ ] Email validation works
- [ ] Error messages display correctly
- [ ] Loading states show properly
- [ ] Dev login works in development mode
- [ ] OAuth sign-in works (if configured)
- [ ] Session persists after page reload
- [ ] Auth state syncs across tabs
- [ ] Logout works properly
- [ ] Protected routes redirect to login when not authenticated
- [ ] API requests include auth token
- [ ] Token refresh happens automatically

#### Backend Tests

- [ ] Backend validates Supabase JWT tokens
- [ ] Invalid tokens are rejected
- [ ] Expired tokens are rejected
- [ ] User data is retrieved correctly
- [ ] Protected endpoints require authentication
- [ ] Account deletion works
- [ ] User migration script completes successfully

#### Cross-Browser Tests

- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari (especially iOS)
- [ ] Edge

#### iOS PWA Tests

- [ ] Magic link opens PWA correctly
- [ ] Session persists after closing PWA
- [ ] Deep linking works

### Automated Testing

```typescript
// Test Supabase auth integration
describe('Supabase Auth', () => {
  it('should send magic link', async () => {
    await sendMagicLink('test@example.com');
    // Check that email was sent
  });

  it('should establish session after callback', async () => {
    // Simulate auth callback
    const session = await getSession();
    expect(session).toBeTruthy();
  });

  it('should refresh token automatically', async () => {
    // Wait for token to near expiry
    // Verify token is refreshed
  });

  it('should sync auth state across tabs', async () => {
    // Open multiple tabs
    // Verify auth state is synced
  });
});
```

---

## Rollback Plan

If issues arise, you can rollback to the custom auth system:

### Quick Rollback (Keep Supabase)

1. **Restore Old Files:**
   ```bash
   git checkout main -- apps/pwa/src/lib/auth.ts
   git checkout main -- apps/pwa/src/api/client.ts
   git checkout main -- apps/pwa/src/stores/authStore.ts
   ```

2. **Remove Supabase Files:**
   ```bash
   rm apps/pwa/src/lib/supabase.ts
   rm apps/pwa/src/lib/supabaseAuth.ts
   ```

3. **Restore Environment:**
   Remove Supabase env vars from `.env.local`

4. **Redeploy:**
   ```bash
   pnpm build
   pnpm deploy
   ```

### Full Rollback (Remove Supabase)

1. **Uninstall Package:**
   ```bash
   pnpm remove @supabase/supabase-js
   ```

2. **Restore Code:**
   Follow Quick Rollback steps above

3. **Restore Backend:**
   Re-enable custom auth endpoints

4. **Migrate Users Back:**
   Use Supabase admin API to export users, then recreate in your system

---

## Migration Timeline

### Phase 1: Development (Week 1)
- [ ] Set up Supabase project
- [ ] Implement frontend changes
- [ ] Update backend for Supabase JWT validation
- [ ] Test in development environment

### Phase 2: Staging (Week 2)
- [ ] Deploy to staging environment
- [ ] Run user migration script for staging data
- [ ] Perform QA testing
- [ ] Fix any issues

### Phase 3: Production (Week 3)
- [ ] Schedule maintenance window
- [ ] Deploy backend changes
- [ ] Run user migration script
- [ ] Deploy frontend changes
- [ ] Monitor for issues
- [ ] Rollback if needed

### Phase 4: Cleanup (Week 4)
- [ ] Remove old auth endpoints
- [ ] Remove old auth-related database tables
- [ ] Update documentation
- [ ] Train team on new auth system

---

## Support

### Documentation

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/auth-signinwithotp)
- [Magic Links Guide](https://supabase.com/docs/guides/auth/auth-magic-link)

### Common Issues

**Issue: Magic link not received**
- Check Supabase email provider configuration
- Check spam folder
- Verify redirect URL is correct

**Issue: Session not persisting**
- Check localStorage is enabled
- Verify Supabase client configuration
- Check for console errors

**Issue: iOS PWA not opening after magic link**
- Ensure redirect URL matches your PWA URL exactly
- Check iOS Universal Links configuration
- Test with Safari developer tools

**Issue: Token validation failing on backend**
- Verify JWT secret is correct
- Check token hasn't expired
- Ensure JWKS URL is accessible

---

## Contact

For questions or issues during migration:
- Technical Lead: [Your Name]
- Supabase Support: support@supabase.io
- Project Repository: [GitHub Link]

---

*Last Updated: 2025-11-24*
