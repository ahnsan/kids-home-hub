# Dev Login Guide

## Overview

The dev login feature provides a quick authentication bypass for development and testing purposes. It allows developers to log in instantly without waiting for email verification, significantly speeding up the development workflow.

## How It Works

The dev login endpoint (`POST /v1/auth/dev-login`) bypasses the magic link email verification process:

1. Accepts an email address
2. Auto-creates a user if they don't exist (using the same `get_or_create_user` function as magic link)
3. Creates a session token directly without requiring email verification
4. Returns the same response format as the verify endpoint

## Security Measures

### Backend Security

The dev login endpoint implements multiple security layers:

1. **Environment Check**: Only works when `ENVIRONMENT` is set to `'development'`
   - Returns HTTP 403 in production/staging environments
   - Logs warning if attempted in non-development environment

2. **Input Validation**:
   - Validates email format using regex
   - Requires email parameter

3. **Consistent Behavior**:
   - Uses the same user creation and session management as magic link
   - Maintains database integrity

### Frontend Security

1. **Dev Mode Detection**: Button only appears when `import.meta.env.DEV === true`
2. **Visual Warning**: Shows development mode indicator to prevent confusion
3. **Error Handling**: Displays appropriate error messages if used incorrectly

## Usage

### Prerequisites

1. Backend `.dev.vars` file must have:
   ```
   ENVIRONMENT="development"
   ```

2. Frontend must be running in development mode (`npm run dev`)

### Using Dev Login

#### From the UI

1. Start the backend: `npm run dev` (in `/apps/backend`)
2. Start the frontend: `npm run dev` (in `/apps/pwa`)
3. Open the login screen
4. You'll see a yellow warning banner indicating development mode
5. Enter any email address (e.g., `test@example.com`)
6. Click "Dev Login (Skip Email)" button
7. You'll be logged in immediately

#### From API (Testing)

```bash
curl -X POST http://localhost:8787/v1/auth/dev-login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": "2025-12-24T10:30:00.000Z",
  "user": {
    "id": 1,
    "email": "test@example.com",
    "householdId": null
  }
}
```

## Test Users

Here are some suggested test users to create for different scenarios:

### Basic Test Users

```
test@example.com          - Primary test user
parent@example.com        - Parent user with household
child1@example.com        - Child user (for multi-user testing)
admin@example.com         - Admin user
```

### Scenario-Based Test Users

```
new-user@example.com      - Testing first-time user flow
existing-user@example.com - Testing returning user
multi-device@example.com  - Testing cross-device sync
offline-test@example.com  - Testing offline capabilities
```

### Creating Test Users

You can create any email address on-the-fly using dev login. The system will:
- Create the user if they don't exist
- Log you in immediately
- No email verification required

## Production Safety

### What Happens in Production?

If someone attempts to use dev login in production:

1. Backend returns HTTP 403 Forbidden
2. Response: `{"error": "Dev login is only available in development environment"}`
3. Warning logged: `[Auth] Dev login attempted in non-development environment: production`

### Deployment Checklist

When deploying to production, ensure:

- [ ] `ENVIRONMENT` is set to `'production'` in Cloudflare Workers environment variables
- [ ] Frontend is built with `npm run build` (removes dev mode features)
- [ ] Dev login button does not appear in production builds
- [ ] API endpoint returns 403 for dev login requests

## Comparison: Magic Link vs Dev Login

| Feature | Magic Link | Dev Login |
|---------|-----------|-----------|
| Email Required | Yes | Yes (any format) |
| Email Sent | Yes | No |
| Email Verification | Yes | No |
| User Auto-Creation | Yes | Yes |
| Session Token | Yes | Yes |
| Production Available | Yes | No |
| Speed | ~30 seconds | Instant |
| Use Case | Production auth | Development only |

## API Reference

### Endpoint

```
POST /v1/auth/dev-login
```

### Request Body

```typescript
{
  email: string // Valid email format required
}
```

### Response (Success - 200)

```typescript
{
  token: string        // JWT session token
  expiresAt: string    // ISO 8601 timestamp
  user: {
    id: number
    email: string
    householdId?: number
  }
}
```

### Error Responses

#### 400 Bad Request
```json
{"error": "Email is required"}
{"error": "Invalid email format"}
```

#### 403 Forbidden
```json
{"error": "Dev login is only available in development environment"}
```

#### 500 Internal Server Error
```json
{"error": "Failed to perform dev login"}
```

## Troubleshooting

### Dev Login Button Not Appearing

**Cause**: Frontend not in development mode

**Solution**:
- Check `npm run dev` is running (not `npm run build`)
- Verify browser console: `import.meta.env.DEV` should be `true`

### 403 Forbidden Error

**Cause**: Backend `ENVIRONMENT` not set to `development`

**Solution**:
- Check `/apps/backend/.dev.vars` contains `ENVIRONMENT="development"`
- Restart backend server: `npm run dev`

### User Not Created

**Cause**: Database connection issue

**Solution**:
- Check `DATABASE_URL` in `.dev.vars`
- Verify database is accessible
- Check backend logs for SQL errors

### Session Not Persisting

**Cause**: localStorage issue or token expiration

**Solution**:
- Check browser localStorage for `auth_token`, `auth_user`, `auth_expires`
- Verify token not expired (30 days default)
- Clear browser cache and try again

## Best Practices

### Development Workflow

1. **Use Dev Login for Rapid Testing**
   - Quick iteration on features
   - Testing different user states
   - Multi-user scenarios

2. **Test Magic Link Periodically**
   - Ensure email flow still works
   - Test production-like authentication
   - Verify email templates

3. **Clean Up Test Users**
   - Periodically clear test users from database
   - Keep development database manageable

### Team Collaboration

1. **Document Test Users**
   - Share common test emails with team
   - Document user states for testing scenarios

2. **Use Consistent Emails**
   - Establish naming convention (e.g., `test-{feature}@example.com`)
   - Makes debugging easier

## Integration with Existing Auth Flow

The dev login endpoint integrates seamlessly with the existing authentication system:

1. **Uses Same User Creation**: Calls `get_or_create_user()` database function
2. **Same Session Management**: Creates sessions in `user_sessions` table
3. **Same Token Format**: Generates JWT tokens with identical structure
4. **Same Response Format**: Returns identical response to `/auth/verify`

This means:
- Sessions created via dev login work exactly like magic link sessions
- All protected endpoints accept dev login tokens
- Token refresh works identically
- Logout works identically

## Code References

### Backend Files
- Handler: `/apps/backend/src/handlers/auth.ts` (devLogin function)
- Router: `/apps/backend/src/index.ts` (route definition)
- Environment: `/apps/backend/.dev.vars` (ENVIRONMENT variable)

### Frontend Files
- Auth Service: `/apps/pwa/src/lib/auth.ts` (devLogin & isDevMode functions)
- Login UI: `/apps/pwa/src/components/auth/LoginScreen.tsx` (dev login button)

## Additional Notes

- Dev login does not bypass authorization (only authentication)
- Protected routes still require valid session token
- User permissions and household memberships work normally
- Ideal for:
  - Feature development
  - Integration testing
  - Demo environments
  - Local development
