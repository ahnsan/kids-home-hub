# Supabase Migration - Deployment Guide

**For**: Kids Home Hub Supabase Migration
**Date**: 2025-11-24
**Version**: 1.0

---

## Table of Contents

1. [Overview](#overview)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Production Environment Setup](#production-environment-setup)
4. [Database Configuration](#database-configuration)
5. [PWA Deployment to Cloudflare Pages](#pwa-deployment-to-cloudflare-pages)
6. [Environment Variables](#environment-variables)
7. [Testing Production](#testing-production)
8. [Monitoring & Logging](#monitoring--logging)
9. [Rollback Procedures](#rollback-procedures)
10. [Post-Deployment Tasks](#post-deployment-tasks)

---

## Overview

This guide covers deploying the Kids Home Hub PWA with Supabase backend to production. The deployment architecture consists of:

- **Frontend**: Preact PWA hosted on Cloudflare Pages
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **CDN**: Cloudflare CDN for global distribution
- **SSL**: Automatic HTTPS via Cloudflare

**Deployment Time**: 30-60 minutes
**Downtime**: Zero (rolling deployment)

---

## Pre-Deployment Checklist

Before deploying to production, ensure all items are complete:

### Code Quality
- [ ] All tests passing (`pnpm test`)
- [ ] No TypeScript errors (`pnpm type-check`)
- [ ] No linting errors (`pnpm lint`)
- [ ] Code formatted (`pnpm format`)
- [ ] Build succeeds (`pnpm build`)

### Testing
- [ ] Completed manual testing checklist (see SUPABASE_TESTING_GUIDE.md)
- [ ] Authentication flows tested
- [ ] All CRUD operations working
- [ ] RLS policies verified
- [ ] Performance benchmarks met
- [ ] Security audit complete

### Database
- [ ] All migrations run successfully
- [ ] Data integrity verified
- [ ] RLS policies enabled on all tables
- [ ] Triggers functioning correctly
- [ ] Helper functions tested
- [ ] Views returning expected data

### Documentation
- [ ] README updated
- [ ] Environment variables documented
- [ ] API documentation current
- [ ] Deployment procedures documented

### Supabase Configuration
- [ ] Production Supabase project created
- [ ] Database migrations run
- [ ] Auth providers configured
- [ ] Email templates customized
- [ ] Rate limiting configured
- [ ] Backup schedule configured

### Security
- [ ] Environment variables secured (not in code)
- [ ] API keys rotated (if needed)
- [ ] CORS configured correctly
- [ ] CSP headers configured
- [ ] Rate limiting enabled
- [ ] SQL injection prevention verified
- [ ] XSS prevention verified

---

## Production Environment Setup

### 1. Create Production Supabase Project

**Step 1: Create Project**

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Fill in details:
   - **Name**: Kids Home Hub Production
   - **Database Password**: Generate strong password (save to password manager)
   - **Region**: Choose closest to your users
   - **Plan**: Choose appropriate plan (Free tier or Pro)
4. Click "Create new project"
5. Wait for project to be provisioned (2-3 minutes)

**Step 2: Note Credentials**

Save these values securely:

```bash
# Production Supabase Credentials
SUPABASE_PROJECT_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # Keep secret!
DATABASE_URL=postgresql://postgres:[password]@db.xxxxx.supabase.co:5432/postgres
```

### 2. Configure Production Database

**Step 1: Run Migrations**

Open Supabase Dashboard SQL Editor and run migrations in order:

```bash
# Go to: https://supabase.com/dashboard/project/[project-id]/sql/new

# Run each migration in order:
1. 001_initial_schema.sql
2. 002_rls_policies.sql
3. 003_helper_functions.sql
4. 004_triggers.sql
5. 005_views.sql
```

**Step 2: Verify Migration**

```sql
-- Check tables (should return 8)
SELECT COUNT(*) FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- Check RLS is enabled on all tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
-- All should have rowsecurity = true

-- Check policies (should return 30+)
SELECT COUNT(*) FROM pg_policies
WHERE schemaname = 'public';
```

**Step 3: Test Database Connection**

```bash
# Install psql if needed
brew install postgresql  # macOS
# or
sudo apt-get install postgresql-client  # Linux

# Connect to production database
psql "postgresql://postgres:[password]@db.xxxxx.supabase.co:5432/postgres"

# Run test query
SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public';

# Exit
\q
```

### 3. Configure Supabase Auth

**Step 1: Email Provider**

1. Go to Authentication > Providers > Email
2. Enable "Email provider"
3. Enable "Confirm email"
4. Enable "Secure email change"
5. Click "Save"

**Step 2: Auth Configuration**

1. Go to Authentication > Configuration
2. Set "Site URL": `https://kids-home-hub.pages.dev` (your production URL)
3. Add "Redirect URLs":
   ```
   https://kids-home-hub.pages.dev
   https://kids-home-hub.pages.dev/**
   https://www.yourdomain.com (if using custom domain)
   https://www.yourdomain.com/**
   ```
4. Set "JWT Expiry": 3600 (1 hour)
5. Set "Refresh Token Rotation": Enabled
6. Click "Save"

**Step 3: Email Templates**

Customize email templates for production:

1. Go to Authentication > Email Templates

**Magic Link Template:**

```html
<h2>Sign in to Kids Home Hub</h2>
<p>Click the link below to sign in to your account:</p>
<p><a href="{{ .ConfirmationURL }}">Sign In</a></p>
<p>This link expires in 1 hour.</p>
<p>If you didn't request this, please ignore this email.</p>
```

**Confirmation Email Template:**

```html
<h2>Confirm Your Email</h2>
<p>Thanks for signing up to Kids Home Hub!</p>
<p>Click the link below to confirm your email address:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm Email</a></p>
<p>If you didn't sign up, please ignore this email.</p>
```

**Step 4: Rate Limiting**

1. Go to Authentication > Rate Limits
2. Configure limits:
   - **Magic link requests**: 3 per hour
   - **Sign in attempts**: 5 per hour
   - **Password resets**: 3 per hour
3. Click "Save"

### 4. Configure Database Backup

**Step 1: Enable Point-in-Time Recovery**

1. Go to Database > Backups
2. Enable "Point-in-Time Recovery" (Pro plan required)
3. Set retention period: 7 days minimum

**Step 2: Schedule Regular Backups**

1. Daily backups are automatic
2. Configure backup retention: 7-30 days
3. Test restore procedure (see Rollback section)

### 5. Configure Database Pooling

**Step 1: Connection Pooling**

1. Go to Database > Connection Pooling
2. Enable "Connection pooling"
3. Mode: Transaction
4. Default pool size: 15
5. Click "Save"

**Step 2: Use Pooled Connection String**

For serverless functions (if needed):

```bash
# Pooled connection (for serverless)
DATABASE_POOLER_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
```

---

## PWA Deployment to Cloudflare Pages

### 1. Prepare Build

**Step 1: Update Environment Variables**

Create production environment file:

```bash
cd /Users/Karim/kids-home-hub/apps/pwa

# Create production environment file
cat > .env.production << 'EOF'
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
EOF
```

**Step 2: Build for Production**

```bash
cd /Users/Karim/kids-home-hub/apps/pwa

# Install dependencies (if needed)
pnpm install

# Build for production
pnpm build

# Output will be in: dist/
```

**Step 3: Test Production Build Locally**

```bash
# Serve production build locally
pnpm preview

# Open http://localhost:4173
# Test all functionality works with production build
```

### 2. Deploy to Cloudflare Pages

**Option A: Deploy via GitHub (Recommended)**

**Step 1: Push to GitHub**

```bash
cd /Users/Karim/kids-home-hub

# Add all changes
git add .

# Commit
git commit -m "feat: production-ready Supabase migration"

# Push to main or production branch
git push origin main
```

**Step 2: Connect Cloudflare Pages to GitHub**

1. Go to https://dash.cloudflare.com
2. Navigate to Pages
3. Click "Create a project"
4. Click "Connect to Git"
5. Select your repository: `kids-home-hub`
6. Configure build settings:
   - **Production branch**: `main`
   - **Build command**: `cd apps/pwa && pnpm install && pnpm build`
   - **Build output directory**: `apps/pwa/dist`
   - **Root directory**: `/`

**Step 3: Add Environment Variables**

In Cloudflare Pages project settings:

1. Go to Settings > Environment Variables
2. Add production variables:
   ```
   VITE_SUPABASE_URL = https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY = eyJhbGc...
   ```
3. Click "Save"

**Step 4: Deploy**

1. Click "Save and Deploy"
2. Wait for build to complete (2-5 minutes)
3. Note deployment URL: `https://kids-home-hub.pages.dev`

**Option B: Deploy via CLI**

**Step 1: Install Wrangler CLI**

```bash
npm install -g wrangler
```

**Step 2: Login to Cloudflare**

```bash
wrangler login
```

**Step 3: Deploy**

```bash
cd /Users/Karim/kids-home-hub/apps/pwa

# Build
pnpm build

# Deploy
wrangler pages deploy dist \
  --project-name=kids-home-hub \
  --branch=main

# Note the deployment URL
```

### 3. Configure Custom Domain (Optional)

**Step 1: Add Custom Domain**

1. In Cloudflare Pages project
2. Go to Custom domains
3. Click "Set up a custom domain"
4. Enter your domain: `app.yourdomain.com`
5. Click "Continue"

**Step 2: Update DNS**

Cloudflare will show DNS records to add:

```
CNAME  app  kids-home-hub.pages.dev
```

Add this record in your DNS provider.

**Step 3: Wait for SSL**

- SSL certificate will be issued automatically
- Usually takes 1-5 minutes
- Verify HTTPS works: `https://app.yourdomain.com`

**Step 4: Update Supabase Redirect URLs**

1. Go to Supabase Dashboard
2. Authentication > URL Configuration
3. Add custom domain to redirect URLs:
   ```
   https://app.yourdomain.com
   https://app.yourdomain.com/**
   ```
4. Click "Save"

---

## Environment Variables

### Development vs Production

**Development (`.env.local`):**

```bash
# Supabase (Development)
VITE_SUPABASE_URL=https://qojanjzukgkkrqmnyaai.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...

# Debug flags
VITE_DEBUG=true
VITE_LOG_LEVEL=debug
```

**Production (Cloudflare Pages Environment Variables):**

```bash
# Supabase (Production)
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...

# No debug flags in production
```

### Security Best Practices

1. **Never commit secrets to Git**
   - Use `.env.local` for local development
   - Add `.env*.local` to `.gitignore`
   - Use Cloudflare Pages environment variables for production

2. **Rotate keys regularly**
   - Regenerate anon keys every 90 days
   - Never expose service role key in frontend

3. **Use different projects for environments**
   - Development: Use development Supabase project
   - Production: Use production Supabase project
   - Never mix environments

4. **Audit access**
   - Review who has access to environment variables
   - Use Cloudflare Access for team management
   - Enable audit logging

---

## Testing Production

### 1. Smoke Tests

After deployment, run these quick tests:

**Test 1: Basic Connectivity**

```bash
# Test production URL loads
curl -I https://kids-home-hub.pages.dev

# Should return: HTTP/2 200
```

**Test 2: Supabase Connection**

1. Open production app: https://kids-home-hub.pages.dev
2. Open browser console (F12)
3. Run test query:

```javascript
// Test Supabase connection
const { data, error } = await supabase.from('households').select('count');
console.log('Connection:', error ? 'Failed' : 'Success');
```

**Test 3: Authentication**

1. Click "Send Magic Link"
2. Enter your email
3. Check email for magic link
4. Click magic link
5. Verify you are signed in

**Test 4: Create Household**

1. Sign in
2. Create test household
3. Add test child
4. Complete test chore
5. Verify points added
6. Verify transaction recorded

### 2. RLS Policy Testing in Production

**Test 1: User Isolation**

```javascript
// Sign in as User A
// Create household A
// Note household ID

// Sign in as User B
// Try to access household A
const { data } = await supabase
  .from('households')
  .select('*')
  .eq('id', '<household-a-id>');

console.log(data);  // Should be empty array
```

**Test 2: Role-Based Access**

```javascript
// As owner: Should be able to manage everything
// As parent: Should be able to manage children/chores
// As viewer: Should be read-only
```

### 3. Performance Testing

**Test 1: Page Load Speed**

1. Open https://www.webpagetest.org
2. Test your production URL
3. Verify:
   - First Contentful Paint < 1.5s
   - Time to Interactive < 2.5s
   - Lighthouse Performance Score > 90

**Test 2: API Response Times**

```javascript
// Test query performance
console.time('query');
const { data } = await supabase
  .from('child_balances')
  .select('*')
  .eq('household_id', householdId);
console.timeEnd('query');
// Should be < 100ms
```

### 4. Security Testing

**Test 1: HTTPS Enforcement**

```bash
# Try HTTP (should redirect to HTTPS)
curl -L http://kids-home-hub.pages.dev

# Should redirect to https://
```

**Test 2: CSP Headers**

```bash
# Check CSP headers
curl -I https://kids-home-hub.pages.dev

# Should include:
# content-security-policy: default-src 'self' https://*.supabase.co
```

**Test 3: Authentication Required**

```javascript
// Sign out
await supabase.auth.signOut();

// Try to access data
const { data } = await supabase.from('households').select('*');
console.log(data);  // Should be empty
```

---

## Monitoring & Logging

### 1. Supabase Monitoring

**Enable Monitoring:**

1. Go to Supabase Dashboard > Monitoring
2. Monitor these metrics:
   - **Database CPU**: Should stay < 70%
   - **Database Memory**: Should stay < 80%
   - **Active Connections**: Monitor for leaks
   - **Query Performance**: Watch for slow queries

**Set Up Alerts:**

1. Go to Supabase Dashboard > Alerts
2. Create alerts for:
   - High CPU usage (> 80%)
   - High memory usage (> 90%)
   - Slow queries (> 1s)
   - Connection pool exhaustion
   - High error rate

### 2. Cloudflare Analytics

**Web Analytics:**

1. Go to Cloudflare Dashboard > Web Analytics
2. Add your domain
3. Monitor:
   - Page views
   - Unique visitors
   - Page load times
   - Geographic distribution

**Performance Monitoring:**

1. Go to Cloudflare Dashboard > Speed
2. Monitor:
   - Cache hit ratio (should be > 90%)
   - Bandwidth usage
   - Response times
   - Error rates

### 3. Application Logging

**Frontend Logging:**

Configure logging in production:

```typescript
// src/lib/logger.ts
export const logger = {
  error: (message: string, error?: Error) => {
    if (import.meta.env.PROD) {
      // Send to error tracking service
      console.error(message, error);
      // TODO: Send to Sentry/LogRocket
    } else {
      console.error(message, error);
    }
  },

  info: (message: string, data?: any) => {
    if (!import.meta.env.PROD) {
      console.log(message, data);
    }
  },
};
```

**Database Logging:**

Enable slow query logging:

```sql
-- In Supabase SQL Editor
ALTER DATABASE postgres SET log_min_duration_statement = 1000;
-- Logs queries taking > 1 second
```

### 4. Error Tracking (Optional)

**Option A: Sentry**

```bash
# Install Sentry
pnpm add @sentry/browser

# Configure Sentry
# src/lib/sentry.ts
import * as Sentry from '@sentry/browser';

if (import.meta.env.PROD) {
  Sentry.init({
    dsn: 'your-sentry-dsn',
    environment: 'production',
    tracesSampleRate: 0.1,
  });
}
```

**Option B: LogRocket**

```bash
# Install LogRocket
pnpm add logrocket

# Configure LogRocket
import LogRocket from 'logrocket';

if (import.meta.env.PROD) {
  LogRocket.init('your-app-id');
}
```

---

## Rollback Procedures

### 1. Rollback PWA Deployment

**If deployment fails or critical bug found:**

**Option A: Rollback in Cloudflare Dashboard**

1. Go to Cloudflare Pages > Deployments
2. Find previous successful deployment
3. Click "..." menu
4. Click "Rollback to this deployment"
5. Confirm

**Option B: Rollback via Git**

```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Cloudflare will auto-deploy previous version
```

**Option C: Manual Rollback**

```bash
# Checkout previous version
git checkout <previous-commit-hash>

# Build
cd apps/pwa
pnpm build

# Deploy
wrangler pages deploy dist --project-name=kids-home-hub
```

### 2. Rollback Database Migration

**IMPORTANT**: Test rollback procedure in development first!

**Step 1: Backup Current State**

```bash
# Backup database before rollback
pg_dump "postgresql://postgres:[password]@db.xxxxx.supabase.co:5432/postgres" > backup.sql
```

**Step 2: Run Rollback Script**

```sql
-- In Supabase SQL Editor, run:
-- /supabase/migrations/999_rollback.sql

-- UNCOMMENT the DROP statements
-- This will remove all tables, functions, triggers, etc.
```

**Step 3: Verify Rollback**

```sql
-- Check tables are removed
SELECT COUNT(*) FROM information_schema.tables
WHERE table_schema = 'public';
-- Should return 0
```

**Step 4: Re-run Previous Migration**

If rolling back to fix a bug, re-run migrations after fixing:

```sql
-- Run migrations in order again
-- 001_initial_schema.sql
-- 002_rls_policies.sql
-- etc.
```

### 3. Emergency Procedures

**If production is completely broken:**

**Option 1: Disable RLS Temporarily (DANGEROUS)**

```sql
-- ONLY in emergency, to restore service
ALTER TABLE households DISABLE ROW LEVEL SECURITY;
ALTER TABLE children DISABLE ROW LEVEL SECURITY;
-- etc.

-- FIX THE ISSUE IMMEDIATELY
-- Then re-enable RLS
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
```

**Option 2: Redirect to Maintenance Page**

1. Go to Cloudflare Pages
2. Add redirect rule:
   - Source: `/*`
   - Destination: `/maintenance.html`
   - Status: 503
3. Fix issue
4. Remove redirect

**Option 3: Full Restore from Backup**

```bash
# Restore from backup
psql "postgresql://postgres:[password]@db.xxxxx.supabase.co:5432/postgres" < backup.sql

# Verify data
psql "postgresql://postgres:[password]@db.xxxxx.supabase.co:5432/postgres"
SELECT COUNT(*) FROM households;
```

---

## Post-Deployment Tasks

### 1. Verify Production

- [ ] All smoke tests pass
- [ ] Authentication works
- [ ] CRUD operations work
- [ ] RLS policies enforced
- [ ] Performance is acceptable
- [ ] No console errors
- [ ] SSL certificate valid
- [ ] Custom domain working (if applicable)

### 2. Monitor for Issues

**First 24 Hours:**

- [ ] Check Cloudflare Analytics every 4 hours
- [ ] Monitor Supabase metrics every 4 hours
- [ ] Check error logs every 2 hours
- [ ] Test critical flows every 6 hours

**First Week:**

- [ ] Daily performance review
- [ ] Daily error log review
- [ ] User feedback review
- [ ] Database performance review

### 3. Update Documentation

- [ ] Update README with production URL
- [ ] Document any deployment issues encountered
- [ ] Update runbooks with lessons learned
- [ ] Document rollback procedures tested

### 4. Notify Stakeholders

- [ ] Notify team deployment is complete
- [ ] Share production URL
- [ ] Share monitoring dashboard links
- [ ] Document known issues (if any)

### 5. Backup Verification

```bash
# Test backup restore procedure
# 1. Download latest backup
# 2. Restore to test database
# 3. Verify data integrity
# 4. Document restore time

# Schedule regular backup tests (monthly)
```

### 6. Security Audit

- [ ] Review access logs
- [ ] Verify no secrets in code
- [ ] Check HTTPS enforcement
- [ ] Verify CORS configuration
- [ ] Review RLS policies
- [ ] Test authentication flows
- [ ] Verify rate limiting

### 7. Performance Optimization

```sql
-- Analyze query performance
ANALYZE;

-- Update statistics
VACUUM ANALYZE;

-- Check for missing indexes
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE schemaname = 'public'
ORDER BY abs(correlation) DESC;

-- Add indexes if needed
CREATE INDEX CONCURRENTLY idx_name ON table_name(column_name);
```

---

## Production Checklist

Use this checklist for every production deployment:

### Pre-Deployment
- [ ] All tests passing
- [ ] Code review complete
- [ ] Security review complete
- [ ] Performance benchmarks met
- [ ] Documentation updated
- [ ] Stakeholders notified

### Supabase Setup
- [ ] Production project created
- [ ] Migrations run successfully
- [ ] RLS policies enabled
- [ ] Auth configured
- [ ] Email templates customized
- [ ] Rate limiting configured
- [ ] Backups enabled
- [ ] Monitoring configured

### PWA Deployment
- [ ] Production build successful
- [ ] Environment variables configured
- [ ] Deployed to Cloudflare Pages
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate issued
- [ ] CDN caching working

### Testing
- [ ] Smoke tests pass
- [ ] Authentication works
- [ ] CRUD operations work
- [ ] RLS policies enforced
- [ ] Performance acceptable
- [ ] Security verified

### Post-Deployment
- [ ] Monitoring active
- [ ] No critical errors
- [ ] Performance metrics good
- [ ] Backup verified
- [ ] Rollback procedure documented
- [ ] Stakeholders notified

---

## Deployment Scripts

### Build and Deploy Script

Create a deployment script:

```bash
#!/bin/bash
# deploy.sh

set -e  # Exit on error

echo "🚀 Deploying Kids Home Hub to Production"

# Check we're on main branch
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" != "main" ]; then
  echo "❌ Must deploy from main branch (currently on $BRANCH)"
  exit 1
fi

# Ensure clean working directory
if [ -n "$(git status --porcelain)" ]; then
  echo "❌ Working directory not clean. Commit changes first."
  exit 1
fi

# Pull latest
echo "📥 Pulling latest changes..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
cd apps/pwa
pnpm install

# Run tests
echo "🧪 Running tests..."
pnpm test

# Type check
echo "🔍 Type checking..."
pnpm type-check

# Build
echo "🔨 Building for production..."
pnpm build

# Deploy to Cloudflare Pages
echo "☁️ Deploying to Cloudflare Pages..."
wrangler pages deploy dist --project-name=kids-home-hub

echo "✅ Deployment complete!"
echo "🌐 Production URL: https://kids-home-hub.pages.dev"
echo "📊 Monitor: https://dash.cloudflare.com/pages"
```

Make executable:

```bash
chmod +x deploy.sh
```

Run:

```bash
./deploy.sh
```

---

## Troubleshooting Production Issues

### Issue: Build Fails in Cloudflare

**Symptoms**: Build fails with package installation errors

**Solutions**:

1. Check Node version in Cloudflare matches local
2. Add `.nvmrc` file:
   ```
   18.0.0
   ```
3. Clear build cache in Cloudflare Pages settings

### Issue: Environment Variables Not Loading

**Symptoms**: App can't connect to Supabase

**Solutions**:

1. Verify environment variables in Cloudflare Pages
2. Check variable names (must start with `VITE_`)
3. Redeploy after adding variables
4. Check browser console for actual values:
   ```javascript
   console.log(import.meta.env.VITE_SUPABASE_URL);
   ```

### Issue: RLS Blocking All Queries

**Symptoms**: Empty results in production

**Solutions**:

1. Verify user is authenticated
2. Check RLS policies are correct
3. Test with RLS disabled temporarily (emergency only)
4. Check Supabase logs for policy violations

### Issue: Slow Performance

**Symptoms**: App is slow in production

**Solutions**:

1. Check database indexes
2. Analyze slow queries in Supabase
3. Enable connection pooling
4. Add missing indexes:
   ```sql
   CREATE INDEX CONCURRENTLY idx_name ON table(column);
   ```

### Issue: Auth Not Working

**Symptoms**: Magic links not arriving or failing

**Solutions**:

1. Check redirect URLs in Supabase Auth settings
2. Verify email provider is configured
3. Check spam folder
4. Verify site URL is correct
5. Check rate limiting not triggered

---

## Support and Resources

- **Supabase Docs**: https://supabase.com/docs
- **Cloudflare Pages Docs**: https://developers.cloudflare.com/pages
- **Supabase Discord**: https://discord.supabase.com
- **Cloudflare Discord**: https://discord.gg/cloudflaredev

---

**Deployment Complete!** 🎉

Monitor your production deployment and refer to this guide for any issues.

For testing procedures, see [SUPABASE_TESTING_GUIDE.md](./SUPABASE_TESTING_GUIDE.md)
For final verification, see [SUPABASE_FINAL_CHECKLIST.md](./SUPABASE_FINAL_CHECKLIST.md)
