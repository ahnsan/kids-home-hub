# Kids Home Hub - Supabase Migration Plan

**Date**: 2025-11-24
**Status**: Planning Phase
**Migration Type**: Cloudflare Workers + Neon PostgreSQL → Supabase (Backend + Auth)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current vs Target Architecture](#current-vs-target-architecture)
3. [Migration Strategy](#migration-strategy)
4. [Database Schema Migration](#database-schema-migration)
5. [Row Level Security (RLS) Policies](#row-level-security-rls-policies)
6. [Authentication Migration](#authentication-migration)
7. [API Migration Strategy](#api-migration-strategy)
8. [Frontend Integration Changes](#frontend-integration-changes)
9. [Step-by-Step Implementation Plan](#step-by-step-implementation-plan)
10. [Testing Strategy](#testing-strategy)
11. [Risk Assessment](#risk-assessment)
12. [Rollback Plan](#rollback-plan)
13. [Timeline & Effort Estimates](#timeline--effort-estimates)

---

## Executive Summary

This document outlines a comprehensive migration plan to transition the Kids Home Hub application from:
- **Current Stack**: Cloudflare Workers (Hono) + Neon PostgreSQL + Custom Magic Link Auth (Resend)
- **Target Stack**: Supabase (PostgreSQL + Auth + Real-time) + Direct Supabase Client

### Key Benefits
- **Simplified Architecture**: Replace custom auth and API with Supabase's built-in features
- **Built-in Magic Links**: Native magic link support via Supabase Auth
- **Row Level Security**: Automatic authorization via RLS policies
- **Real-time Capabilities**: Instant multi-device sync (future enhancement)
- **Reduced Infrastructure**: Eliminate Cloudflare Workers, Neon DB, Resend dependencies
- **Better DX**: Supabase client provides type-safe queries and mutations

### Migration Approach
- **Branch-based Migration**: Feature branch `feature/supabase-migration` for parallel development
- **Incremental Migration**: Migrate component by component to reduce risk
- **Dual-stack Period**: Keep Cloudflare version intact during development
- **Zero-data Migration**: No existing user data to migrate (fresh start acceptable)

---

## Current vs Target Architecture

### Current Architecture (Cloudflare Workers + Neon)

```
┌─────────────┐
│   PWA       │
│  (Preact)   │
└──────┬──────┘
       │ HTTP (Ky)
       │ JWT Bearer Token
       │
┌──────▼────────────────────┐
│  Cloudflare Workers       │
│  (Hono Framework)         │
│                           │
│  ┌─────────────────────┐  │
│  │ Custom Auth         │  │
│  │ - Magic Links       │  │
│  │ - JWT (jose)        │  │
│  │ - Resend Email      │  │
│  └─────────────────────┘  │
│                           │
│  ┌─────────────────────┐  │
│  │ REST API Handlers   │  │
│  │ - Households        │  │
│  │ - Children          │  │
│  │ - Chores            │  │
│  │ - Transactions      │  │
│  │ - Sync              │  │
│  └─────────────────────┘  │
└───────┬───────────────────┘
        │ @neondatabase/serverless
        │
┌───────▼───────────────────┐
│  Neon PostgreSQL          │
│  (eu-west-2)              │
│                           │
│  - users                  │
│  - magic_link_tokens      │
│  - user_sessions          │
│  - households             │
│  - household_members      │
│  - children               │
│  - chores                 │
│  - transactions           │
│  - chore_completions      │
└───────────────────────────┘
```

### Target Architecture (Supabase)

```
┌─────────────┐
│   PWA       │
│  (Preact)   │
└──────┬──────┘
       │ @supabase/supabase-js
       │ JWT (Supabase Session)
       │
┌──────▼────────────────────┐
│  Supabase Platform        │
│  (qojanjzukgkkrqmnyaai)   │
│                           │
│  ┌─────────────────────┐  │
│  │ Supabase Auth       │  │
│  │ - Magic Links       │  │
│  │ - JWT Tokens        │  │
│  │ - Email (Built-in)  │  │
│  │ - auth.users        │  │
│  └─────────────────────┘  │
│                           │
│  ┌─────────────────────┐  │
│  │ PostgREST API       │  │
│  │ (Auto-generated)    │  │
│  │ - Direct DB access  │  │
│  │ - RLS enforced      │  │
│  └─────────────────────┘  │
│                           │
│  ┌─────────────────────┐  │
│  │ PostgreSQL DB       │  │
│  │ (Supabase)          │  │
│  │                     │  │
│  │ - auth.users        │  │  (managed by Supabase)
│  │ - households        │  │
│  │ - household_members │  │
│  │ - children          │  │
│  │ - chores            │  │
│  │ - transactions      │  │
│  │ - chore_completions │  │
│  └─────────────────────┘  │
│                           │
│  ┌─────────────────────┐  │
│  │ Realtime (Future)   │  │
│  │ - Live sync         │  │
│  │ - Broadcast         │  │
│  └─────────────────────┘  │
└───────────────────────────┘
```

### Key Architectural Changes

| Component | Current | Target | Impact |
|-----------|---------|--------|--------|
| **Backend Framework** | Cloudflare Workers (Hono) | Supabase (PostgREST) | Eliminate custom API code |
| **Database** | Neon PostgreSQL | Supabase PostgreSQL | Migrate schema + add RLS |
| **Authentication** | Custom JWT + Magic Links | Supabase Auth | Replace auth handlers |
| **Email Provider** | Resend | Supabase (SMTP) | Configure Supabase SMTP |
| **API Client** | Ky + Custom endpoints | @supabase/supabase-js | Replace all API calls |
| **Authorization** | Manual checks in handlers | RLS Policies | Automatic via policies |
| **Multi-device Sync** | Custom sync endpoint | Supabase Realtime | Future enhancement |
| **Session Storage** | Custom user_sessions table | auth.sessions (Supabase) | Use Supabase session mgmt |

---

## Migration Strategy

### Approach: Parallel Development with Feature Branch

1. **Create Feature Branch**: `feature/supabase-migration`
2. **Keep Main Branch Intact**: Cloudflare version remains deployable
3. **Incremental Migration**: Migrate one component at a time
4. **Testing at Each Step**: Validate functionality before proceeding
5. **Final Cutover**: Merge to main when complete and tested

### Migration Order

```
Phase 1: Foundation
├── 1. Create Supabase project schema
├── 2. Configure RLS policies
├── 3. Set up Supabase Auth (magic links)
└── 4. Configure environment variables

Phase 2: Backend Migration
├── 5. Remove Cloudflare Workers code
├── 6. Replace API client with Supabase client
└── 7. Update all API calls to use Supabase

Phase 3: Frontend Integration
├── 8. Migrate authentication flows
├── 9. Update household/children/chores components
├── 10. Replace transaction logic
└── 11. Update sync mechanism

Phase 4: Testing & Validation
├── 12. End-to-end testing
├── 13. Multi-device sync validation
├── 14. Performance testing
└── 15. Security audit

Phase 5: Deployment
├── 16. Deploy to Supabase
├── 17. Update environment variables
├── 18. DNS/routing changes (if needed)
└── 19. Monitor and validate
```

---

## Database Schema Migration

### Schema Changes Required

#### 1. Remove Custom Auth Tables
These tables are replaced by Supabase's `auth.users` and `auth.sessions`:
- ❌ `users` → Replaced by `auth.users` (managed by Supabase)
- ❌ `magic_link_tokens` → Handled by Supabase Auth
- ❌ `user_sessions` → Replaced by `auth.sessions`

#### 2. Update Foreign Key References
All `user_id` foreign keys need to reference `auth.users`:
```sql
-- OLD: references users(id)
-- NEW: references auth.users(id)
```

#### 3. Add User Profiles Table (Optional)
If you need additional user metadata:
```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Complete Supabase Schema Migration SQL

Save this as `/Users/Karim/kids-home-hub/supabase/migrations/20251124000000_initial_schema.sql`:

```sql
-- =============================================
-- Kids Home Hub - Supabase Schema Migration
-- =============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- USER PROFILES (Optional - for extra metadata)
-- =============================================
-- Note: auth.users is managed by Supabase
-- Only create this if you need additional user data beyond what auth.users provides

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- HOUSEHOLDS & MEMBERS
-- =============================================

CREATE TABLE IF NOT EXISTS households (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL DEFAULT 'My Household',
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS household_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'parent', -- 'owner', 'parent', 'viewer'
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(household_id, user_id)
);

-- =============================================
-- CHILDREN & CHORES
-- =============================================

CREATE TABLE IF NOT EXISTS children (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar TEXT,
  money_total DECIMAL(10, 2) DEFAULT 0.00,
  points_total INTEGER DEFAULT 0,
  screen_total INTEGER DEFAULT 0,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  points INTEGER NOT NULL,
  icon TEXT,
  category TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TRANSACTIONS & COMPLETIONS
-- =============================================

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('money', 'points', 'screen_time')),
  action TEXT NOT NULL CHECK (action IN ('add', 'deduct', 'redeem', 'earn')),
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT,
  reason TEXT,
  created_by UUID REFERENCES auth.users(id),
  device_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chore_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  chore_id UUID REFERENCES chores(id) ON DELETE SET NULL,
  chore_label TEXT NOT NULL,
  points_earned INTEGER NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  week_start DATE NOT NULL,
  created_by UUID REFERENCES auth.users(id)
);

-- =============================================
-- INDEXES
-- =============================================

-- Households
CREATE INDEX IF NOT EXISTS idx_households_created_by ON households(created_by);
CREATE INDEX IF NOT EXISTS idx_household_members_household ON household_members(household_id);
CREATE INDEX IF NOT EXISTS idx_household_members_user ON household_members(user_id);

-- Children & Chores
CREATE INDEX IF NOT EXISTS idx_children_household ON children(household_id);
CREATE INDEX IF NOT EXISTS idx_children_updated ON children(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_chores_household ON chores(household_id);
CREATE INDEX IF NOT EXISTS idx_chores_category ON chores(category) WHERE category IS NOT NULL;

-- Transactions
CREATE INDEX IF NOT EXISTS idx_transactions_child ON transactions(child_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);

-- Completions
CREATE INDEX IF NOT EXISTS idx_chore_completions_child ON chore_completions(child_id);
CREATE INDEX IF NOT EXISTS idx_chore_completions_week ON chore_completions(week_start DESC);
CREATE INDEX IF NOT EXISTS idx_chore_completions_date ON chore_completions(completed_at DESC);

-- =============================================
-- TRIGGERS
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_households_updated_at
  BEFORE UPDATE ON households
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_children_updated_at
  BEFORE UPDATE ON children
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chores_updated_at
  BEFORE UPDATE ON chores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Create default chores for a household
CREATE OR REPLACE FUNCTION create_default_chores(household_uuid UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO chores (household_id, label, points, icon, category, is_default) VALUES
    (household_uuid, 'Tidy bedroom', 10, '🛏️', 'cleaning', TRUE),
    (household_uuid, 'Finish homework', 8, '📚', 'homework', TRUE),
    (household_uuid, 'Set / clear the table', 5, '🍽️', 'helping', TRUE),
    (household_uuid, 'Feed pet / help pet', 6, '🐕', 'pets', TRUE),
    (household_uuid, 'Help with laundry', 7, '👕', 'helping', TRUE);
END;
$$ LANGUAGE plpgsql;

-- Trigger to create user profile on auth.users insert
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- =============================================
-- VIEWS
-- =============================================

CREATE OR REPLACE VIEW household_summary AS
SELECT
  h.id AS household_id,
  h.name AS household_name,
  h.created_by,
  COUNT(DISTINCT c.id) AS children_count,
  COUNT(DISTINCT ch.id) AS chores_count,
  h.created_at,
  h.updated_at
FROM households h
LEFT JOIN children c ON c.household_id = h.id
LEFT JOIN chores ch ON ch.household_id = h.id
GROUP BY h.id, h.name, h.created_by, h.created_at, h.updated_at;

CREATE OR REPLACE VIEW child_balances AS
SELECT
  c.id,
  c.household_id,
  c.name,
  c.avatar,
  c.money_total,
  c.points_total,
  c.screen_total,
  (
    SELECT COUNT(*)
    FROM chore_completions cc
    WHERE cc.child_id = c.id
      AND cc.completed_at > NOW() - INTERVAL '7 days'
  ) AS chores_this_week,
  (
    SELECT SUM(points_earned)
    FROM chore_completions cc
    WHERE cc.child_id = c.id
      AND cc.completed_at > NOW() - INTERVAL '7 days'
  ) AS points_this_week,
  c.updated_at AS last_updated
FROM children c;
```

---

## Row Level Security (RLS) Policies

Supabase uses PostgreSQL's Row Level Security (RLS) to automatically enforce authorization. The authenticated user's JWT contains `auth.uid()` which we use in policies.

### RLS Migration SQL

Save this as `/Users/Karim/kids-home-hub/supabase/migrations/20251124000001_rls_policies.sql`:

```sql
-- =============================================
-- Kids Home Hub - RLS Policies
-- =============================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE chores ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chore_completions ENABLE ROW LEVEL SECURITY;

-- =============================================
-- USER PROFILES POLICIES
-- =============================================

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- =============================================
-- HOUSEHOLDS POLICIES
-- =============================================

-- Users can read households they own or are members of
CREATE POLICY "Users can read own households"
  ON households FOR SELECT
  USING (
    auth.uid() = created_by OR
    id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

-- Users can create households
CREATE POLICY "Users can create households"
  ON households FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Only household owners can update
CREATE POLICY "Owners can update households"
  ON households FOR UPDATE
  USING (auth.uid() = created_by);

-- Only household owners can delete
CREATE POLICY "Owners can delete households"
  ON households FOR DELETE
  USING (auth.uid() = created_by);

-- =============================================
-- HOUSEHOLD MEMBERS POLICIES
-- =============================================

-- Users can read members of households they belong to
CREATE POLICY "Users can read household members"
  ON household_members FOR SELECT
  USING (
    household_id IN (
      SELECT id FROM households WHERE created_by = auth.uid()
      UNION
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

-- Owners can add members
CREATE POLICY "Owners can add members"
  ON household_members FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT id FROM households WHERE created_by = auth.uid()
    )
  );

-- Owners can remove members
CREATE POLICY "Owners can remove members"
  ON household_members FOR DELETE
  USING (
    household_id IN (
      SELECT id FROM households WHERE created_by = auth.uid()
    )
  );

-- =============================================
-- CHILDREN POLICIES
-- =============================================

-- Users can read children in their households
CREATE POLICY "Users can read children"
  ON children FOR SELECT
  USING (
    household_id IN (
      SELECT id FROM households WHERE created_by = auth.uid()
      UNION
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

-- Owners and parents can create children
CREATE POLICY "Owners/parents can create children"
  ON children FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT id FROM households WHERE created_by = auth.uid()
      UNION
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'parent')
    )
  );

-- Owners and parents can update children
CREATE POLICY "Owners/parents can update children"
  ON children FOR UPDATE
  USING (
    household_id IN (
      SELECT id FROM households WHERE created_by = auth.uid()
      UNION
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'parent')
    )
  );

-- Owners and parents can delete children
CREATE POLICY "Owners/parents can delete children"
  ON children FOR DELETE
  USING (
    household_id IN (
      SELECT id FROM households WHERE created_by = auth.uid()
      UNION
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'parent')
    )
  );

-- =============================================
-- CHORES POLICIES
-- =============================================

-- Users can read chores in their households
CREATE POLICY "Users can read chores"
  ON chores FOR SELECT
  USING (
    household_id IN (
      SELECT id FROM households WHERE created_by = auth.uid()
      UNION
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

-- Owners/parents can create chores
CREATE POLICY "Owners/parents can create chores"
  ON chores FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT id FROM households WHERE created_by = auth.uid()
      UNION
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'parent')
    )
  );

-- Owners/parents can update chores
CREATE POLICY "Owners/parents can update chores"
  ON chores FOR UPDATE
  USING (
    household_id IN (
      SELECT id FROM households WHERE created_by = auth.uid()
      UNION
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'parent')
    )
  );

-- Owners/parents can delete custom chores (not default)
CREATE POLICY "Owners/parents can delete custom chores"
  ON chores FOR DELETE
  USING (
    is_default = FALSE AND
    household_id IN (
      SELECT id FROM households WHERE created_by = auth.uid()
      UNION
      SELECT household_id FROM household_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'parent')
    )
  );

-- =============================================
-- TRANSACTIONS POLICIES
-- =============================================

-- Users can read transactions for children in their households
CREATE POLICY "Users can read transactions"
  ON transactions FOR SELECT
  USING (
    child_id IN (
      SELECT c.id FROM children c
      WHERE c.household_id IN (
        SELECT id FROM households WHERE created_by = auth.uid()
        UNION
        SELECT household_id FROM household_members WHERE user_id = auth.uid()
      )
    )
  );

-- Owners/parents can create transactions
CREATE POLICY "Owners/parents can create transactions"
  ON transactions FOR INSERT
  WITH CHECK (
    child_id IN (
      SELECT c.id FROM children c
      WHERE c.household_id IN (
        SELECT id FROM households WHERE created_by = auth.uid()
        UNION
        SELECT household_id FROM household_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'parent')
      )
    )
  );

-- =============================================
-- CHORE COMPLETIONS POLICIES
-- =============================================

-- Users can read completions for children in their households
CREATE POLICY "Users can read chore completions"
  ON chore_completions FOR SELECT
  USING (
    child_id IN (
      SELECT c.id FROM children c
      WHERE c.household_id IN (
        SELECT id FROM households WHERE created_by = auth.uid()
        UNION
        SELECT household_id FROM household_members WHERE user_id = auth.uid()
      )
    )
  );

-- Owners/parents can create completions
CREATE POLICY "Owners/parents can create chore completions"
  ON chore_completions FOR INSERT
  WITH CHECK (
    child_id IN (
      SELECT c.id FROM children c
      WHERE c.household_id IN (
        SELECT id FROM households WHERE created_by = auth.uid()
        UNION
        SELECT household_id FROM household_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'parent')
      )
    )
  );
```

---

## Authentication Migration

### Current Auth Flow (Custom Magic Link)

```
1. User enters email → POST /v1/auth/magic-link
2. Backend generates token → Stores in magic_link_tokens
3. Backend sends email via Resend
4. User clicks link → Redirects to PWA with token
5. PWA sends token → POST /v1/auth/verify
6. Backend verifies token → Creates user_sessions record
7. Backend returns JWT → Signed with JWT_SECRET
8. PWA stores JWT in localStorage
9. Subsequent requests → Authorization: Bearer {JWT}
```

### Target Auth Flow (Supabase Auth)

```
1. User enters email → supabase.auth.signInWithOtp({ email })
2. Supabase sends magic link email (via configured SMTP)
3. User clicks link → Supabase verifies and creates session
4. Supabase redirects to PWA with session
5. PWA automatically has session → supabase.auth.getSession()
6. Subsequent requests → Supabase client auto-includes JWT
7. RLS policies automatically enforce authorization
```

### Authentication Code Changes

#### Install Supabase Client

```bash
cd /Users/Karim/kids-home-hub/apps/pwa
pnpm add @supabase/supabase-js
```

#### Create Supabase Client

Create `/Users/Karim/kids-home-hub/apps/pwa/src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Type helper for database
export type Database = {
  public: {
    Tables: {
      households: {
        Row: {
          id: string;
          name: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['households']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['households']['Insert']>;
      };
      // ... add other tables
    };
  };
};
```

#### Replace Auth Service

Update `/Users/Karim/kids-home-hub/apps/pwa/src/lib/auth.ts`:

```typescript
/**
 * Authentication service - Supabase version
 */

import { supabase } from './supabase';
import type { User, Session } from '@supabase/supabase-js';

/**
 * Send magic link to email
 */
export async function sendMagicLink(email: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: window.location.origin,
    },
  });

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Get current session
 */
export async function getSession(): Promise<Session | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

/**
 * Get current user
 */
export async function getCurrentUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session !== null;
}

/**
 * Logout user
 */
export async function logout(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('[Auth] Logout error:', error);
    throw error;
  }
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(callback: (session: Session | null) => void) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });

  return () => subscription.unsubscribe();
}

/**
 * Dev login (for development - creates user if not exists)
 */
export async function devLogin(email: string): Promise<void> {
  // In development, you can use Supabase's test OTP feature
  // Or manually create a user in Supabase dashboard
  await sendMagicLink(email);
}
```

### Supabase Auth Configuration

1. **Enable Magic Link Auth** in Supabase Dashboard:
   - Go to Authentication > Providers
   - Enable "Email" provider
   - Enable "Confirm email" toggle
   - Configure "Magic Link" option

2. **Configure Email Templates**:
   - Go to Authentication > Email Templates
   - Customize "Magic Link" template
   - Use your branding

3. **Set Redirect URLs**:
   - Go to Authentication > URL Configuration
   - Add redirect URLs:
     - `http://localhost:3000` (development)
     - `https://your-production-domain.com` (production)

4. **Optional: Custom SMTP**:
   - Go to Project Settings > Auth
   - Configure custom SMTP server
   - Use Resend or other provider if needed

---

## API Migration Strategy

### Decision: Direct Supabase Client vs Edge Functions

**Recommendation**: Use Direct Supabase Client (no Edge Functions needed)

**Rationale**:
- ✅ **Simpler**: No need to deploy/manage Edge Functions
- ✅ **Type-safe**: Supabase client provides full TypeScript support
- ✅ **RLS Enforced**: Authorization handled automatically by policies
- ✅ **Real-time Ready**: Easy to add Supabase Realtime later
- ✅ **Less Code**: Replace all API handlers with simple queries

**When to Use Edge Functions**:
- ❌ Complex business logic that shouldn't be in frontend
- ❌ Third-party API integrations
- ❌ Scheduled jobs/cron tasks
- ✅ **Not needed for this app** - all logic can be in RLS policies + triggers

### API Migration Mapping

| Current Endpoint | Supabase Replacement | Notes |
|-----------------|---------------------|-------|
| `POST /v1/auth/magic-link` | `supabase.auth.signInWithOtp()` | Built-in |
| `POST /v1/auth/verify` | Automatic after email click | No code needed |
| `POST /v1/auth/logout` | `supabase.auth.signOut()` | Built-in |
| `POST /v1/auth/refresh` | Automatic token refresh | No code needed |
| `GET /v1/households` | `supabase.from('households').select()` | RLS filters automatically |
| `POST /v1/households` | `supabase.from('households').insert()` | Trigger creates default chores |
| `GET /v1/households/:id` | `supabase.from('households').select().eq('id', id).single()` | RLS enforces access |
| `PATCH /v1/households/:id` | `supabase.from('households').update().eq('id', id)` | RLS enforces ownership |
| `DELETE /v1/households/:id` | `supabase.from('households').delete().eq('id', id)` | RLS enforces ownership |
| `GET /v1/households/:id/children` | `supabase.from('children').select().eq('household_id', id)` | RLS filters |
| `POST /v1/children` | `supabase.from('children').insert()` | RLS enforces access |
| `PATCH /v1/children/:id` | `supabase.from('children').update().eq('id', id)` | RLS enforces access |
| `DELETE /v1/children/:id` | `supabase.from('children').delete().eq('id', id)` | RLS enforces access |
| `POST /v1/transactions` | `supabase.from('transactions').insert()` + update child | Use Postgres trigger |
| `GET /v1/chores` | `supabase.from('chores').select().eq('household_id', id)` | RLS filters |
| `POST /v1/chores` | `supabase.from('chores').insert()` | RLS enforces access |
| `PUT /v1/chores/:id` | `supabase.from('chores').update().eq('id', id)` | RLS enforces access |
| `DELETE /v1/chores/:id` | `supabase.from('chores').delete().eq('id', id)` | RLS enforces is_default |
| `POST /v1/chores/complete` | `supabase.from('chore_completions').insert()` | Trigger updates child points |
| `GET /v1/chores/completions` | `supabase.from('chore_completions').select()` | RLS filters |
| `POST /v1/sync` | Supabase Realtime (future) | Use subscriptions for live sync |

### PostgreSQL Triggers for Business Logic

Replace API handler logic with database triggers:

```sql
-- Trigger: Update child totals when transaction created
CREATE OR REPLACE FUNCTION handle_transaction_update_child()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'money' THEN
    IF NEW.action IN ('add', 'earn') THEN
      UPDATE children SET money_total = money_total + NEW.amount WHERE id = NEW.child_id;
    ELSE
      UPDATE children SET money_total = money_total - NEW.amount WHERE id = NEW.child_id;
    END IF;
  ELSIF NEW.type = 'points' THEN
    IF NEW.action IN ('add', 'earn') THEN
      UPDATE children SET points_total = points_total + NEW.amount WHERE id = NEW.child_id;
    ELSE
      UPDATE children SET points_total = points_total - NEW.amount WHERE id = NEW.child_id;
    END IF;
  ELSE
    IF NEW.action IN ('add', 'earn') THEN
      UPDATE children SET screen_total = screen_total + NEW.amount WHERE id = NEW.child_id;
    ELSE
      UPDATE children SET screen_total = screen_total - NEW.amount WHERE id = NEW.child_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_transaction_created
  AFTER INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION handle_transaction_update_child();

-- Trigger: Update child points when chore completed
CREATE OR REPLACE FUNCTION handle_chore_completion_update_child()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE children
  SET points_total = points_total + NEW.points_earned,
      updated_at = NOW()
  WHERE id = NEW.child_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_chore_completion_created
  AFTER INSERT ON chore_completions
  FOR EACH ROW
  EXECUTE FUNCTION handle_chore_completion_update_child();

-- Trigger: Create household member when household created
CREATE OR REPLACE FUNCTION handle_household_created()
RETURNS TRIGGER AS $$
BEGIN
  -- Add creator as owner
  INSERT INTO household_members (household_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'owner');

  -- Create default chores
  PERFORM create_default_chores(NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_household_created
  AFTER INSERT ON households
  FOR EACH ROW
  EXECUTE FUNCTION handle_household_created();
```

Add this to `/Users/Karim/kids-home-hub/supabase/migrations/20251124000002_triggers.sql`

---

## Frontend Integration Changes

### 1. Environment Variables

Update `/Users/Karim/kids-home-hub/apps/pwa/.env.local`:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://qojanjzukgkkrqmnyaai.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvamFuanp1a2dra3JxbW55YWFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MjQ5MjcsImV4cCI6MjA3OTUwMDkyN30.S500vXj7zBtuEGN_gG9n54ZMJCtfloNSN7kDBGTkYK8

# Remove these (no longer needed):
# VITE_API_URL
# VITE_DATABASE_URL
```

### 2. Update Package.json

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    // Remove these:
    // "@neondatabase/serverless": "^1.0.2",
    // "ky": "^1.1.3"
  }
}
```

### 3. Create Supabase Service Layer

Create `/Users/Karim/kids-home-hub/apps/pwa/src/services/households.ts`:

```typescript
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/supabase';

type Household = Database['public']['Tables']['households']['Row'];
type HouseholdInsert = Database['public']['Tables']['households']['Insert'];

export async function getHouseholds(): Promise<Household[]> {
  const { data, error } = await supabase
    .from('households')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getHousehold(id: string): Promise<Household> {
  const { data, error } = await supabase
    .from('households')
    .select(`
      *,
      members:household_members(
        id,
        role,
        joined_at,
        user:auth.users(id, email)
      )
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createHousehold(name: string): Promise<Household> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('households')
    .insert({ name, created_by: user.id })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateHousehold(id: string, name: string): Promise<Household> {
  const { data, error } = await supabase
    .from('households')
    .update({ name })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteHousehold(id: string): Promise<void> {
  const { error } = await supabase
    .from('households')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
```

Create similar files for:
- `/Users/Karim/kids-home-hub/apps/pwa/src/services/children.ts`
- `/Users/Karim/kids-home-hub/apps/pwa/src/services/chores.ts`
- `/Users/Karim/kids-home-hub/apps/pwa/src/services/transactions.ts`

### 4. Update Components

Example: Update household component to use new service:

```typescript
// Before (Cloudflare API)
import { api } from '../api/client';

async function loadHouseholds() {
  const response = await api.get('v1/households').json();
  return response.households;
}

// After (Supabase)
import { getHouseholds } from '../services/households';

async function loadHouseholds() {
  return await getHouseholds();
}
```

### 5. Replace Sync Mechanism

**Current**: Custom `/v1/sync` endpoint with lastSyncedAt timestamps
**Target**: Supabase Realtime subscriptions (future enhancement)

For initial migration, keep polling approach but use Supabase queries:

```typescript
// Simplified sync - just refetch data
async function syncData() {
  const [households, children, chores] = await Promise.all([
    getHouseholds(),
    getChildren(),
    getChores(),
  ]);

  // Update local state
  updateLocalData({ households, children, chores });
}

// Future: Use Supabase Realtime
supabase
  .channel('db-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'children'
  }, (payload) => {
    console.log('Change received!', payload);
    // Update local state
  })
  .subscribe();
```

---

## Step-by-Step Implementation Plan

### Phase 1: Foundation (2-4 hours)

#### Step 1.1: Create Supabase Project Schema
```bash
# 1. Create migration files directory
mkdir -p /Users/Karim/kids-home-hub/supabase/migrations

# 2. Copy schema migration SQL (from section above)
# Save as: /Users/Karim/kids-home-hub/supabase/migrations/20251124000000_initial_schema.sql

# 3. Copy RLS policies SQL (from section above)
# Save as: /Users/Karim/kids-home-hub/supabase/migrations/20251124000001_rls_policies.sql

# 4. Copy triggers SQL (from section above)
# Save as: /Users/Karim/kids-home-hub/supabase/migrations/20251124000002_triggers.sql

# 5. Run migrations in Supabase Dashboard
# - Go to SQL Editor
# - Run each migration file in order
# - Verify tables created: Database > Tables
```

#### Step 1.2: Configure Supabase Auth
```
1. Open Supabase Dashboard: https://supabase.com/dashboard
2. Select project: qojanjzukgkkrqmnyaai
3. Go to Authentication > Providers
4. Enable Email provider
5. Configure Magic Link:
   - Enable "Confirm email" toggle
   - Set "Magic Link" expiry: 1 hour
6. Go to Authentication > Email Templates
   - Customize "Magic Link" template (optional)
7. Go to Authentication > URL Configuration
   - Add site URL: http://localhost:3000
   - Add redirect URLs: http://localhost:3000
```

#### Step 1.3: Configure Environment Variables
```bash
# Create new .env.local for Supabase
cd /Users/Karim/kids-home-hub/apps/pwa

cat > .env.local << 'EOF'
# Supabase Configuration
VITE_SUPABASE_URL=https://qojanjzukgkkrqmnyaai.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvamFuanp1a2dra3JxbW55YWFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MjQ5MjcsImV4cCI6MjA3OTUwMDkyN30.S500vXj7zBtuEGN_gG9n54ZMJCtfloNSN7kDBGTkYK8
EOF
```

#### Step 1.4: Create Feature Branch
```bash
cd /Users/Karim/kids-home-hub
git checkout -b feature/supabase-migration
git push -u origin feature/supabase-migration
```

### Phase 2: Backend Migration (4-6 hours)

#### Step 2.1: Install Supabase Client
```bash
cd /Users/Karim/kids-home-hub/apps/pwa
pnpm add @supabase/supabase-js
pnpm remove @neondatabase/serverless ky
```

#### Step 2.2: Create Supabase Client & Types
```bash
# Create Supabase client
# File: /Users/Karim/kids-home-hub/apps/pwa/src/lib/supabase.ts
# (Copy code from "Authentication Migration" section above)

# Generate TypeScript types from Supabase schema
# In Supabase Dashboard:
# 1. Go to Project Settings > API
# 2. Scroll to "Project API keys"
# 3. Copy "service_role" key (for type generation only, don't commit!)
# 4. Run:
npx supabase gen types typescript --project-id qojanjzukgkkrqmnyaai > src/types/database.types.ts
```

#### Step 2.3: Replace Auth Service
```bash
# Update auth service
# File: /Users/Karim/kids-home-hub/apps/pwa/src/lib/auth.ts
# (Replace entire file with code from "Authentication Migration" section)

# Test auth:
# 1. Start dev server: pnpm dev
# 2. Navigate to login page
# 3. Enter email
# 4. Check email for magic link
# 5. Click link → should authenticate
```

#### Step 2.4: Create Service Layer
```bash
# Create services directory
mkdir -p /Users/Karim/kids-home-hub/apps/pwa/src/services

# Create service files:
# - households.ts (from "Frontend Integration" section)
# - children.ts (similar to households)
# - chores.ts (similar to households)
# - transactions.ts (similar to households)

# Each service wraps Supabase queries with type-safety
```

#### Step 2.5: Remove Cloudflare Workers Backend
```bash
# Remove backend dependencies (after migration complete)
# For now, keep backend folder for reference
# Delete when confident Supabase works:
# rm -rf /Users/Karim/kids-home-hub/apps/backend
```

### Phase 3: Frontend Integration (6-8 hours)

#### Step 3.1: Update Authentication Components
```typescript
// File: /Users/Karim/kids-home-hub/apps/pwa/src/components/auth/LoginForm.tsx
// Replace API calls with new auth service

// Before:
import { sendMagicLink } from '../../lib/auth'; // Custom API
await sendMagicLink(email);

// After:
import { sendMagicLink } from '../../lib/auth'; // Supabase
await sendMagicLink(email); // Same interface!
```

#### Step 3.2: Update Household Components
```typescript
// Replace all household API calls
// Find: grep -r "api.get\|api.post\|api.patch\|api.delete" src/

// Example: HouseholdList component
// Before:
const response = await api.get('v1/households').json();
const households = response.households;

// After:
import { getHouseholds } from '../../services/households';
const households = await getHouseholds();
```

#### Step 3.3: Update Children Components
```typescript
// File: ChildCard.tsx, ChildList.tsx, etc.
// Replace API calls with service functions

// Before:
await api.post('v1/children', { json: { householdId, name, avatar } });

// After:
import { createChild } from '../../services/children';
await createChild({ household_id: householdId, name, avatar });
```

#### Step 3.4: Update Chores Components
```typescript
// File: ChoresList.tsx, ChoreCard.tsx, etc.

// Before:
await api.post('v1/chores/complete', { json: { childId, choreId } });

// After:
import { completeChore } from '../../services/chores';
await completeChore({ child_id: childId, chore_id: choreId });
```

#### Step 3.5: Update Transaction Components
```typescript
// File: MoneyBank.tsx, PointsBank.tsx, etc.

// Before:
await api.post('v1/transactions', {
  json: { childId, type: 'money', action: 'add', amount, reason }
});

// After:
import { createTransaction } from '../../services/transactions';
await createTransaction({
  child_id: childId,
  type: 'money',
  action: 'add',
  amount,
  reason
});
```

#### Step 3.6: Replace Sync Logic
```typescript
// File: /Users/Karim/kids-home-hub/apps/pwa/src/services/sync.ts

// Before: Custom sync endpoint
export async function sync() {
  const lastSyncedAt = localStorage.getItem('lastSyncedAt');
  const response = await api.post('v1/sync', {
    json: { lastSyncedAt, changes: pendingChanges }
  });
  return response;
}

// After: Simple data refresh (later can add Realtime)
export async function sync() {
  const user = await getCurrentUser();
  if (!user) return;

  // Fetch fresh data
  const [households, children, chores] = await Promise.all([
    getHouseholds(),
    getAllChildren(),
    getAllChores(),
  ]);

  // Update local IndexedDB cache
  await db.households.bulkPut(households);
  await db.children.bulkPut(children);
  await db.chores.bulkPut(chores);

  return { households, children, chores };
}
```

### Phase 4: Testing & Validation (4-6 hours)

#### Step 4.1: Manual Testing Checklist
```
Authentication:
[ ] Send magic link email
[ ] Receive email (check spam)
[ ] Click magic link → redirect to app
[ ] Session persists across page refresh
[ ] Logout clears session
[ ] Unauthorized access blocked

Households:
[ ] Create household → default chores created
[ ] List households (only user's households)
[ ] Update household name
[ ] Delete household → children/chores deleted

Children:
[ ] Create child
[ ] List children in household
[ ] Update child (name, avatar, balances)
[ ] Delete child → transactions/completions deleted

Chores:
[ ] List default chores
[ ] Create custom chore
[ ] Update chore
[ ] Delete custom chore (cannot delete default)
[ ] Complete chore → child points updated
[ ] View completion history

Transactions:
[ ] Add money → child balance updated
[ ] Deduct money → child balance updated
[ ] Add points → child balance updated
[ ] Redeem points → child balance updated
[ ] Add screen time → child balance updated
[ ] View transaction history

Multi-device Sync:
[ ] Make change on device A
[ ] Refresh device B → sees change
[ ] Make simultaneous changes → no conflicts

Security:
[ ] Cannot access other user's households
[ ] Cannot modify other user's children
[ ] Cannot delete default chores
[ ] Cannot create transaction for other household's child
```

#### Step 4.2: Automated Testing
```bash
# Update existing tests to use Supabase mocks
# File: /Users/Karim/kids-home-hub/apps/pwa/src/**/*.test.ts

# Mock Supabase client
import { vi } from 'vitest';

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    })),
    auth: {
      signInWithOtp: vi.fn(),
      getSession: vi.fn(),
      getUser: vi.fn(),
      signOut: vi.fn(),
    },
  },
}));

