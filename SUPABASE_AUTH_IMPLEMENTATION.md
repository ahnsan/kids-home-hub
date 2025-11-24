# Supabase Auth Implementation Reference

This document provides a complete reference for the Supabase Auth implementation in the Kids Home Hub PWA.

## Implementation Summary

### Files Created

1. **`/apps/pwa/src/lib/supabase.ts`**
   - Supabase client configuration
   - Client initialization with PKCE flow
   - Helper functions for session and user retrieval
   - Auth state change listener setup

2. **`/apps/pwa/src/lib/supabaseAuth.ts`**
   - High-level auth service layer
   - Magic link authentication
   - OAuth provider support
   - Session and token management
   - User profile updates
   - Supabase user to app User type mapping

### Files Modified

1. **`/apps/pwa/src/lib/auth.ts`**
   - Updated to use Supabase Auth under the hood
   - Maintained backward-compatible API
   - Added OAuth support
   - Simplified token management

2. **`/apps/pwa/src/api/client.ts`**
   - Updated to automatically inject Supabase auth tokens
   - Made beforeRequest hook async to fetch token

3. **`/apps/pwa/src/stores/authStore.ts`**
   - Added session signal for Supabase session
   - Integrated with Supabase auth state listener
   - Automatic session loading and user data fetching
   - Cross-tab synchronization support

4. **`/apps/pwa/src/components/auth/LoginScreen.tsx`**
   - Updated dev login flow
   - Added OAuth login handlers
   - Minimal changes to maintain UI consistency

5. **`/apps/pwa/src/components/auth/VerifyMagicLink.tsx`**
   - Simplified to work with Supabase automatic verification
   - Removed manual token verification logic
   - Relies on Supabase session detection

6. **`/apps/pwa/.env.example`**
   - Added Supabase URL and anon key configuration

---

## Code Examples

### Basic Authentication Flow

```typescript
import { sendMagicLink, onAuthStateChange, logout } from './lib/auth';

// Send magic link
await sendMagicLink('user@example.com');
// Supabase sends email, user clicks link, session is established

// Listen to auth changes
const unsubscribe = onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    console.log('User signed in:', session.user.email);
  } else if (event === 'SIGNED_OUT') {
    console.log('User signed out');
  }
});

// Later: cleanup
unsubscribe();

// Logout
await logout();
```

### OAuth Authentication

```typescript
import { signInWithOAuth } from './lib/auth';

// Google OAuth
await signInWithOAuth('google');
// Browser redirects to Google, then back to /auth/callback

// GitHub OAuth
await signInWithOAuth('github');
```

### Get Current User

```typescript
import { getCurrentUser, getAuthToken } from './lib/auth';

// Get user data
const user = await getCurrentUser();
console.log(user.email, user.id);

// Get auth token for API calls
const token = await getAuthToken();
```

### Using in Components

```typescript
import { useSignal, useSignalEffect } from '@preact/signals';
import { isAuthenticated, user } from '../stores/authStore';
import { logout } from '../lib/auth';

export const UserProfile = () => {
  const handleLogout = async () => {
    await logout();
  };

  if (!isAuthenticated.value) {
    return <div>Please log in</div>;
  }

  return (
    <div>
      <h1>Welcome, {user.value?.email}</h1>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
};
```

---

## Auth Flow Diagrams

### Magic Link Flow

```
┌─────────────┐
│   User      │
│ enters email│
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────┐
│  sendMagicLink('user@email.com')│
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  Supabase.auth.signInWithOtp()  │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  Supabase sends email           │
│  with magic link                │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  User clicks link in email      │
│  Redirected to /auth/callback   │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  Supabase client detects        │
│  auth tokens in URL             │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  Session automatically          │
│  established & stored           │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  onAuthStateChange fires        │
│  with 'SIGNED_IN' event         │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  authStore updates              │
│  user and session signals       │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  App redirects to home          │
└─────────────────────────────────┘
```

### OAuth Flow

```
┌─────────────┐
│   User      │
│clicks Google│
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────┐
│  signInWithOAuth('google')      │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  Browser redirects to           │
│  Google OAuth consent screen    │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  User grants permission         │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  Google redirects to Supabase   │
│  /auth/v1/callback              │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  Supabase validates OAuth token │
│  Creates user session           │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  Supabase redirects to          │
│  /auth/callback with tokens     │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  Same as magic link flow        │
│  from here on                   │
└─────────────────────────────────┘
```

### Token Refresh Flow (Automatic)

