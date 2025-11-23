# Magic Link Email Flow

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Request                             │
│                    POST /v1/auth/magic-link                      │
│                  { email, redirectUrl }                          │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      v
┌─────────────────────────────────────────────────────────────────┐
│              Auth Handler (src/handlers/auth.ts)                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 1. Validate email format                                  │  │
│  │ 2. Generate token (32-char nanoid)                        │  │
│  │ 3. Set expiration (15 minutes)                            │  │
│  │ 4. Store in database (magic_link_tokens table)            │  │
│  │ 5. Build magic link URL                                   │  │
│  │ 6. Send email via Resend                                  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      v
┌─────────────────────────────────────────────────────────────────┐
│         Magic Link Utility (src/utils/magicLink.ts)              │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ sendMagicLinkEmail(email, url, apiKey)                    │  │
│  │   ├─ Initialize Resend client                             │  │
│  │   ├─ Get HTML template                                    │  │
│  │   ├─ Get plain text template                              │  │
│  │   └─ Send via Resend API                                  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      v
┌─────────────────────────────────────────────────────────────────┐
│       Email Template (src/templates/magicLinkEmail.ts)           │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ getMagicLinkEmailTemplate(magicLinkUrl)                   │  │
│  │   └─ Returns HTML with:                                   │  │
│  │       • Purple-blue gradient header                       │  │
│  │       • Welcome message                                   │  │
│  │       • Sign In button (with magic link)                  │  │
│  │       • Plain text link fallback                          │  │
│  │       • 15-minute expiration notice                       │  │
│  │       • Security footer                                   │  │
│  │                                                            │  │
│  │ getMagicLinkEmailPlainText(magicLinkUrl)                  │  │
│  │   └─ Returns plain text version                           │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      v
┌─────────────────────────────────────────────────────────────────┐
│                   Resend Email Service                           │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ • Sends email to user's inbox                             │  │
│  │ • Handles deliverability (SPF, DKIM, DMARC)               │  │
│  │ • Tracks delivery status                                  │  │
│  │ • Monitors bounces and spam reports                       │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      v
┌─────────────────────────────────────────────────────────────────┐
│                        User's Email Client                       │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Displays:                                                  │  │
│  │ ┌─────────────────────────────────────────────────────┐   │  │
│  │ │ [Kids Home Hub Header - Purple Gradient]            │   │  │
│  │ │                                                      │   │  │
│  │ │ Welcome back!                                        │   │  │
│  │ │                                                      │   │  │
│  │ │ We received a request to sign in...                 │   │  │
│  │ │                                                      │   │  │
│  │ │    ┌────────────────────────────────┐              │   │  │
│  │ │    │  Sign In to Kids Home Hub     │  [Button]    │   │  │
│  │ │    └────────────────────────────────┘              │   │  │
│  │ │                                                      │   │  │
│  │ │ Or copy and paste this link:                        │   │  │
│  │ │ [https://example.com/auth/verify?token=...]        │   │  │
│  │ │                                                      │   │  │
│  │ │ ⚠️  Security Notice: Expires in 15 minutes         │   │  │
│  │ │                                                      │   │  │
│  │ │ Didn't request this? Safely ignore this email.     │   │  │
│  │ └─────────────────────────────────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      v (User clicks link)
┌─────────────────────────────────────────────────────────────────┐
│              Frontend (redirectUrl + token + email)              │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Receives:                                                  │  │
│  │   • token (from URL param)                                │  │
│  │   • email (from URL param)                                │  │
│  │                                                            │  │
│  │ Sends POST to /v1/auth/verify:                            │  │
│  │   { email, token }                                        │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      v
┌─────────────────────────────────────────────────────────────────┐
│         Auth Handler - Verify (src/handlers/auth.ts)             │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 1. Validate token in database                             │  │
│  │ 2. Check not expired (< 15 minutes)                       │  │
│  │ 3. Check not already used                                 │  │
│  │ 4. Mark token as used                                     │  │
│  │ 5. Get or create user                                     │  │
│  │ 6. Create session token (JWT, 30 days)                    │  │
│  │ 7. Store session in database                              │  │
│  │ 8. Return session token to frontend                       │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      v
┌─────────────────────────────────────────────────────────────────┐
│                    User Successfully Logged In                   │
└─────────────────────────────────────────────────────────────────┘
```

## File Structure

```
apps/backend/
├── src/
│   ├── handlers/
│   │   └── auth.ts                    # Auth endpoints
│   ├── utils/
│   │   └── magicLink.ts               # Email sending logic
│   ├── templates/
│   │   ├── magicLinkEmail.ts          # HTML & plain text templates
│   │   └── README.md                  # Template documentation
│   └── types/
│       └── env.ts                     # Environment variables (RESEND_API_KEY)
│
├── email-preview.html                 # Browser preview of email
├── EMAIL_FLOW.md                      # This file
└── MAGIC_LINK_EMAIL_IMPLEMENTATION.md # Implementation details
```

## Data Flow

### 1. Request Magic Link
```http
POST /v1/auth/magic-link
Content-Type: application/json

{
  "email": "parent@example.com",
  "redirectUrl": "https://kids-home-hub.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Magic link sent to email"
}
```

### 2. Email Sent
```
From: Kids Home Hub <noreply@resend.dev>
To: parent@example.com
Subject: Sign in to Kids Home Hub

[Beautiful HTML email with magic link button]
```

### 3. User Clicks Link
```
URL: https://kids-home-hub.com/auth/verify?token=abc123...&email=parent@example.com
```

### 4. Verify Token
```http
POST /v1/auth/verify
Content-Type: application/json

{
  "email": "parent@example.com",
  "token": "abc123..."
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expiresAt": "2025-12-23T20:52:00.000Z",
  "user": {
    "id": "user-uuid",
    "email": "parent@example.com",
    "householdId": "household-uuid"
  }
}
```

## Database Tables

### magic_link_tokens
```sql
CREATE TABLE magic_link_tokens (
  id UUID PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### user_sessions
```sql
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  token TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  last_active_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Security Features

1. **Token Generation**
   - 32-character URL-safe token using nanoid
   - Cryptographically secure random generation

2. **Expiration**
   - Magic link expires in 15 minutes
   - Clearly communicated in email
   - Enforced by database query

3. **One-Time Use**
   - Token marked as used after verification
   - Prevents replay attacks

4. **Email Validation**
   - Format validation on request
   - Case-insensitive email storage

5. **Session Management**
   - JWT tokens with 30-day expiration
   - Stored in database for invalidation
   - Secure signing with JWT_SECRET

## Environment Variables

Required in Cloudflare Workers:

```bash
# Database
DATABASE_URL=postgresql://...

# JWT
JWT_SECRET=your-secret-key

# Email (Resend)
RESEND_API_KEY=re_...

# Magic Link (not currently used, but defined)
MAGIC_LINK_SECRET=your-magic-link-secret
```

## Email Template Customization

### Colors
Edit `src/templates/magicLinkEmail.ts`:
- Header gradient: `#667eea` to `#764ba2`
- Button: Same gradient
- Alert: `#fef3c7` background, `#f59e0b` border

### Text
All text is in the template file:
- Line 38-39: Greeting
- Line 40-42: Body text
- Line 53: Button text
- Line 80: Security notice

### Sender
Edit `src/utils/magicLink.ts` line 57:
```typescript
from: 'Kids Home Hub <noreply@your-domain.com>'
```

## Testing Checklist

- [ ] Send test email to Gmail
- [ ] Send test email to Outlook
- [ ] Send test email to Apple Mail
- [ ] Verify magic link click-through
- [ ] Test token expiration (wait 15 minutes)
- [ ] Test token reuse prevention
- [ ] Verify email rendering on mobile
- [ ] Check spam folder (shouldn't be there)
- [ ] Test invalid email format
- [ ] Test expired token handling

## Production Deployment

1. **Set up Resend**
   ```bash
   # Sign up at resend.com
   # Verify domain
   # Get API key
   ```

2. **Configure Secrets**
   ```bash
   wrangler secret put RESEND_API_KEY
   ```

3. **Update Sender Email**
   ```typescript
   // In src/utils/magicLink.ts
   from: 'Kids Home Hub <noreply@kids-home-hub.com>'
   ```

4. **Deploy**
   ```bash
   npm run build
   npm run deploy
   ```

5. **Monitor**
   - Check Resend dashboard for delivery stats
   - Monitor bounce rates
   - Track click-through rates

## Troubleshooting

### Email not received
- Check spam folder
- Verify Resend API key is correct
- Check Resend dashboard for errors
- Verify domain is verified in Resend

### Magic link expired
- Links expire in 15 minutes
- Request a new one

### Token already used
- Each token can only be used once
- Request a new magic link

### Email rendering issues
- Test in multiple clients
- Check inline CSS
- Verify table structure
- Use email testing tools (Litmus, Email on Acid)