# Run tests
pnpm test
```

#### Step 4.3: Performance Testing
```bash
# Check bundle size
pnpm build
# Should be smaller without Cloudflare Workers dependencies

# Check Lighthouse score
pnpm lighthouse

# Test offline functionality
# 1. Open app in browser
# 2. Open DevTools > Network
# 3. Set "Offline" mode
# 4. Verify app still works (from cache)
# 5. Make changes → queued for sync
# 6. Go online → changes sync
```

#### Step 4.4: Security Audit
```bash
# Test RLS policies in Supabase SQL Editor

-- Try to access another user's household (should fail)
SELECT * FROM households WHERE created_by != auth.uid();
-- Returns: 0 rows (RLS blocks it)

-- Try to insert child into another user's household (should fail)
INSERT INTO children (household_id, name)
VALUES ('some-other-household-id', 'Test');
-- Returns: Error (RLS blocks it)

-- Verify auth.uid() is set correctly
SELECT auth.uid();
-- Returns: current user's UUID
```

### Phase 5: Deployment (2-4 hours)

#### Step 5.1: Update Production Environment
```bash
# Cloudflare Pages environment variables:
# Go to: Cloudflare Dashboard > Pages > kids-home-hub-pwa > Settings > Environment variables

# Add:
VITE_SUPABASE_URL=https://qojanjzukgkkrqmnyaai.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Remove:
VITE_API_URL
VITE_DATABASE_URL
```

#### Step 5.2: Configure Supabase for Production
```
1. Go to Supabase Dashboard > Authentication > URL Configuration
2. Add production URL: https://kids-home-hub.pages.dev
3. Add redirect URLs: https://kids-home-hub.pages.dev

