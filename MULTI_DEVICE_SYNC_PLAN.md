# Multi-Device Synchronization Plan
## Kids Home Hub PWA

---

## Executive Summary

The Kids Home Hub PWA currently has **significant multi-device infrastructure already in place** but is not yet fully implemented. This document outlines what exists, what's missing, and the plan to enable full multi-device synchronization.

---

## Current State Analysis

### ✅ What Already Exists

#### 1. **Authentication Infrastructure** (`src/lib/auth.ts`)
- ✅ Magic link passwordless authentication
- ✅ JWT token management
- ✅ Session persistence in localStorage
- ✅ Token refresh mechanism
- ✅ Logout and account deletion

#### 2. **Auth Store** (`src/stores/authStore.ts`)
- ✅ User state management with Preact Signals
- ✅ Loading and error states
- ✅ Computed properties (isAuthenticated, hasHousehold)
- ✅ Session initialization from localStorage

#### 3. **Database Layer** (`src/db/schema.ts`)
- ✅ IndexedDB schema using Dexie
- ✅ Transactions table
- ✅ Chore sessions table
- ✅ Sync queue for offline actions
- ✅ Conflict resolution table
- ✅ Metadata storage
- ✅ Device ID generation

#### 4. **API Client** (`src/api/client.ts`)
- ✅ Ky-based HTTP client with interceptors
- ✅ Automatic token injection
- ✅ Error handling
- ✅ Base URL configuration

#### 5. **Type Definitions** (Shared package)
- ✅ User type
- ✅ AuthSession type
- ✅ Transaction type
- ✅ MagicLinkRequest/Verification types

### ❌ What's Missing

#### 1. **Backend API Endpoints**
- ❌ No magic link sending endpoint (`POST /v1/auth/magic-link`)
- ❌ No verification endpoint (`POST /v1/auth/verify`)
- ❌ No user data CRUD endpoints
- ❌ No household management endpoints
- ❌ No sync endpoint

#### 2. **Database** (Neon PostgreSQL)
- ❌ No tables created
- ❌ No schema deployed
- ❌ No connection from Worker

#### 3. **UI Components**
- ❌ No login screen
- ❌ No account settings page
- ❌ No sync status indicator
- ❌ No migration wizard

#### 4. **Sync Logic**
- ❌ No sync service implementation
- ❌ No conflict resolution logic
- ❌ No background sync with service worker
- ❌ No data migration from localStorage to cloud

#### 5. **Integration**
- ❌ App doesn't check authentication status
- ❌ Stores don't sync to cloud
- ❌ No UI to trigger migration

---

## Architecture Design

### Overall Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEVICE A (Phone)                             │
├─────────────────────────────────────────────────────────────────┤
│  PWA App                                                        │
│  ├── User makes change (complete chore)                         │
│  ├── Update local state (optimistic UI)                         │
│  ├── Save to localStorage                                       │
│  ├── Queue in IndexedDB                                         │
│  └── Background sync to API                                     │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│               CLOUDFLARE WORKER (API)                           │
├─────────────────────────────────────────────────────────────────┤
│  ├── Receive change request                                     │
│  ├── Verify JWT token                                           │
│  ├── Validate data                                              │
│  ├── Write to Neon PostgreSQL                                   │
│  └── Return success/conflict                                    │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                 NEON DATABASE (PostgreSQL)                      │
├─────────────────────────────────────────────────────────────────┤
│  Tables:                                                        │
│  ├── users (email, created_at)                                  │
│  ├── households (name, owner_id)                                │
│  ├── children (household_id, name, balances)                    │
│  ├── chores (household_id, label, points)                       │
│  └── transactions (child_id, type, amount, timestamp)           │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DEVICE B (Tablet)                            │
├─────────────────────────────────────────────────────────────────┤
│  PWA App                                                        │
│  ├── Periodic sync check                                        │
│  ├── Fetch latest data from API                                 │
│  ├── Merge with local state                                     │
│  ├── Update UI                                                  │
│  └── Resolve conflicts (last-write-wins)                        │
└─────────────────────────────────────────────────────────────────┘
```

### Authentication Flow

```
┌──────────────┐
│ First-Time   │
│ User         │
└───────┬──────┘
        │
        ▼
┌─────────────────────────────┐
│ Complete Onboarding Locally │
│ (children, chores, data)    │
└───────┬─────────────────────┘
        │
        ▼
