# Quick Test Guide - Magic Link Authentication

## How to Test the Magic Link Flow Manually

### Option 1: Using the Browser (Recommended)

1. **Visit the PWA:**
   - Go to: https://kids-home-hub-pwa.pages.dev
   
2. **Enter your email:**
   - Enter any email address (e.g., `yourname@example.com`)
   - Click "Send Magic Link"
   
3. **Get the token from logs:**
   Since we don't have email configured, you need to check the logs:
   ```bash
   npx wrangler tail kids-home-hub-api --format pretty
   ```
   Look for a line like:
   ```
   [MagicLink] Magic link URL: https://kids-home-hub-pwa.pages.dev/auth/verify?token=XXX&email=YYY
   ```

4. **Click the magic link:**
   - Copy the full URL from the logs
   - Paste it into your browser
   - You should be automatically logged in!

---

### Option 2: Using the Test Script (Automated)

```bash
cd /Users/Karim/kids-home-hub
./test-magic-link.sh
```

This will:
1. Request a magic link
2. Extract the token from the database
3. Verify the token
4. Test an authenticated request
5. Show ✅ if everything works

---

### Option 3: Using cURL (Manual API Testing)

**Step 1: Request Magic Link**
```bash
curl -X POST https://kids-home-hub-api.karim-005.workers.dev/v1/auth/magic-link \
  -H "Content-Type: application/json" \
  -H "Origin: https://kids-home-hub-pwa.pages.dev" \
  -d '{"email":"test@example.com","redirectUrl":"https://kids-home-hub-pwa.pages.dev"}'
```

Expected: `{"success":true,"message":"Magic link sent to email"}`

**Step 2: Get Token from Database**
```bash
export PGPASSWORD='npg_nIT9wO8Ashif'
TOKEN=$(psql 'postgresql://neondb_owner@ep-young-cell-ab2lrnji-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require' \
  -t -c "SELECT token FROM magic_link_tokens WHERE email = 'test@example.com' AND used_at IS NULL ORDER BY created_at DESC LIMIT 1" | xargs)
echo $TOKEN
```

**Step 3: Verify Token**
```bash
curl -X POST https://kids-home-hub-api.karim-005.workers.dev/v1/auth/verify \
  -H "Content-Type: application/json" \
  -H "Origin: https://kids-home-hub-pwa.pages.dev" \
  -d "{\"email\":\"test@example.com\",\"token\":\"$TOKEN\"}"
```

Expected: JSON with `token`, `expiresAt`, and `user` fields

---

## Troubleshooting

### Issue: "Invalid or expired magic link"
- **Cause:** Token already used or expired (15 min limit)
- **Solution:** Request a new magic link

### Issue: CORS error in browser
- **Cause:** Accessing from wrong origin
- **Solution:** Make sure you're on https://kids-home-hub-pwa.pages.dev

### Issue: No response from API
- **Cause:** Worker might be down
- **Solution:** Check status at https://kids-home-hub-api.karim-005.workers.dev

---

## Success Indicators

✅ **Everything is working if you see:**
- Magic link request returns `{"success":true}`
- Token verification returns a JWT token
- You can access `/v1/households` with the JWT
- Browser redirects you after verification

---

## Production URLs

- **PWA:** https://kids-home-hub-pwa.pages.dev
- **API:** https://kids-home-hub-api.karim-005.workers.dev
- **Health Check:** https://kids-home-hub-api.karim-005.workers.dev/

---

## Example Magic Link URL

```
https://kids-home-hub-pwa.pages.dev/auth/verify?token=ABC123XYZ&email=user@example.com
```

When a user clicks this:
1. PWA detects the `token` and `email` params
2. Calls verify endpoint automatically
3. Stores the JWT token
4. Redirects to main app
5. User is logged in!

---

**Last Updated:** November 23, 2025  
**Status:** ✅ All systems operational