4. Optional: Configure custom SMTP
   - Go to Project Settings > Auth > SMTP Settings
   - Add Resend credentials (or other provider)
   - Test email delivery
```

#### Step 5.3: Deploy PWA
```bash
cd /Users/Karim/kids-home-hub/apps/pwa

# Build for production
pnpm build

# Deploy to Cloudflare Pages
pnpm deploy

# Or push to Git (triggers auto-deploy)
git add .
git commit -m "feat: migrate to Supabase"
git push origin feature/supabase-migration
```

#### Step 5.4: Smoke Test Production
```
1. Visit production URL
2. Test authentication:
   - Request magic link
   - Check email
   - Click link → verify login works
3. Test core features:
   - Create household
   - Add child
   - Complete chore
   - Add money
4. Test multi-device:
   - Open app on phone
   - Make change
   - Check on desktop → sees change
```

#### Step 5.5: Merge to Main
```bash
# After successful production testing
git checkout main
git merge feature/supabase-migration
git push origin main

# Optional: Delete feature branch
git branch -d feature/supabase-migration
git push origin --delete feature/supabase-migration
```

---

## Testing Strategy

### Unit Tests

```typescript
// Test: Household service
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getHouseholds, createHousehold } from './households';
import { supabase } from '../lib/supabase';