┌────────────────────────────────┐
│ Show: "Sync across devices?"  │
│ [Yes] [Maybe Later]            │
└───────┬────────────────────────┘
        │ Yes
        ▼
┌─────────────────────┐
│ Enter Email         │
│ [Send Magic Link]   │
└───────┬─────────────┘
        │
        ▼
┌──────────────────────────┐
│ "Check your email for    │
│  a magic link to login"  │
└───────┬──────────────────┘
        │
        ▼
┌─────────────────────┐
│ Click Link in Email │
└───────┬─────────────┘
        │
        ▼
┌─────────────────────────┐
│ Verify Token            │
│ Create User Account     │
│ Create Household        │
└───────┬─────────────────┘
        │
        ▼
┌──────────────────────────┐
│ Migrate Local Data       │
│ ├── Upload children      │
│ ├── Upload chores        │
│ └── Upload transactions  │
└───────┬──────────────────┘
        │
        ▼
┌──────────────────────┐
│ "✓ Synced!"          │
│ Mark local as synced │
└──────────────────────┘
```

### Sync Strategy: Optimistic UI + Background Sync

**When User Makes a Change:**

1. **Immediate** (0ms): Update local Preact Signal state
2. **Immediate** (0ms): Update UI shows new value
3. **Immediate** (0-50ms): Save to localStorage (fallback)
4. **Background** (50-100ms): Save to IndexedDB queue
5. **Background** (100ms-5s): POST to API endpoint
6. **On Success**: Mark as synced in IndexedDB
7. **On Failure**: Keep in queue, retry with exponential backoff

**Conflict Resolution:**

- Use **last-write-wins** based on timestamps
- Server timestamp is source of truth
- Client adjusts if server has newer data
- Conflicts stored in IndexedDB for review (future feature)

---

## Database Schema (Neon PostgreSQL)

### Complete SQL Schema

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Households table
CREATE TABLE households (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Household members (for multi-parent households)
CREATE TABLE household_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'parent', -- 'owner', 'parent', 'viewer'
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(household_id, user_id)
);

-- Children table
CREATE TABLE children (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar TEXT, -- Emoji or image URL
  money_total DECIMAL(10, 2) DEFAULT 0.00,
  points_total INTEGER DEFAULT 0,
  screen_total INTEGER DEFAULT 0, -- minutes
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Custom chores table
CREATE TABLE chores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  points INTEGER NOT NULL,
  icon TEXT, -- Emoji icon
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions table (unified for money, points, screen time)
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'money', 'points', 'screen_time'
  action TEXT NOT NULL, -- 'add', 'deduct', 'redeem', 'earn'
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT, -- 'GBP', 'AUD', etc. (for money transactions)
  reason TEXT,
  created_by UUID REFERENCES users(id),
  device_id TEXT, -- For tracking which device created it
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chore completions table
CREATE TABLE chore_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  chore_id UUID REFERENCES chores(id) ON DELETE SET NULL,
  chore_label TEXT NOT NULL, -- Denormalized for history
  points_earned INTEGER NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  week_start DATE NOT NULL, -- For weekly aggregation
  created_by UUID REFERENCES users(id)
);

-- Magic link tokens table
CREATE TABLE magic_link_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User sessions table
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  device_id TEXT,
  device_name TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_children_household ON children(household_id);
CREATE INDEX idx_children_updated ON children(updated_at DESC);
CREATE INDEX idx_chores_household ON chores(household_id);
CREATE INDEX idx_transactions_child ON transactions(child_id);
CREATE INDEX idx_transactions_created ON transactions(created_at DESC);
CREATE INDEX idx_chore_completions_child ON chore_completions(child_id);
CREATE INDEX idx_chore_completions_week ON chore_completions(week_start DESC);
CREATE INDEX idx_household_members_household ON household_members(household_id);
CREATE INDEX idx_household_members_user ON household_members(user_id);
CREATE INDEX idx_magic_tokens_email ON magic_link_tokens(email);
CREATE INDEX idx_magic_tokens_expires ON magic_link_tokens(expires_at);
CREATE INDEX idx_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_sessions_token ON user_sessions(token);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_households_updated_at BEFORE UPDATE ON households
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_children_updated_at BEFORE UPDATE ON children
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chores_updated_at BEFORE UPDATE ON chores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE chores ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chore_completions ENABLE ROW LEVEL SECURITY;

-- Note: Actual RLS policies depend on your auth implementation
-- Example policy (adjust based on your auth context function):
-- CREATE POLICY households_access_policy ON households
--   FOR ALL
--   USING (
--     owner_id = current_user_id() OR
--     id IN (SELECT household_id FROM household_members WHERE user_id = current_user_id())
--   );
```

