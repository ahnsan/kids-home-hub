# Testing Dev Login Implementation

## Quick Start Test

### 1. Start the Backend

```bash
cd /Users/Karim/kids-home-hub/apps/backend
npm run dev
```

Verify the server starts on `http://localhost:8787`

### 2. Start the Frontend

```bash
cd /Users/Karim/kids-home-hub/apps/pwa
npm run dev
```

Verify the app opens on `http://localhost:3000`

### 3. Test Dev Login UI

1. Navigate to the login screen
2. You should see:
   - Yellow warning banner: "Development Mode: Email verification bypass enabled"
   - "Dev Login (Skip Email)" button below "Send Magic Link"
3. Enter any email (e.g., `test@example.com`)
4. Click "Dev Login (Skip Email)"
5. You should be logged in immediately and redirected to the app

## Backend API Tests

### Test 1: Successful Dev Login

```bash
curl -X POST http://localhost:8787/v1/auth/dev-login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}' \
  | jq
```

**Expected Response:**
```json
{
  "token": "eyJhbGci...",
  "expiresAt": "2025-12-24T...",
  "user": {
    "id": 1,
    "email": "test@example.com",
    "householdId": null
  }
}
```

### Test 2: Invalid Email Format

```bash
curl -X POST http://localhost:8787/v1/auth/dev-login \
  -H "Content-Type: application/json" \
  -d '{"email": "invalid-email"}' \
  | jq
```

**Expected Response:**
```json
{
  "error": "Invalid email format"
}
```

### Test 3: Missing Email

```bash
curl -X POST http://localhost:8787/v1/auth/dev-login \
  -H "Content-Type: application/json" \
  -d '{}' \
  | jq
```

**Expected Response:**
```json
{
  "error": "Email is required"
}
```

### Test 4: Production Environment Check

To test the environment check, temporarily change `.dev.vars`:

```bash
# In .dev.vars, change:
ENVIRONMENT="production"

# Restart backend, then run:
curl -X POST http://localhost:8787/v1/auth/dev-login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}' \
  | jq
```

**Expected Response:**
```json
{
  "error": "Dev login is only available in development environment"
}
```

**Don't forget to change it back to:**
```bash
ENVIRONMENT="development"
```

## Frontend Integration Tests

### Test 5: Dev Mode Detection

Open browser console on login page:

```javascript
// Should return true in development
import.meta.env.DEV
// or
import.meta.env.MODE === 'development'
```

### Test 6: Session Storage

After dev login, check localStorage:

```javascript
// In browser console
localStorage.getItem('auth_token')      // Should have JWT token
localStorage.getItem('auth_user')       // Should have user JSON
localStorage.getItem('auth_expires')    // Should have expiry timestamp
```

### Test 7: Protected Routes

After dev login:

```javascript
// In browser console - test API call
fetch('http://localhost:8787/v1/households', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
  }
}).then(r => r.json()).then(console.log)
```

Should return households data, not auth error.

## End-to-End Test Scenarios

### Scenario 1: New User Registration

1. Use dev login with new email: `newuser@example.com`
2. Verify user is created in database
3. Verify household can be created
4. Verify full app functionality

### Scenario 2: Existing User Login

1. Use dev login with existing email (from previous test)
2. Verify same user is returned
3. Verify existing household data is accessible

### Scenario 3: Multiple Users

1. Dev login as `parent@example.com`
2. Create a household
3. Logout
4. Dev login as `child@example.com`
5. Verify separate user session

### Scenario 4: Session Persistence

1. Dev login
2. Close browser tab
3. Reopen application
4. Verify still logged in (session persists)

### Scenario 5: Session Expiration

1. Dev login
2. Manually modify `auth_expires` in localStorage to past date
3. Refresh page
4. Verify redirected to login (session expired)

## Production Safety Tests

### Test 8: Production Build

```bash
cd /Users/Karim/kids-home-hub/apps/pwa
npm run build
npm run preview
```

1. Open preview (usually `http://localhost:4173`)
2. Navigate to login page
3. Verify dev login button DOES NOT appear
4. Verify no yellow warning banner

### Test 9: Backend Production Mode

Modify `.dev.vars`:
```
ENVIRONMENT="production"
```

Restart backend and verify:
- Dev login API returns 403
- Backend logs warning message
- Normal magic link still works

## Database Verification

### Check User Creation