vi.mock('../lib/supabase');

describe('Household Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch households', async () => {
    const mockData = [
      { id: '1', name: 'Test Family', created_by: 'user-1' },
    ];

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      }),
    } as any);

    const result = await getHouseholds();
    expect(result).toEqual(mockData);
  });

  it('should create household', async () => {
    const mockUser = { id: 'user-1', email: 'test@example.com' };
    const mockHousehold = { id: '1', name: 'New Family', created_by: 'user-1' };

    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    } as any);

    vi.mocked(supabase.from).mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockHousehold, error: null }),
        }),
      }),
    } as any);

    const result = await createHousehold('New Family');
    expect(result).toEqual(mockHousehold);
  });
});
```

### Integration Tests

```typescript
// Test: End-to-end auth flow
import { test, expect } from '@playwright/test';

test('authentication flow', async ({ page }) => {
  // Go to login page
  await page.goto('http://localhost:3000/login');

  // Enter email
  await page.fill('input[type="email"]', 'test@example.com');
  await page.click('button:has-text("Send Magic Link")');

  // Check for success message
  await expect(page.locator('text=Check your email')).toBeVisible();

  // NOTE: Automated testing of magic link click requires email service mock
  // For manual testing, check email and click link
});

test('create household flow', async ({ page, context }) => {
  // Assume already authenticated (use test session)
  await context.addCookies([
    {
      name: 'supabase-auth-token',
      value: 'test-session-token',
      domain: 'localhost',
      path: '/',
    },
  ]);

  await page.goto('http://localhost:3000');

  // Create household
  await page.click('button:has-text("Create Household")');
  await page.fill('input[name="name"]', 'Test Family');
  await page.click('button:has-text("Create")');

  // Verify created
  await expect(page.locator('text=Test Family')).toBeVisible();
});
```

### RLS Policy Tests

```sql
-- Test file: /Users/Karim/kids-home-hub/supabase/tests/rls_tests.sql