---

## API Endpoints Specification

All endpoints are prefixed with `/v1/`

### Authentication Endpoints

#### `POST /v1/auth/magic-link`
**Request:**
```typescript
{
  email: string;
  redirectUrl: string;
}
```

**Response:**
```typescript
{
  message: "Magic link sent to email";
}
```

#### `POST /v1/auth/verify`
**Request:**
```typescript
{
  token: string;
  email: string;
}
```

**Response:**
```typescript
{
  token: string; // JWT
  expiresAt: number; // Timestamp
  user: {
    id: string;
    email: string;
    householdId?: string;
    created_at: string;
  };
}
```

#### `POST /v1/auth/refresh`
**Headers:** `Authorization: Bearer <token>`

**Response:**
```typescript
{
  token: string;
  expiresAt: number;
}
```

#### `POST /v1/auth/logout`
**Headers:** `Authorization: Bearer <token>`

**Response:**
```typescript
{
  message: "Logged out successfully";
}
```

### Household Endpoints

#### `GET /v1/households`
Get user's households

**Headers:** `Authorization: Bearer <token>`

**Response:**
```typescript
{
  households: Array<{
    id: string;
    name: string;
    role: 'owner' | 'parent' | 'viewer';
    createdAt: string;
  }>;
}
```

#### `POST /v1/households`
Create new household

**Headers:** `Authorization: Bearer <token>`

**Request:**
```typescript
{
  name: string;
  children: Array<{ name: string; avatar: string }>;
  chores?: Array<{ label: string; points: number }>;
}
```

**Response:**
```typescript
{
  household: {
    id: string;
    name: string;
    children: Array<Child>;
    chores: Array<Chore>;
  };
}
```

### Children Endpoints

#### `GET /v1/households/:householdId/children`
**Headers:** `Authorization: Bearer <token>`

**Response:**
```typescript
{
  children: Array<{
    id: string;
    name: string;
    avatar: string;
    moneyTotal: number;
    pointsTotal: number;
    screenTotal: number;
    updatedAt: string;
  }>;
}
```

#### `POST /v1/households/:householdId/children`
**Headers:** `Authorization: Bearer <token>`

**Request:**
```typescript
{
  name: string;
  avatar: string;
}
```

#### `PATCH /v1/children/:childId`
**Headers:** `Authorization: Bearer <token>`

**Request:**
```typescript
{
  name?: string;
  avatar?: string;
  moneyTotal?: number;
  pointsTotal?: number;
  screenTotal?: number;
}
```

### Transactions Endpoints

#### `POST /v1/transactions`
**Headers:** `Authorization: Bearer <token>`

**Request:**
```typescript
{
  childId: string;
  type: 'money' | 'points' | 'screen_time';
  action: 'add' | 'deduct' | 'redeem';
  amount: number;
  currency?: string;
  reason?: string;
  deviceId?: string;
}
```

#### `GET /v1/children/:childId/transactions`
**Headers:** `Authorization: Bearer <token>`

**Query:** `?since=<timestamp>&limit=<number>`

**Response:**
```typescript
{
  transactions: Array<Transaction>;
}
```

### Sync Endpoint

#### `POST /v1/sync`
Full data sync for multi-device

**Headers:** `Authorization: Bearer <token>`

**Request:**
```typescript
{
  lastSyncedAt?: number; // Client's last sync timestamp
  changes?: {
    children?: Array<Partial<Child>>;
    chores?: Array<Partial<Chore>>;
    transactions?: Array<Transaction>;
  };
}
```

**Response:**
```typescript
{
  household: {
    id: string;
    name: string;
    updatedAt: string;
  };
  children: Array<Child>;
  chores: Array<Chore>;
  transactions: Array<Transaction>; // Since lastSyncedAt
  conflicts?: Array<{
    type: string;
    localVersion: any;
    remoteVersion: any;
  }>;
  serverTime: number;
}
```

---

## Implementation Roadmap

### Phase 1: Database Setup (1-2 hours)

