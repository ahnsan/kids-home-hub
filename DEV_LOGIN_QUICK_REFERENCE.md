# Dev Login Quick Reference Card

## Quick Start (30 seconds)

```bash
# 1. Start Backend
cd /Users/Karim/kids-home-hub/apps/backend
npm run dev

# 2. Start Frontend (in new terminal)
cd /Users/Karim/kids-home-hub/apps/pwa
npm run dev

# 3. Open browser: http://localhost:3000
# 4. Enter email: test@example.com
# 5. Click "Dev Login (Skip Email)"
# 6. Done! You're logged in.
```

## One-Line API Test

```bash
curl -X POST http://localhost:8787/v1/auth/dev-login -H "Content-Type: application/json" -d '{"email":"test@example.com"}' | jq
```

## Common Test Emails

```
test@example.com
parent@example.com
admin@example.com
user1@example.com
user2@example.com
```

## Files Changed

**Backend**:
- `/apps/backend/src/handlers/auth.ts` - Added `devLogin()` function
- `/apps/backend/src/index.ts` - Added route
- `/apps/backend/.dev.vars` - Added `ENVIRONMENT="development"`

**Frontend**:
- `/apps/pwa/src/lib/auth.ts` - Added `devLogin()` and `isDevMode()`
- `/apps/pwa/src/components/auth/LoginScreen.tsx` - Added UI button

## Key Features

- **Speed**: Login in ~1 second (vs ~30 seconds for magic link)
- **Security**: Only works when `ENVIRONMENT="development"`
- **Safety**: Returns 403 in production, button hidden in prod builds
- **Consistency**: Uses same session format as magic link

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Button not showing | Run `npm run dev` (not build) |
| 403 error | Check `ENVIRONMENT="development"` in `.dev.vars` |
| Network error | Ensure backend is running on port 8787 |

## Environment Requirements

**Development** (dev login works):
```bash
# Backend .dev.vars
ENVIRONMENT="development"

# Frontend
npm run dev
```

**Production** (dev login blocked):
```bash
# Cloudflare Workers
ENVIRONMENT="production"

# Frontend
npm run build
```

## Response Format

**Success (200)**:
```json
{
  "token": "eyJhbGci...",
  "expiresAt": "2025-12-24T10:30:00.000Z",
  "user": {
    "id": 1,
    "email": "test@example.com",
    "householdId": null
  }
}
```

**Production/Staging (403)**:
```json
{
  "error": "Dev login is only available in development environment"
}
```

## Documentation Links

- Full Guide: `/apps/backend/DEV_LOGIN_GUIDE.md`
- Testing Guide: `/TESTING_DEV_LOGIN.md`
- Implementation Summary: `/DEV_LOGIN_IMPLEMENTATION_SUMMARY.md`

## Quick Checks

**Is dev login working?**
```bash
curl -X POST http://localhost:8787/v1/auth/dev-login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

**Is environment correct?**
```bash
curl http://localhost:8787/ | jq '.environment'
# Should return: "development"
```

**Is frontend in dev mode?**
```javascript
// In browser console:
import.meta.env.DEV
// Should return: true
```

## Workflow

### Quick Testing Flow
1. Enter test email
2. Click "Dev Login (Skip Email)"
3. Test your feature
4. Logout if needed
5. Repeat with different email for multi-user testing

### Before Production Deploy
- [ ] Set `ENVIRONMENT="production"` in Cloudflare Workers
- [ ] Build frontend: `npm run build`
- [ ] Test that dev login returns 403
- [ ] Verify button not visible in production build

## Performance

- Magic Link: ~30-60 seconds
- Dev Login: ~1-2 seconds
- **Time Saved**: 95%+

## Need Help?

1. Check `/apps/backend/DEV_LOGIN_GUIDE.md` for detailed guide
2. See `/TESTING_DEV_LOGIN.md` for comprehensive testing
3. Review `/DEV_LOGIN_IMPLEMENTATION_SUMMARY.md` for technical details