-- Setup test users
INSERT INTO auth.users (id, email) VALUES
  ('user-1', 'user1@example.com'),
  ('user-2', 'user2@example.com');

-- Test: User can only see own households
SET request.jwt.claim.sub = 'user-1';
SELECT COUNT(*) FROM households WHERE created_by = 'user-2';
-- Expected: 0 (RLS blocks access)

-- Test: User can create household
INSERT INTO households (name, created_by) VALUES ('Test', 'user-1');
-- Expected: Success

-- Test: User cannot update another user's household
UPDATE households SET name = 'Hacked' WHERE created_by = 'user-2';
-- Expected: 0 rows affected (RLS blocks it)

-- Test: User can access children in their household
SELECT COUNT(*) FROM children WHERE household_id IN (
  SELECT id FROM households WHERE created_by = 'user-1'
);
-- Expected: Count of children (RLS allows)

-- Cleanup
DELETE FROM auth.users WHERE id IN ('user-1', 'user-2');
```

---

## Risk Assessment

### High Risk Areas

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|------------|
| **RLS Policy Misconfiguration** | Users access other users' data | Medium | Thorough testing, security audit, use Supabase's built-in policy templates |
| **Data Loss During Migration** | Users lose household/children data | Low | No existing data to migrate (fresh start); test migrations on staging first |
| **Authentication Breakage** | Users cannot login | Medium | Keep Cloudflare version intact during migration; thorough auth testing |
| **Performance Degradation** | App slower than before | Low | Supabase is typically faster; benchmark before/after |
| **Email Delivery Issues** | Magic links not received | Medium | Test email delivery; configure custom SMTP if needed; monitor email logs |
| **API Breaking Changes** | Frontend errors after migration | High | Update all API calls systematically; comprehensive testing |
| **Session Management Issues** | Users logged out unexpectedly | Medium | Test session persistence; configure token expiry appropriately |

### Medium Risk Areas

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|------------|
| **Bundle Size Increase** | Slower initial load | Low | Supabase client is ~50KB gzipped; acceptable for most users |
| **Offline Functionality** | App unusable offline | Medium | Keep IndexedDB caching; test offline mode thoroughly |
| **Database Triggers Failing** | Child balances not updated | Low | Test all trigger scenarios; add error handling |
| **Type Safety Issues** | Runtime errors from type mismatches | Low | Generate types from Supabase schema; strict TypeScript |
| **Cost Overruns** | Supabase usage exceeds free tier | Low | Monitor usage dashboard; set up billing alerts |

### Low Risk Areas

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|------------|
| **Third-party Dependency Changes** | Supabase client breaking changes | Low | Pin dependency versions; read changelogs before upgrading |
| **Browser Compatibility** | App breaks on old browsers | Very Low | Supabase client supports modern browsers; same as current setup |
| **SEO Impact** | Search ranking affected | Very Low | No SEO for PWA; not applicable |

---

## Rollback Plan

### If Migration Fails in Development

1. **Abandon Feature Branch**:
   ```bash
   git checkout main
   git branch -D feature/supabase-migration
   ```

2. **Continue with Cloudflare Stack**:
   - Main branch still has working Cloudflare version
   - No impact to users
   - Revisit migration plan

### If Migration Fails in Production

#### Scenario 1: Critical Auth Bug

**Symptoms**: Users cannot login after deployment

**Rollback Steps**:
```bash
# 1. Revert Cloudflare Pages deployment
# Go to: Cloudflare Dashboard > Pages > Deployments
# Click "Rollback" on previous working deployment