- [x] Connect to Neon database
- [ ] Run SQL schema creation script
- [ ] Verify tables created
- [ ] Test basic queries
- [ ] Set up RLS policies

### Phase 2: Backend API Implementation (1-2 days)

**In Cloudflare Worker:**

1. Install dependencies
   ```bash
   npm install @neondatabase/serverless
   npm install jsonwebtoken
   npm install @types/jsonwebtoken
   ```

2. Create database connection utility
3. Implement auth endpoints:
   - `POST /v1/auth/magic-link` - Send email with token
   - `POST /v1/auth/verify` - Verify token, create session
   - `POST /v1/auth/refresh` - Refresh JWT
   - `POST /v1/auth/logout` - Invalidate session

4. Implement household endpoints:
   - `GET /v1/households`
   - `POST /v1/households`

5. Implement children endpoints:
   - `GET /v1/households/:id/children`
   - `POST /v1/households/:id/children`
   - `PATCH /v1/children/:id`

6. Implement transactions endpoints:
   - `POST /v1/transactions`
   - `GET /v1/children/:id/transactions`

7. Implement sync endpoint:
   - `POST /v1/sync`

### Phase 3: Frontend UI Components (2-3 days)

1. **Login Screen** (`src/components/auth/LoginScreen.tsx`)
   - Email input
   - Send magic link button
   - "Continue as guest" option
   - Loading states

2. **Magic Link Verification** (`src/components/auth/VerifyMagicLink.tsx`)
   - Auto-verify on page load with token in URL
   - Show success/error
   - Redirect to app

3. **Migration Wizard** (`src/components/migration/MigrationWizard.tsx`)
   - Step 1: Explain benefits of syncing
   - Step 2: Login/signup
   - Step 3: Upload progress
   - Step 4: Success confirmation

4. **Sync Indicator** (`src/components/common/SyncIndicator.tsx`)
   - Syncing spinner
   - Synced checkmark
   - Error state
   - Offline indicator

5. **Account Settings** (`src/views/SettingsView.tsx`)
   - View email
   - Logout button
   - Delete account (with confirmation)
   - Sync status
   - Last synced time

### Phase 4: Sync Service Implementation (2-3 days)

1. **Sync Manager** (`src/services/syncManager.ts`)
   - Background sync scheduler
   - Conflict resolution
   - Retry logic with exponential backoff
   - Queue management

2. **Update Stores** to use sync:
   - `childrenStore.ts` - Sync on setChildren, updateChild
   - `customChoresStore.ts` - Sync on add/update/delete
   - Transaction stores - Auto-sync on create

3. **Service Worker** integration:
   - Background sync API
   - Periodic sync (every 15 minutes when active)
   - On reconnect sync

### Phase 5: Migration & Integration (1-2 days)

1. Implement data migration from localStorage to cloud
2. Update app.tsx to check auth status
3. Show migration wizard after onboarding
4. Handle "guest mode" vs "authenticated mode"
5. Test complete flow

### Phase 6: Testing & Polish (2-3 days)

1. **Multi-device testing:**
   - Login on Device A, make changes
   - Login on Device B, verify synced
   - Offline changes sync when back online
   - Simultaneous changes resolve correctly

2. **Edge cases:**
   - Network failures
   - Token expiration
   - Conflict resolution
   - Large data sets
   - Slow connections

3. **Performance:**
   - Optimize sync frequency
   - Reduce API calls
   - Batch updates
   - IndexedDB query optimization

4. **Security audit:**
   - Verify RLS policies work
   - Test JWT expiration
   - Ensure data isolation between households
   - Rate limiting

---

## Security Considerations

### Authentication
- ✅ Magic links expire after 15 minutes
- ✅ JWT tokens expire after 7 days
- ✅ Tokens stored securely in localStorage (https only)
- ✅ Auto-refresh before expiration

### Data Isolation
- ✅ RLS policies ensure users only see their household data
- ✅ All API endpoints verify household membership
- ✅ Foreign key constraints prevent orphaned data

### API Security
- ✅ Rate limiting on auth endpoints (prevent brute force)
- ✅ Input validation on all endpoints
- ✅ SQL injection prevention (parameterized queries)
- ✅ CORS configured for PWA domain only

### Privacy
- ✅ No sensitive data logged
- ✅ Email verification (optional but recommended)
- ✅ Account deletion removes all data
- ✅ GDPR compliant (data export on request)

---

## Testing Multi-Device Sync