```
┌─────────────────────────────────┐
│  Token expiry approaching       │
│  (handled by Supabase SDK)      │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  Supabase.auth automatically    │
│  calls refresh endpoint         │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  New tokens received            │
│  Session updated                │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  onAuthStateChange fires        │
│  with 'TOKEN_REFRESHED' event   │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  authStore updates session      │
│  No user action required        │
└─────────────────────────────────┘
```

---

## Configuration Reference

### Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL | `https://abc123.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anonymous/public key | `eyJhbGci...` |
| `VITE_API_URL` | Yes | Backend API URL | `https://api.example.com` |

### Supabase Client Options

```typescript
createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: window.localStorage,      // Where to store session
    autoRefreshToken: true,            // Auto refresh tokens
    persistSession: true,              // Persist across reloads
    detectSessionInUrl: true,          // Detect auth in URL
    flowType: 'pkce',                  // Use PKCE for security
  },
});
```

### Magic Link Email Options

```typescript
supabase.auth.signInWithOtp({
  email: 'user@example.com',
  options: {
    emailRedirectTo: 'https://app.com/auth/callback',
    shouldCreateUser: true,           // Auto-create if not exists
  },
});
```

---

## API Reference

### Auth Functions

#### `sendMagicLink(email: string): Promise<void>`

Sends a magic link to the specified email address.

**Parameters:**
- `email` - User's email address

**Throws:**
- Error if email is invalid
- Error if Supabase API fails

**Example:**
```typescript
try {
  await sendMagicLink('user@example.com');
  console.log('Magic link sent!');
} catch (error) {
  console.error('Failed to send magic link:', error);
}
```

---

#### `signInWithOAuth(provider): Promise<void>`

Initiates OAuth sign-in flow with the specified provider.

**Parameters:**
- `provider` - OAuth provider: `'google' | 'github' | 'gitlab' | 'bitbucket'`

**Example:**
```typescript
await signInWithOAuth('google');
// Browser redirects to Google OAuth
```

---

#### `getCurrentUser(): Promise<User | null>`

Gets the current authenticated user.

**Returns:**
- `User` object if authenticated
- `null` if not authenticated

**Example:**
```typescript
const user = await getCurrentUser();
if (user) {
  console.log('User ID:', user.id);
  console.log('Email:', user.email);
}
```

---

#### `getAuthToken(): Promise<string | null>`

Gets the current auth token for API requests.

**Returns:**
- JWT token string if authenticated
- `null` if not authenticated

**Example:**
```typescript
const token = await getAuthToken();
if (token) {
  // Use in API request
  fetch('/api/endpoint', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
}
```

---

#### `isAuthenticated(): Promise<boolean>`

Checks if the user is currently authenticated.

**Returns:**
- `true` if authenticated
- `false` if not authenticated

**Example:**
```typescript
if (await isAuthenticated()) {
  // Show authenticated content
} else {
  // Redirect to login
}
```

---

#### `logout(): Promise<void>`

Signs out the current user and clears the session.

**Example:**
```typescript
await logout();
console.log('User logged out');
```

---

#### `onAuthStateChange(callback): () => void`

Listens to auth state changes.

**Parameters:**
- `callback` - Function called on auth events
  - `event` - Event type: `'SIGNED_IN' | 'SIGNED_OUT' | 'TOKEN_REFRESHED' | 'USER_UPDATED'`
  - `session` - Current session (or null)

**Returns:**
- Unsubscribe function

**Example:**
```typescript
const unsubscribe = onAuthStateChange((event, session) => {
  console.log('Auth event:', event);
  if (session) {
    console.log('User:', session.user.email);
  }
});

// Later: cleanup
unsubscribe();
```

---

#### `devLogin(email: string): Promise<void>`

Development-only login bypass (sends magic link in dev mode).

**Parameters:**
- `email` - User's email address

**Throws:**
- Error if called in production mode

**Example:**
```typescript
// Only works in development
await devLogin('dev@example.com');
```

---

### Auth Store

#### Signals

```typescript
// User signal
user: Signal<User | null>

// Session signal (Supabase session)
session: Signal<Session | null>

// Loading state
isAuthLoading: Signal<boolean>

// Error state
authError: Signal<string | null>
```

#### Computed Signals

```typescript
// Is user authenticated
isAuthenticated: Computed<boolean>

// Has household
hasHousehold: Computed<boolean>
```

#### Functions

```typescript
// Initialize auth store
initializeAuthStore(): void

// Set user manually
setUser(user: User | null): void

// Update user data
updateUser(updates: Partial<User>): void

// Clear user session
clearUser(): void

// Set auth error
setAuthError(error: string | null): void

// Refresh user data
refreshUserData(): Promise<void>

// Cleanup
cleanupAuthStore(): void
```