```sql
-- Connect to your database
SELECT id, email, created_at, updated_at
FROM users
WHERE email IN ('test@example.com', 'parent@example.com')
ORDER BY created_at DESC;
```

### Check Session Creation

```sql
-- Verify sessions are created
SELECT us.id, us.user_id, u.email, us.created_at, us.expires_at
FROM user_sessions us
JOIN users u ON u.id = us.user_id
WHERE u.email = 'test@example.com'
ORDER BY us.created_at DESC
LIMIT 5;
```

### Check No Magic Link Tokens

```sql
-- Verify no magic link tokens created for dev login
SELECT *
FROM magic_link_tokens
WHERE email = 'test@example.com'
ORDER BY created_at DESC;
```

Should return no results (dev login bypasses magic links).

## Performance Tests

### Test 10: Speed Comparison

**Magic Link Flow:**
1. Enter email
2. Click "Send Magic Link"
3. Wait for email (~5-30 seconds)
4. Open email client
5. Click link
6. Redirected and logged in
**Total: ~30-60 seconds**

**Dev Login Flow:**
1. Enter email
2. Click "Dev Login"
3. Logged in
**Total: ~1-2 seconds**

## Error Handling Tests

### Test 11: Network Error Simulation

1. Stop backend server
2. Try dev login
3. Verify appropriate error message: "Network error. Please check your connection and try again."

### Test 12: Database Error

1. Modify `.dev.vars` with invalid DATABASE_URL
2. Restart backend
3. Try dev login
4. Verify error handling (500 response)
5. Fix DATABASE_URL

## Security Tests

### Test 13: CORS Check

```bash
curl -X POST http://localhost:8787/v1/auth/dev-login \
  -H "Content-Type: application/json" \
  -H "Origin: http://malicious-site.com" \
  -d '{"email": "test@example.com"}' \
  -v
```

Verify CORS headers are appropriate.

### Test 14: SQL Injection Protection

```bash
curl -X POST http://localhost:8787/v1/auth/dev-login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com; DROP TABLE users;--"}' \
  | jq
```

Should return "Invalid email format" (caught by regex validation).

### Test 15: XSS Protection

```bash
curl -X POST http://localhost:8787/v1/auth/dev-login \
  -H "Content-Type: application/json" \
  -d '{"email": "<script>alert(1)</script>@example.com"}' \
  | jq
```

Should return "Invalid email format".

## Regression Tests

### Test 16: Magic Link Still Works

1. Enter valid email
2. Click "Send Magic Link" (not dev login)
3. Verify email is sent
4. Verify magic link verification works
5. Verify normal auth flow unchanged

### Test 17: Logout Works

1. Dev login
2. Click logout
3. Verify session cleared
4. Verify redirected to login

### Test 18: Token Refresh Works

```bash
# After dev login, get token
TOKEN=$(curl -X POST http://localhost:8787/v1/auth/dev-login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}' \
  | jq -r '.token')

# Test refresh
curl -X POST http://localhost:8787/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
```

Should return new token.

## Checklist

- [ ] Backend dev login endpoint implemented
- [ ] Backend route added to router
- [ ] ENVIRONMENT variable set in .dev.vars
- [ ] Frontend devLogin function works
- [ ] Frontend isDevMode detection works
- [ ] Dev login button appears in development
- [ ] Dev mode warning banner appears
- [ ] Email validation works
- [ ] User auto-creation works
- [ ] Session creation works
- [ ] Token generation works
- [ ] 403 returned in non-development environment
- [ ] Production build hides dev login
- [ ] Error handling works correctly
- [ ] Documentation complete
- [ ] Database integrity maintained
- [ ] Magic link flow still works
- [ ] Session management works

## Common Issues

### Issue: "Dev login is only available in development environment"

**Solution**: Check `.dev.vars` has `ENVIRONMENT="development"` and restart backend.

### Issue: Dev login button not showing

**Solution**: Verify running `npm run dev` (not `npm run build && npm run preview`).

### Issue: Network error on dev login

**Solution**: Ensure backend is running on port 8787 and API_URL is correct.

### Issue: Token not being stored

**Solution**: Check browser localStorage is enabled and not full.

## Success Criteria

Dev login implementation is successful when:

1. Can log in instantly in development mode
2. Button only appears in development
3. 403 error in production environment
4. Same session format as magic link
5. All existing auth features work
6. Documentation is clear and complete
