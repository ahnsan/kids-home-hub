# Supabase Auth Implementation

This directory contains the Supabase Auth implementation for the Kids Home Hub PWA.

## What Changed?

The app now uses **Supabase Auth** instead of custom JWT + magic link authentication.

### Benefits
- Automatic token refresh
- Cross-tab session sync
- OAuth support (Google, GitHub, etc.)
- Better iOS PWA support
- Reduced code complexity
- Industry-standard security

## Quick Start

### 1. Environment Setup

Create `.env.local`:

```env
VITE_API_URL=https://your-api.workers.dev
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 2. Run Development Server

```bash
pnpm dev
```

### 3. Test Authentication

1. Go to http://localhost:5173
2. Enter email and click "Send Magic Link"
3. Check email and click the link
4. You'll be redirected and signed in automatically

## File Structure

```
src/
├── lib/
│   ├── supabase.ts          # Supabase client setup
│   ├── supabaseAuth.ts      # Auth service layer
│   └── auth.ts              # Main auth interface (uses Supabase)
├── api/
│   └── client.ts            # HTTP client (auto-injects auth tokens)
├── stores/
│   └── authStore.ts         # Auth state management
└── components/
    └── auth/
        ├── LoginScreen.tsx       # Login UI
        └── VerifyMagicLink.tsx   # Auth callback handler
```

## Key Files

### `lib/supabase.ts`
Supabase client configuration.

```typescript
import { supabase } from './lib/supabase';

// Client is ready to use
const { data } = await supabase.auth.getSession();
```

### `lib/supabaseAuth.ts`
Auth service layer with functions like:
- `sendMagicLink(email)`
- `signInWithOAuth(provider)`
- `getCurrentUser()`
- `getAuthToken()`
- `logout()`

### `lib/auth.ts`
Main auth interface that wraps Supabase Auth. This maintains backward compatibility with the old auth API.

```typescript
import { sendMagicLink, getCurrentUser, logout } from './lib/auth';

// Same API as before, but powered by Supabase
await sendMagicLink('user@example.com');
const user = await getCurrentUser();
await logout();
```

## Usage Examples

### Basic Authentication

```typescript
import { sendMagicLink, onAuthStateChange } from './lib/auth';

// Send magic link
await sendMagicLink('user@example.com');

// Listen to auth changes
const unsubscribe = onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    console.log('User signed in!');
  }
});

// Cleanup when component unmounts
unsubscribe();
```

### OAuth Sign-In

```typescript
import { signInWithOAuth } from './lib/auth';

// Sign in with Google
await signInWithOAuth('google');

// Sign in with GitHub
await signInWithOAuth('github');
```

### Get Current User

```typescript
import { getCurrentUser, getAuthToken } from './lib/auth';

const user = await getCurrentUser();
if (user) {
  console.log('User:', user.email);
}

const token = await getAuthToken();
// Use token in API requests
```

### Using Auth Store (Signals)

```typescript
import { isAuthenticated, user } from '../stores/authStore';

export const MyComponent = () => {
  // Reactive signals - auto-updates UI
  if (!isAuthenticated.value) {
    return <LoginPrompt />;
  }

  return <div>Welcome, {user.value?.email}</div>;
};
```

## Auth Flow

### Magic Link Flow

```
1. User enters email
2. sendMagicLink() called
3. Supabase sends email with link
4. User clicks link → redirected to /auth/callback
5. Supabase detects auth tokens in URL
6. Session automatically established
7. onAuthStateChange fires with SIGNED_IN event
8. authStore updates user/session signals
9. App redirects to home
```

### Token Management

Supabase automatically handles:
- Token storage (localStorage)
- Token refresh (before expiry)
- Token injection (in API requests)
- Cross-tab synchronization

You don't need to manually manage tokens!

## API Integration

The API client automatically injects auth tokens:

```typescript
import { api } from './api/client';

// Token is automatically added to this request
const data = await api.get('v1/endpoint').json();

// No need to manually add Authorization header!
```

## Migration from Old Auth

### Before (Custom Auth)

```typescript
// Manual token management
const token = localStorage.getItem('auth_token');
const expires = localStorage.getItem('auth_expires');

if (Date.now() > parseInt(expires)) {
  await refreshToken();
}

fetch('/api/endpoint', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### After (Supabase Auth)

```typescript
// Everything automatic!
const user = await getCurrentUser();

// Tokens automatically injected
fetch('/api/endpoint'); // Token added by API client
```

## Development

### Dev Mode

In development, you can use `devLogin()` to bypass email:

```typescript
import { devLogin, isDevMode } from './lib/auth';

if (isDevMode()) {
  await devLogin('dev@example.com');
  // Sends magic link without production checks
}
```

### Testing

```bash
# Run tests
pnpm test

# Type check
pnpm type-check

# Lint
pnpm lint
```

## Configuration

### Supabase Dashboard

Configure these in your Supabase project:

1. **Authentication > Providers**
   - Enable "Email" provider
   - Configure OAuth providers (optional)

2. **Authentication > URL Configuration**
   - Site URL: Your production URL
   - Redirect URLs: Add callback URLs

3. **Authentication > Email Templates**
   - Customize magic link email
   - Add your branding

### Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key (safe for client) |
| `VITE_API_URL` | Backend API URL |

## Troubleshooting

### Magic link not received
- Check spam folder
- Verify email provider in Supabase dashboard
- Check Supabase logs: Authentication > Logs

### Session not persisting
- Check localStorage is enabled in browser
- Verify Supabase client config in `lib/supabase.ts`
- Check browser console for errors

### OAuth not working
- Verify OAuth provider credentials in Supabase
- Check redirect URLs match exactly
- Ensure OAuth app is published (not in dev/testing mode)

### iOS PWA issues
- Verify redirect URL matches PWA URL exactly
- Check Apple App Site Association file
- Test with Safari developer tools

## Documentation

- **Migration Guide:** `/SUPABASE_AUTH_MIGRATION.md`
- **Implementation Details:** `/SUPABASE_AUTH_IMPLEMENTATION.md`
- **Supabase Docs:** https://supabase.com/docs/guides/auth

## Support

For issues:
1. Check browser console for errors
2. Check Supabase logs in dashboard
3. Review documentation above
4. Create issue in project repository

---

**Last Updated:** 2025-11-24