---

## Comparison: Old vs New

### Code Complexity

**Before (Custom Auth):**
- ~500 lines of auth-related code
- Manual token generation and validation
- Custom email sending
- Manual session management
- No cross-tab sync

**After (Supabase Auth):**
- ~300 lines of auth-related code (40% reduction)
- Automatic token handling
- Built-in email sending
- Automatic session management
- Built-in cross-tab sync

### Security

**Before:**
- Custom JWT implementation (potential security issues)
- Manual token expiry checking
- No rate limiting by default
- No audit logging

**After:**
- Industry-standard auth (battle-tested)
- Automatic token refresh
- Built-in rate limiting
- Built-in audit logging
- GDPR/CCPA compliant

### Developer Experience

**Before:**
```typescript
// Send magic link
await api.post('v1/auth/magic-link', { json: { email } });

// Verify token manually
const token = params.get('token');
const email = params.get('email');
const session = await api.post('v1/auth/verify', {
  json: { token, email }
}).json();

// Store manually
localStorage.setItem('auth_token', session.token);
localStorage.setItem('auth_user', JSON.stringify(session.user));
localStorage.setItem('auth_expires', session.expiresAt);

// Check expiry manually
if (Date.now() > parseInt(localStorage.getItem('auth_expires'))) {
  // Token expired, refresh
  await refreshToken();
}

// Add to API requests manually
fetch('/api/endpoint', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
  }
});
```

**After:**
```typescript
// Send magic link
await sendMagicLink(email);

// Everything else is automatic!
// - Token verification
// - Session storage
// - Token refresh
// - Adding to API requests
```

### Features Comparison

| Feature | Old System | Supabase Auth |
|---------|-----------|---------------|
| Magic Links | ✅ Custom | ✅ Built-in |
| OAuth | ❌ No | ✅ Yes |
| Token Refresh | ⚠️ Manual | ✅ Automatic |
| Cross-Tab Sync | ❌ No | ✅ Yes |
| Email Templates | ⚠️ Basic | ✅ Customizable |
| Rate Limiting | ❌ No | ✅ Built-in |
| Audit Logs | ❌ No | ✅ Built-in |
| MFA Support | ❌ No | ✅ Optional |
| Session Management | ⚠️ Manual | ✅ Automatic |
| iOS PWA Support | ⚠️ Issues | ✅ Better |

---

## Troubleshooting

### Common Issues

**Magic link not received:**
1. Check Supabase email settings
2. Verify SMTP configuration
3. Check spam folder
4. Test with different email provider

**Session not persisting:**
1. Check localStorage is enabled
2. Verify Supabase client config
3. Check browser console for errors
4. Clear localStorage and try again

**OAuth not working:**
1. Verify OAuth provider credentials
2. Check redirect URLs match exactly
3. Ensure OAuth app is published (not in dev mode)
4. Check browser console for errors

**iOS PWA issues:**
1. Verify redirect URL matches PWA URL
2. Check Apple App Site Association file
3. Test with Safari developer tools
4. Ensure PWA is installed to home screen

---

## Performance

### Bundle Size Impact

```
Old auth system: ~12 KB (custom code)
Supabase JS client: ~45 KB (gzipped)
Net increase: ~33 KB

Trade-off: +33 KB for significantly reduced complexity and better features
```

### Network Requests

**Old system:**
- Magic link: 1 request to backend
- Verification: 1 request to backend
- Token refresh: 1 request every 7 days

**Supabase:**
- Magic link: 1 request to Supabase
- Verification: Automatic (0 extra requests)
- Token refresh: Automatic every ~55 minutes

---

## Next Steps

After implementing Supabase Auth:

1. **Enable Email Confirmation** (Production)
   - Navigate to Authentication > Settings
   - Enable "Confirm email"
   - Customize email templates

2. **Configure OAuth Providers**
   - Add Google OAuth
   - Add GitHub OAuth
   - Test OAuth flows

3. **Set Up Email Templates**
   - Customize magic link email
   - Add branding and styling
   - Test email delivery

4. **Implement MFA** (Optional)
   - Enable TOTP MFA in Supabase
   - Add MFA UI to settings
   - Test MFA flow

5. **Monitor Usage**
   - Check Supabase dashboard for auth metrics
   - Monitor error rates
   - Track sign-in patterns

6. **Backend Migration**
   - Update backend to validate Supabase JWTs
   - Migrate existing users
   - Remove old auth endpoints

---

*Last Updated: 2025-11-24*