# 2. Restore environment variables
# Go to: Settings > Environment variables
# Add back:
VITE_API_URL=https://api.kids-home-hub.workers.dev
VITE_DATABASE_URL=postgresql://...neon.tech/neondb

# 3. Redeploy Cloudflare Worker (if stopped)
cd /Users/Karim/kids-home-hub/apps/backend
pnpm deploy
```

**Time to Rollback**: ~5-10 minutes

#### Scenario 2: Data Integrity Issue

**Symptoms**: Child balances incorrect, transactions missing

**Rollback Steps**:
```bash
# 1. Stop new writes to Supabase
# Disable Supabase project temporarily:
# Go to: Supabase Dashboard > Project Settings > General
# Click "Pause Project"

# 2. Rollback deployment (see Scenario 1)

# 3. Investigate data issue in Supabase
# Use SQL Editor to query problematic data:
SELECT * FROM children WHERE points_total < 0;
SELECT * FROM transactions WHERE created_at > '2025-11-24';

# 4. Fix data if needed, or abandon Supabase migration
```

**Time to Rollback**: ~15-30 minutes

#### Scenario 3: Performance Issues

**Symptoms**: App significantly slower, RLS queries slow

**Rollback Steps**:
```bash
# 1. Rollback deployment (see Scenario 1)

