# Kids Home Hub - Neon Database Setup

## Database Information

- **Provider**: Neon PostgreSQL
- **Region**: eu-west-2 (London)
- **Database Name**: neondb
- **PostgreSQL Version**: 17.5

## Connection Details

The connection string is stored in `/apps/pwa/.env.local`:
```
VITE_DATABASE_URL=postgresql://neondb_owner:npg_nIT9w...@ep-young-cell-ab2lrnji-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

## Tables Created

All 9 tables have been successfully created:

1. **users** - User accounts with email-based authentication
2. **magic_link_tokens** - Passwordless authentication tokens
3. **user_sessions** - Active user sessions with device tracking
4. **households** - Family household management
5. **household_members** - Multi-parent household membership
6. **children** - Child profiles with balances (money, points, screen time)
7. **chores** - Custom and default chores per household
8. **transactions** - Unified transaction log for money, points, screen time
9. **chore_completions** - Chore completion history with weekly tracking

## Indexes

29 indexes created for optimal query performance:

### Authentication & Sessions
- `idx_magic_tokens_email` - Fast email lookups for magic links
- `idx_magic_tokens_expires` - Expire token cleanup
- `idx_sessions_user`, `idx_sessions_token`, `idx_sessions_expires` - Session management

### Households & Members
- `idx_households_owner` - Household ownership queries
- `idx_household_members_household`, `idx_household_members_user` - Member relationships

### Children & Chores
- `idx_children_household`, `idx_children_updated` - Child queries and updates
- `idx_chores_household`, `idx_chores_category` - Chore filtering

### Transactions & Completions
- `idx_transactions_child`, `idx_transactions_type`, `idx_transactions_created` - Transaction history
- `idx_chore_completions_child`, `idx_chore_completions_week`, `idx_chore_completions_date` - Completion tracking

## Helper Functions

### 1. `get_or_create_user(email TEXT)`
Creates or returns an existing user by email.

```sql
-- Example usage
SELECT get_or_create_user('user@example.com');
-- Returns: UUID of user
```

### 2. `create_default_chores(household_id UUID)`
Creates 5 default chores for a new household.

```sql
-- Example usage
SELECT create_default_chores('your-household-uuid');
```

Default chores created:
- Tidy bedroom (10 points, 🛏️, cleaning)
- Finish homework (8 points, 📚, homework)
- Set / clear the table (5 points, 🍽️, helping)
- Feed pet / help pet (6 points, 🐕, pets)
- Help with laundry (7 points, 👕, helping)

### 3. `cleanup_expired_tokens()`
Removes expired magic link tokens and user sessions.

```sql
-- Example usage
SELECT cleanup_expired_tokens();
```

### 4. `update_updated_at_column()`
Trigger function that automatically updates `updated_at` timestamp on record modifications.
Applied to: users, households, children, chores

## Views

### 1. `household_summary`
Quick overview of household statistics.

```sql
SELECT * FROM household_summary WHERE household_id = 'your-uuid';
```

Returns:
- household_id, household_name, owner_id
- children_count, chores_count
- created_at, updated_at

### 2. `child_balances`
Current balances and weekly activity for all children.

```sql
SELECT * FROM child_balances WHERE household_id = 'your-uuid';
```

Returns:
- Child details (id, name, avatar)
- Current balances (money_total, points_total, screen_total)
- Weekly activity (chores_this_week, points_this_week)

## Test Data

Test data has been created:

### Test User
- Email: `dev@test.com`
- ID: `f088a43d-fc8a-44fb-8db1-8276250fa342`

### Test Household
- Name: `Test Family`
- ID: `e56e6bae-75fc-4c2d-b01a-18cb354d2b02`
- Owner: dev@test.com

### Test Children
1. **Emma** (👧)
   - Money: £25.50
   - Points: 120
   - Screen Time: 180 minutes

2. **Oliver** (👦)
   - Money: £18.75
   - Points: 95
   - Screen Time: 150 minutes

### Default Chores
5 default chores created for the test household.

## Sample Queries

### Create a new user and household
```sql
-- Create user
INSERT INTO users (email, email_verified)
VALUES ('parent@example.com', TRUE)
RETURNING id;

-- Create household (use user ID from above)
INSERT INTO households (name, owner_id, created_by)
VALUES ('Smith Family', 'user-id-here', 'user-id-here')
RETURNING id;

-- Create default chores
SELECT create_default_chores('household-id-here');
```

### Add a child to household
```sql
INSERT INTO children (household_id, name, avatar, money_total, points_total, screen_total)
VALUES ('household-id', 'Sarah', '👧', 0.00, 0, 0)
RETURNING id;
```

### Record a chore completion
```sql
-- First, update chore_completions with week_start
INSERT INTO chore_completions (
  child_id,
  chore_id,
  chore_label,
  points_earned,
  week_start,
  created_by
) VALUES (
  'child-id',
  'chore-id',
  'Tidy bedroom',
  10,
  DATE_TRUNC('week', NOW())::DATE,
  'user-id'
);

