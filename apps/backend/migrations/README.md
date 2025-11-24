# Database Migrations

This directory contains SQL migration scripts for the Kids Home Hub application.

## Quick Start

### Running the Test Users Migration

```bash
# Method 1: Direct psql command
psql "postgresql://your-connection-string" -f test-users.sql

# Method 2: Using environment variable
export DATABASE_URL="postgresql://your-connection-string"
psql $DATABASE_URL -f test-users.sql
```

## Available Migrations

### `test-users.sql`
Creates 2 test user accounts with sample data for testing.

**Test Accounts:**
- `test1@kidshub.dev` - Smith Family (2 children)
- `test2@kidshub.dev` - Johnson Family (1 child)

**Documentation:** See [TEST_USERS.md](./TEST_USERS.md) for complete details.

## Test User Quick Reference

| Email | Household | Children | Key Features |
|-------|-----------|----------|--------------|
| test1@kidshub.dev | Smith Family | Emma (8), Noah (12) | Multi-child, varied activity, different ages |
| test2@kidshub.dev | Johnson Family | Olivia (10) | Single child, high activity, consistent pattern |

### Child Balances

| Child | Age | Money | Points | Screen Time |
|-------|-----|-------|--------|-------------|
| Emma | 8 | £12.50 | 150 | 60 min |
| Noah | 12 | £25.00 | 85 | 30 min |
| Olivia | 10 | £8.75 | 200 | 90 min |

## Verification

After running the migration, verify with:

```sql
-- Quick check
SELECT email FROM users WHERE email LIKE '%@kidshub.dev';

-- Detailed check
SELECT c.name, c.age, h.name as household,
       c.money_total, c.points_total, c.screen_total
FROM children c
JOIN households h ON c.household_id = h.id
JOIN users u ON h.owner_id = u.id
WHERE u.email LIKE '%@kidshub.dev'
ORDER BY h.name, c.name;
```

Expected: 2 users, 2 households, 3 children with balances as shown above.

## Need Help?

- Full documentation: [TEST_USERS.md](./TEST_USERS.md)
- Database schema: [/DATABASE_INFO.md](../../../DATABASE_INFO.md)
- Cleanup script: See TEST_USERS.md "Cleanup Script" section