# 2. Analyze Supabase performance
# Go to: Supabase Dashboard > Database > Query Performance
# Identify slow queries

# 3. Optimize RLS policies or indexes
# Add indexes for slow queries
CREATE INDEX idx_children_household_user ON children(household_id);

# 4. Re-deploy if fixed, or stay on Cloudflare
```

**Time to Rollback**: ~10-20 minutes

### Rollback Checklist

```
Pre-rollback:
[ ] Notify users of maintenance window
[ ] Backup current Supabase data (if any)
[ ] Document the issue causing rollback

Rollback:
[ ] Revert Cloudflare Pages deployment
[ ] Restore environment variables
[ ] Redeploy Cloudflare Worker (if needed)
[ ] Verify Cloudflare version works
[ ] Test authentication flow
[ ] Test core features (household, children, chores)

Post-rollback:
[ ] Notify users rollback complete
[ ] Investigate root cause
[ ] Update migration plan
[ ] Schedule retry (if appropriate)
```

---

## Timeline & Effort Estimates

### Development Timeline

| Phase | Duration | Effort (hours) | Dependencies |
|-------|----------|----------------|--------------|
| **Phase 1: Foundation** | 1 day | 2-4 hours | Supabase project access |
| 1.1 Create schema | 1 hour | 1 hour | SQL knowledge |
| 1.2 Configure RLS | 1 hour | 1 hour | PostgreSQL RLS docs |
| 1.3 Setup auth | 30 min | 0.5 hour | Supabase dashboard access |
| 1.4 Environment setup | 30 min | 0.5 hour | - |
| **Phase 2: Backend Migration** | 1-2 days | 4-6 hours | Phase 1 complete |
| 2.1 Install packages | 15 min | 0.25 hour | pnpm |
| 2.2 Create Supabase client | 30 min | 0.5 hour | TypeScript |
| 2.3 Replace auth service | 1 hour | 1 hour | Supabase Auth docs |
| 2.4 Create service layer | 2 hours | 2-3 hours | TypeScript, Supabase client |
| 2.5 Remove Cloudflare code | 15 min | 0.25 hour | - |
| **Phase 3: Frontend Integration** | 2-3 days | 6-8 hours | Phase 2 complete |
| 3.1 Update auth components | 1 hour | 1 hour | Preact knowledge |
| 3.2 Update household components | 1.5 hours | 1.5 hours | Service layer |
| 3.3 Update children components | 1.5 hours | 1.5 hours | Service layer |
| 3.4 Update chores components | 1 hour | 1 hour | Service layer |
| 3.5 Update transactions | 1 hour | 1 hour | Service layer |
| 3.6 Replace sync logic | 1 hour | 1 hour | Supabase Realtime (optional) |
| **Phase 4: Testing & Validation** | 1-2 days | 4-6 hours | Phase 3 complete |
| 4.1 Manual testing | 2 hours | 2 hours | Test checklist |
| 4.2 Automated tests | 1.5 hours | 1.5 hours | Vitest, Playwright |
| 4.3 Performance testing | 30 min | 0.5 hour | Lighthouse |
| 4.4 Security audit | 1 hour | 1 hour | SQL knowledge |
| **Phase 5: Deployment** | 1 day | 2-4 hours | Phase 4 complete |
| 5.1 Production environment | 30 min | 0.5 hour | Cloudflare dashboard |
| 5.2 Configure Supabase | 30 min | 0.5 hour | Supabase dashboard |
| 5.3 Deploy PWA | 30 min | 0.5 hour | Cloudflare Pages |
| 5.4 Smoke test | 1 hour | 1 hour | Production access |
| 5.5 Merge to main | 30 min | 0.5 hour | Git knowledge |
| **TOTAL** | **6-9 days** | **18-28 hours** | - |

### Realistic Timeline (with buffer)

- **Optimistic**: 1 week (full-time focus)
- **Realistic**: 2-3 weeks (part-time, 2-3 hours/day)
- **Conservative**: 4 weeks (with interruptions, thorough testing)

### Critical Path

```
1. Schema Creation (blocking: everything)
   └── 2. RLS Policies (blocking: security)
       └── 3. Auth Setup (blocking: frontend work)
           └── 4. Service Layer (blocking: component updates)
               └── 5. Frontend Components (blocking: testing)
                   └── 6. Testing (blocking: deployment)
                       └── 7. Deployment