-- Then update child's points
UPDATE children
SET points_total = points_total + 10,
    updated_at = NOW()
WHERE id = 'child-id';

-- Record transaction
INSERT INTO transactions (
  child_id,
  type,
  action,
  amount,
  reason,
  created_by
) VALUES (
  'child-id',
  'points',
  'earn',
  10,
  'Completed: Tidy bedroom',
  'user-id'
);
```

### Get weekly chore summary for a child
```sql
SELECT
  DATE_TRUNC('week', completed_at) AS week,
  COUNT(*) AS chores_completed,
  SUM(points_earned) AS total_points
FROM chore_completions
WHERE child_id = 'child-id'
  AND completed_at >= NOW() - INTERVAL '4 weeks'
GROUP BY DATE_TRUNC('week', completed_at)
ORDER BY week DESC;
```

### Get child's transaction history
```sql
SELECT
  type,
  action,
  amount,
  reason,
  created_at
FROM transactions
WHERE child_id = 'child-id'
ORDER BY created_at DESC
LIMIT 20;
```

## Row Level Security (RLS)

RLS is enabled on all user-facing tables:
- households
- household_members
- children
- chores
- transactions
- chore_completions

**Note**: Policies need to be configured based on your authentication implementation. The schema includes example policies (commented out) that can be adapted.

## Next Steps for API Implementation

### 1. Database Client Setup
The Neon serverless client is installed:
```bash
pnpm add @neondatabase/serverless
```

Import in your code:
```typescript
import { neon } from '@neondatabase/serverless';

const sql = neon(import.meta.env.VITE_DATABASE_URL);
```

### 2. Authentication Flow
1. User requests magic link → create token in `magic_link_tokens`
2. User clicks link → verify token, create session in `user_sessions`
3. Store session token in localStorage/cookies
4. Send token with each API request

### 3. API Endpoints to Implement

#### Auth
- `POST /api/auth/request-magic-link` - Send magic link email
- `POST /api/auth/verify-magic-link` - Verify token and create session
- `POST /api/auth/logout` - Invalidate session
- `GET /api/auth/me` - Get current user

#### Households
- `GET /api/households` - List user's households
- `POST /api/households` - Create new household
- `GET /api/households/:id` - Get household details
- `PUT /api/households/:id` - Update household
- `DELETE /api/households/:id` - Delete household

#### Children
- `GET /api/households/:id/children` - List children
- `POST /api/households/:id/children` - Add child
- `PUT /api/children/:id` - Update child
- `DELETE /api/children/:id` - Remove child
- `GET /api/children/:id/balance` - Get current balances

#### Chores
- `GET /api/households/:id/chores` - List chores
- `POST /api/households/:id/chores` - Create custom chore
- `PUT /api/chores/:id` - Update chore
- `DELETE /api/chores/:id` - Delete chore

#### Transactions
- `GET /api/children/:id/transactions` - Get transaction history
- `POST /api/children/:id/transactions` - Create transaction (add/deduct money/points/screen time)
- `POST /api/children/:id/chores/complete` - Mark chore as complete

#### Analytics
- `GET /api/children/:id/stats/weekly` - Weekly chore completion stats
- `GET /api/households/:id/stats/leaderboard` - Points leaderboard

### 4. Sync Strategy
Consider implementing:
- Optimistic updates on client
- Background sync queue for offline support
- Conflict resolution strategy
- Last-write-wins or operational transformation

### 5. Security Considerations
- Implement proper RLS policies before production
- Validate user has access to household data
- Rate limit authentication endpoints
- Use HTTPS only
- Secure session tokens
- Set appropriate CORS headers

## Database Maintenance

### Cleanup Expired Tokens
Run periodically (daily recommended):
```sql
SELECT cleanup_expired_tokens();
```

### Backup Strategy
Neon provides automatic backups. For additional safety:
1. Use Neon's point-in-time restore feature
2. Export critical data periodically
3. Test restore procedures

### Monitoring
Monitor these metrics:
- Connection pool usage
- Query performance
- Storage size
- Active sessions
- Failed authentication attempts

## Troubleshooting

### Connection Issues
```bash
# Test connection
psql 'postgresql://...' -c "SELECT version();"
```

### Check Table Structure
```sql
\d table_name
```

### View Active Sessions
```sql
SELECT * FROM user_sessions
WHERE expires_at > NOW()
ORDER BY last_active_at DESC;
```

### Clear Old Data
```sql
-- Clear old completions (older than 3 months)
DELETE FROM chore_completions
WHERE completed_at < NOW() - INTERVAL '3 months';

-- Clear old transactions (older than 6 months)
DELETE FROM transactions
WHERE created_at < NOW() - INTERVAL '6 months';
```

## Support

- Neon Dashboard: https://console.neon.tech/
- Neon Docs: https://neon.tech/docs
- PostgreSQL Docs: https://www.postgresql.org/docs/