### Test Scenario 1: Fresh Setup on Two Devices

**Device A (Phone):**
1. Open app → Complete onboarding
2. Add 2 children: Emma, Oliver
3. Create 3 custom chores
4. Tap "Sync across devices"
5. Enter email: parent@example.com
6. Check email → Click magic link
7. Return to app → See "✓ Synced!"

**Device B (Tablet):**
1. Open app → See login screen
2. Enter email: parent@example.com
3. Check email → Click magic link
4. Verify sees Emma & Oliver
5. Verify sees 3 custom chores
6. Verify all balances match Device A

### Test Scenario 2: Simultaneous Changes

**Device A:**
1. Complete chore "Tidy bedroom" for Emma
2. Emma gains 10 points
3. Go offline (airplane mode)

**Device B:**
1. Add £5 to Emma's bank
2. Verify syncs to cloud

**Device A:**
1. Go online
2. Background sync triggers
3. Verify Emma has both points AND money
4. No data loss

### Test Scenario 3: Conflict Resolution

**Device A (offline):**
1. Add 100 points to Oliver
2. Deduct 50 points from Oliver
3. Net: +50 points

**Device B (online):**
1. Add 30 points to Oliver
2. Syncs immediately

**Device A (comes online):**
1. Syncs queued changes
2. Server resolves: +30 + 50 = +80 total
3. Both devices show same final state

---

## Migration Strategy for Existing Users

### Detect Existing Local Data

```typescript
const hasLocalData = () => {
  const children = localStorage.getItem('children');
  const chores = localStorage.getItem('custom_chores');
  return children || chores;
};
```

### Show Migration Prompt

After user completes onboarding OR on app launch:

```typescript
if (hasLocalData() && !isAuthenticated() && !localStorage.getItem('migration_dismissed')) {
  showMigrationWizard();
}
```

### Migration Flow

1. **User clicks "Sync my data"**
2. Show login screen
3. After login, show upload progress
4. Upload children → Upload chores → Upload transactions
5. Mark as migrated: `localStorage.setItem('migrated_to_cloud', 'true')`
6. Show success screen
7. Clear old localStorage keys (optional, can keep as backup)

### Handle "Maybe Later"

```typescript
localStorage.setItem('migration_dismissed', 'true');
// Show again in 7 days
setTimeout(() => {
  localStorage.removeItem('migration_dismissed');
}, 7 * 24 * 60 * 60 * 1000);
```

---

## Next Steps

### Immediate Actions

1. ✅ Create this planning document
2. [ ] Connect to Neon database and run schema SQL
3. [ ] Implement auth endpoints in Worker
4. [ ] Create login screen component
5. [ ] Test magic link flow end-to-end
6. [ ] Implement sync service
7. [ ] Build migration wizard
8. [ ] Test on multiple devices

### Future Enhancements

- **Invite family members** - Share household with partner
- **Child accounts** - Limited views for kids
- **Push notifications** - Notify on points earned
- **Export data** - Download as CSV/JSON
- **Import data** - From other apps
- **Webhooks** - Integrate with smart home
- **Analytics dashboard** - Weekly reports

---

## Cost Estimate

### Neon Database
- Free tier: 0.5 GB storage, 3 GB data transfer/month
- Typical usage: ~100 KB per household
- **Cost:** $0/month (fits in free tier for 100s of users)

### Cloudflare Workers
- Free tier: 100,000 requests/day
- Typical usage: 10-20 requests per active user per day
- **Cost:** $0/month (fits in free tier for 1000s of users)

### Total Infrastructure Cost
**$0/month** for first few thousand users

---

## Conclusion

The Kids Home Hub PWA has a **strong foundation** for multi-device sync already in place. The main tasks remaining are:

1. **Database setup** - Run SQL schema (1 hour)
2. **Backend implementation** - Build API endpoints (2 days)
3. **UI components** - Login, settings, migration (2 days)
4. **Integration** - Connect everything together (2 days)
5. **Testing** - Multi-device testing (1 day)

**Total effort: ~7-8 days of development**

Once complete, users will be able to:
- ✅ Sign in with magic link (passwordless)
- ✅ Access data from any device
- ✅ Changes sync in real-time
- ✅ Work offline, sync when reconnected
- ✅ Share household with partner
- ✅ Never lose data (cloud backup)

This transforms the PWA from a single-device app to a **true multi-device family management platform**.