```

### Effort by Role

| Role | Effort | Key Tasks |
|------|--------|-----------|
| **Backend Developer** | 6-8 hours | Schema, RLS, triggers, DB optimization |
| **Frontend Developer** | 10-15 hours | Service layer, component updates, auth integration |
| **QA/Testing** | 4-6 hours | Manual testing, automated tests, security audit |
| **DevOps** | 2-3 hours | Environment setup, deployment, monitoring |
| **TOTAL** | 22-32 hours | |

---

## Appendix

### A. Useful Supabase SQL Queries

```sql
-- Check current user
SELECT auth.uid() AS current_user_id;

-- List all households for current user
SELECT * FROM households
WHERE created_by = auth.uid()
   OR id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid());

-- Get child with balances
SELECT c.*,
  (SELECT COUNT(*) FROM chore_completions cc WHERE cc.child_id = c.id AND cc.completed_at > NOW() - INTERVAL '7 days') AS chores_this_week
FROM children c
WHERE c.household_id = 'household-id';

-- Get transaction history
SELECT * FROM transactions
WHERE child_id = 'child-id'
ORDER BY created_at DESC
LIMIT 20;

-- Weekly chore summary
SELECT
  DATE_TRUNC('week', completed_at) AS week,
  COUNT(*) AS chores_completed,
  SUM(points_earned) AS total_points
FROM chore_completions
WHERE child_id = 'child-id'
GROUP BY week
ORDER BY week DESC;
```

### B. Supabase Dashboard Shortcuts

- **SQL Editor**: https://supabase.com/dashboard/project/qojanjzukgkkrqmnyaai/sql
- **Table Editor**: https://supabase.com/dashboard/project/qojanjzukgkkrqmnyaai/editor
- **Authentication**: https://supabase.com/dashboard/project/qojanjzukgkkrqmnyaai/auth/users
- **Database Settings**: https://supabase.com/dashboard/project/qojanjzukgkkrqmnyaai/settings/database
- **API Docs**: https://supabase.com/dashboard/project/qojanjzukgkkrqmnyaai/api
- **Logs**: https://supabase.com/dashboard/project/qojanjzukgkkrqmnyaai/logs

### C. Environment Variables Reference

#### Development (.env.local)
```env
VITE_SUPABASE_URL=https://qojanjzukgkkrqmnyaai.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvamFuanp1a2dra3JxbW55YWFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MjQ5MjcsImV4cCI6MjA3OTUwMDkyN30.S500vXj7zBtuEGN_gG9n54ZMJCtfloNSN7kDBGTkYK8
```

#### Production (Cloudflare Pages)
```
Same as development
No service_role key needed (only for admin operations)
```

#### Removed Variables
```env
# No longer needed:
VITE_API_URL
VITE_DATABASE_URL
JWT_SECRET
RESEND_API_KEY
```

### D. Package.json Changes Summary

#### Add
```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0"
  }
}
```

#### Remove
```json
{
  "dependencies": {
    "@neondatabase/serverless": "^1.0.2",
    "ky": "^1.1.3"
  }
}
```

#### Backend packages/shared (no changes)
```json
{
  "dependencies": {
    "@kids-home-hub/shared": "workspace:*"
  }
}
```

### E. File Structure Changes

#### New Files
```
apps/pwa/src/
├── lib/
│   └── supabase.ts                    # NEW: Supabase client
├── services/                          # NEW: Service layer
│   ├── auth.ts                        # NEW: Auth service (Supabase)
│   ├── households.ts                  # NEW: Household service
│   ├── children.ts                    # NEW: Children service
│   ├── chores.ts                      # NEW: Chores service
│   └── transactions.ts                # NEW: Transactions service
└── types/
    └── database.types.ts              # NEW: Generated from Supabase

supabase/
└── migrations/
    ├── 20251124000000_initial_schema.sql    # NEW: Schema migration
    ├── 20251124000001_rls_policies.sql      # NEW: RLS policies
    └── 20251124000002_triggers.sql          # NEW: Database triggers
```

#### Modified Files
```
apps/pwa/src/
├── lib/
│   └── auth.ts                        # MODIFIED: Replace with Supabase auth
├── api/
│   └── client.ts                      # DELETE: No longer needed
└── components/                        # MODIFIED: Update all API calls
    ├── auth/
    ├── households/
    ├── children/
    ├── chores/
    └── transactions/
```

#### Deleted Files
```
apps/backend/                          # DELETE: Entire backend folder (after migration)
├── src/
│   ├── handlers/
│   │   ├── auth.ts
│   │   ├── households.ts
│   │   ├── children.ts
│   │   ├── chores.ts
│   │   └── sync.ts
│   ├── middleware/
│   └── utils/
├── package.json
└── wrangler.toml
```

---

## Summary & Next Steps

### Migration Summary

This comprehensive migration plan transitions Kids Home Hub from a custom Cloudflare Workers + Neon PostgreSQL stack to a fully managed Supabase platform. The key changes are:

1. **Database**: Migrate from Neon to Supabase PostgreSQL with RLS policies
2. **Authentication**: Replace custom magic links with Supabase Auth
3. **API**: Replace Hono REST API with direct Supabase client calls
4. **Authorization**: Move from manual checks to automatic RLS enforcement
5. **Infrastructure**: Eliminate backend workers, reduce to PWA + Supabase

### Benefits Achieved

- ✅ **Simpler Architecture**: One platform instead of three (Cloudflare, Neon, Resend)
- ✅ **Less Code**: Remove 2,000+ lines of backend code
- ✅ **Better Security**: RLS policies enforce authorization automatically
- ✅ **Faster Development**: No need to write/maintain API endpoints
- ✅ **Real-time Ready**: Easy to add live sync in future
- ✅ **Lower Costs**: Supabase free tier covers most usage
- ✅ **Better DX**: Type-safe queries, auto-generated types

### Recommended Next Steps

1. **Week 1**: Complete Phase 1 (Foundation)
   - Create Supabase schema
   - Set up RLS policies
   - Configure authentication
   - Create feature branch

2. **Week 2**: Complete Phase 2 (Backend Migration)
   - Install Supabase client
   - Create service layer
   - Replace auth service
   - Test authentication flow

3. **Week 3**: Complete Phase 3 (Frontend Integration)
   - Update all components
   - Replace API calls
   - Test each feature
   - Fix any issues

4. **Week 4**: Complete Phase 4-5 (Testing & Deployment)
   - Comprehensive testing
   - Security audit
   - Deploy to production
   - Monitor for issues

### Success Criteria

Migration is successful when:
- ✅ All existing features work identically
- ✅ Authentication is seamless (magic links work)
- ✅ Multi-device sync is reliable
- ✅ RLS policies prevent unauthorized access
- ✅ Performance is equal or better
- ✅ No data integrity issues
- ✅ Rollback plan is tested and ready

### Questions or Issues?

- **Supabase Docs**: https://supabase.com/docs
- **Supabase Discord**: https://discord.supabase.com
- **RLS Tutorial**: https://supabase.com/docs/guides/auth/row-level-security
- **Auth Guide**: https://supabase.com/docs/guides/auth

---

**End of Migration Plan**

Good luck with the migration! 🚀
