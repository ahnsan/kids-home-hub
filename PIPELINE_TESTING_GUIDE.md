# CI/CD Pipeline Testing Guide

**Purpose**: Step-by-step guide to test and validate the deployment pipeline
**Audience**: Developers, QA, DevOps
**Time Required**: 60-90 minutes

---

## Overview

This guide walks you through testing every aspect of the CI/CD pipeline to ensure it's working correctly before relying on it for production deployments.

---

## Pre-Testing Setup

### Prerequisites Checklist

- [ ] GitHub repository access
- [ ] Cloudflare account with Pages enabled
- [ ] All secrets configured (see [SECRETS_CONFIGURATION.md](./SECRETS_CONFIGURATION.md))
- [ ] Branch protection enabled on `main`
- [ ] Production environment created in GitHub
- [ ] Local development environment set up

### Verify Secrets

```bash
# Check that secrets are set in GitHub
# Go to: Settings → Secrets and variables → Actions

# Required secrets should be visible (values hidden):
# - CLOUDFLARE_API_TOKEN
# - CLOUDFLARE_ACCOUNT_ID

# Optional secrets (if using):
# - CODECOV_TOKEN
# - SNYK_TOKEN
# - SLACK_WEBHOOK_URL
```

---

## Test 1: Local Validation

**Purpose**: Ensure code passes all checks locally before pushing

**Time**: 5 minutes

### Steps

```bash
# 1. Navigate to project
cd /Users/Karim/kids-home-hub

# 2. Ensure dependencies are installed
pnpm install

# 3. Run all validation checks (this is what CI will run)
pnpm validate

# Expected output:
# ✓ Format check passed
# ✓ Linting passed
# ✓ Type checking passed
# ✓ Tests passed

# 4. Build the PWA
pnpm --filter @kids-hub/pwa build

# Expected output:
# ✓ TypeScript compilation successful
# ✓ Vite build completed
# ✓ dist/ folder created with optimized assets

# 5. Preview the production build
pnpm --filter @kids-hub/pwa preview

# Expected output:
# Local server running at http://localhost:4173
```

### Validation

- [ ] All checks pass without errors
- [ ] Build completes successfully
- [ ] Preview server starts
- [ ] App loads at http://localhost:4173
- [ ] No console errors in browser

**If tests fail**: Fix issues before proceeding to next test

---

## Test 2: Feature Branch with PR

**Purpose**: Test the full CI pipeline and preview deployment

**Time**: 10-15 minutes

### Steps

```bash
# 1. Create a test feature branch
git checkout -b test/pipeline-validation

# 2. Make a small, safe change
echo "<!-- Pipeline test $(date) -->" >> apps/pwa/index.html

# 3. Commit the change
git add apps/pwa/index.html
git commit -m "test: validate CI/CD pipeline"

# 4. Push to GitHub
git push origin test/pipeline-validation
```

### Create Pull Request

1. Go to GitHub repository
2. Click "Pull requests" → "New pull request"
3. Select `test/pipeline-validation` branch
4. Click "Create pull request"
5. Fill in title: "Test: Validate CI/CD Pipeline"
6. Click "Create pull request"

### Monitor Workflows

Watch the following workflows start automatically:

**Go to: Actions tab in GitHub**

#### Expected Workflows

1. **CI Pipeline** (`ci.yml`)
   - Should start immediately
   - Watch each job complete
   - All jobs should pass ✅

2. **Security Scanning** (`security.yml`)
   - May start after CI
   - Some jobs may be skipped if tokens not configured
   - Should complete without critical errors

3. **Performance Monitoring** (`performance.yml`)
   - Tests bundle size and performance
   - Should enforce budgets

4. **E2E Tests** (`e2e-tests.yml`)
   - Runs browser tests
   - Should pass on all browsers

5. **Deploy PWA** (`deploy-pwa.yml`)
   - Builds PWA
   - Creates preview deployment
   - Posts comment on PR with preview URL

### Validation

- [ ] All workflow runs appear in Actions tab
- [ ] CI Pipeline completes successfully (all green)
- [ ] Preview deployment created
- [ ] PR has comment with preview URL
- [ ] Preview URL loads correctly
- [ ] Preview shows your test change

**Check the PR for comment like this**:
```
🚀 Preview Deployment

Your changes have been deployed to Cloudflare Pages!

Preview URL: https://abc123.kids-home-hub-pwa.pages.dev
Version: 2.0.0-abc1234-20250123000000
Branch: test/pipeline-validation
```

### Test Preview Deployment

1. Click the preview URL
2. Verify app loads
3. Check that your change is visible
4. Test basic functionality:
   - [ ] Home page loads
   - [ ] Navigation works
   - [ ] No console errors
5. Test PWA features:
   - [ ] Service worker registers
   - [ ] Works offline (disable network in DevTools)
   - [ ] Install prompt appears

**If any checks fail**: Review workflow logs, fix issues, push new commit to same branch

---

## Test 3: Merge to Main (Staging Deploy)

**Purpose**: Test automatic deployment to production

**Time**: 15-20 minutes

### Steps

```bash
# 1. Ensure all PR checks have passed
# 2. In GitHub, approve and merge the PR

# You can merge via UI or command line:
git checkout main
git pull origin main
git merge test/pipeline-validation
git push origin main
```

### Monitor Deployment

**Go to: Actions tab → Deploy PWA workflow**

#### Expected Flow

1. **Build PWA job runs**
   - Builds production bundle
   - Runs type check, lint, tests
   - Upload artifacts
   - Duration: ~3-5 minutes

2. **Deploy Production job starts**
   - **⚠️ PAUSES for manual approval** (if environment protection is enabled)
   - You'll see "Waiting for approval"

### Approve Production Deployment

1. Click on the workflow run
2. Click "Review deployments"
3. Check the "production" checkbox
4. Click "Approve and deploy"

### Watch Deployment Complete

After approval:

1. **Deployment executes**
   - Deploys to Cloudflare Pages
   - Waits for deployment to stabilize
   - Runs smoke tests

2. **Smoke tests run**
   ```
   ✅ Health Check: PASSED
   ✅ Service Worker: PASSED
   ✅ Main Application: PASSED
   ✅ API Endpoint - Children: PASSED
   ✅ Static Assets: PASSED
   ```

3. **GitHub Release created**
   - Tag: `pwa-v2.0.0-abc1234-20250123000000`
   - Release notes generated

4. **Post-Deployment Validation** (optional)
   - E2E tests run against production
   - Performance audit

### Validation

- [ ] Deployment requires approval (if protection enabled)
- [ ] Deployment completes successfully
- [ ] Smoke tests all pass
- [ ] GitHub release created
- [ ] Production URL loads: https://kids-home-hub.pages.dev
- [ ] Your test change is visible in production

### Test Production

Visit: https://kids-home-hub.pages.dev

**Manual Testing**:
- [ ] App loads without errors
- [ ] Service worker registers
- [ ] App installs via browser prompt
- [ ] Works offline
- [ ] All features functional

**Performance Testing**:
```bash
# Run Lighthouse audit
npx lighthouse https://kids-home-hub.pages.dev --view

# Check scores:
# Performance > 90
# PWA = 100
# Accessibility > 90
# Best Practices > 90
# SEO > 90
```

---

## Test 4: Security Scanning

**Purpose**: Verify security workflows are working

**Time**: 10-15 minutes

### Manual Trigger

1. Go to Actions tab
2. Select "Security Scanning" workflow
3. Click "Run workflow" → "Run workflow"

### Monitor Security Jobs

Watch these jobs execute:

1. **NPM Audit**
   - Scans package-lock.json for vulnerabilities
   - Should pass (or show warnings for low/medium)

2. **Snyk** (if token configured)
   - Deep dependency scan
   - License compliance check

3. **CodeQL**
   - Static code analysis
   - Security pattern detection

4. **Secret Scanning**
   - Gitleaks scan
   - TruffleHog scan

5. **License Compliance**
   - Checks dependency licenses
   - Blocks GPL/AGPL licenses

### Validation

- [ ] Workflow completes
- [ ] No critical vulnerabilities found
- [ ] No secrets detected in code
- [ ] No forbidden licenses

**If vulnerabilities found**:
```bash
# View details in workflow logs
# Update vulnerable dependencies
pnpm update

# Or use npm audit fix
npm audit fix

# Commit and push fixes
git add package-lock.json
git commit -m "fix: update vulnerable dependencies"
git push
```

---

## Test 5: Performance Monitoring

**Purpose**: Verify performance checks are enforced

**Time**: 10 minutes

### Manual Trigger

1. Go to Actions tab
2. Select "Performance Monitoring" workflow
3. Click "Run workflow" → "Run workflow"

### Monitor Performance Jobs

1. **Bundle Size Analysis**
   - Checks bundle doesn't exceed budgets
   - Should pass if properly optimized

2. **Lighthouse CI**
   - Runs Lighthouse audit
   - Checks all scores > 90

3. **Load Testing**
   - k6 load test
   - Validates under stress

4. **Memory Profiling**
   - Checks heap usage
   - Detects memory leaks

5. **Build Time Tracking**
   - Ensures build completes < 120 seconds

### Validation

- [ ] All jobs complete successfully
- [ ] Bundle size within budget
- [ ] Lighthouse scores > 90
- [ ] Load tests pass
- [ ] Build time acceptable

**Test bundle size budget enforcement**:

```bash
# Temporarily add a large dependency to test budget
pnpm --filter @kids-hub/pwa add moment

# Build and check
pnpm --filter @kids-hub/pwa build
pnpm bundle:check

# Should fail if budget exceeded
# Remove the dependency
pnpm --filter @kids-hub/pwa remove moment
```

---

## Test 6: E2E Tests Workflow

**Purpose**: Verify end-to-end tests run correctly

**Time**: 15-20 minutes

### Manual Trigger

1. Go to Actions tab
2. Select "E2E Tests" workflow
3. Click "Run workflow"
4. Select browser: "all"
5. Click "Run workflow"

### Monitor Test Execution

**Expected Jobs**:

1. **E2E Tests (chromium)**
   - Runs all E2E tests in Chromium
   - Uploads test results

2. **E2E Tests (firefox)**
   - Runs all E2E tests in Firefox
   - Uploads test results

3. **E2E Tests (webkit)**
   - Runs all E2E tests in WebKit (Safari)
   - Uploads test results

4. **E2E Mobile Tests**
   - Mobile Chrome tests
   - Mobile Safari tests

5. **Test Summary**
   - Aggregates results
   - Posts summary comment

### Validation

- [ ] Tests run on all browsers
- [ ] All tests pass (or expected failures noted)
- [ ] Test results uploaded as artifacts
- [ ] Playwright reports available

**Download test results**:
1. Go to workflow run
2. Scroll to "Artifacts" section
3. Download `playwright-report-chromium` (or other browsers)
4. Extract and open `index.html` to view detailed report

---

## Test 7: Rollback Procedure

**Purpose**: Verify you can rollback a deployment

**Time**: 5-10 minutes

### Via Cloudflare Dashboard

1. Go to Cloudflare Dashboard
2. Navigate to Pages → kids-home-hub-pwa
3. Click "Deployments" tab
4. Find a previous deployment
5. Click "..." → "Rollback to this deployment"
6. Confirm rollback
7. Wait 30 seconds
8. Verify production URL shows rolled back version

### Validation

- [ ] Rollback completes in < 1 minute
- [ ] Production URL updates
- [ ] Old version is active
- [ ] No errors or downtime

**Restore to latest**:
Repeat rollback process to restore latest deployment

---

## Test 8: Workflow Notifications

**Purpose**: Test notification system (if configured)

**Time**: 5 minutes

### If Slack Configured

1. Trigger any workflow
2. Check Slack channel for notifications

**Expected notifications**:
- Workflow started
- Workflow completed (success/failure)
- Deployment started
- Deployment completed

### If Not Configured

Configure notifications:

1. Get Slack webhook URL
2. Add as `SLACK_WEBHOOK_URL` secret
3. Re-run a workflow
4. Check for notifications

### Validation

- [ ] Notifications appear in Slack
- [ ] Messages contain relevant info
- [ ] Success/failure clearly indicated

---

## Test 9: Branch Protection

**Purpose**: Verify branch protection prevents bad merges

**Time**: 5 minutes

### Test Required Checks

```bash
# 1. Create a branch with intentional error
git checkout -b test/branch-protection

# 2. Add a TypeScript error
echo "const x: string = 123;" >> apps/pwa/src/test-error.ts

# 3. Commit and push
git add .
git commit -m "test: intentional error"
git push origin test/branch-protection

# 4. Create PR
```

### Try to Merge

1. Go to PR in GitHub
2. Try to merge

**Expected Result**:
- ❌ Merge button disabled or showing "Cannot merge"
- Message: "Required checks must pass"
- Type check job shows failure

### Validation

- [ ] Cannot merge with failing checks
- [ ] Clear error message shown
- [ ] Workflow logs show failure reason

**Cleanup**:
```bash
git checkout main
git branch -D test/branch-protection
git push origin --delete test/branch-protection
```

---

## Test 10: Manual Deployment

**Purpose**: Test manual deployment workflow

**Time**: 10 minutes

### Trigger Manual Deployment

1. Go to Actions tab
2. Select "Deploy PWA" workflow
3. Click "Run workflow"
4. Select branch: `main`
5. Select environment: `production`
6. Click "Run workflow"

### Monitor Workflow

**Expected Flow**:
1. Build PWA
2. Wait for approval
3. Deploy to production
4. Run smoke tests
5. Create release

### Validation

- [ ] Workflow starts
- [ ] Requires manual approval
- [ ] Deployment succeeds
- [ ] Smoke tests pass

---

## Comprehensive Testing Checklist

Use this checklist to verify all aspects of the pipeline:

### CI/CD Infrastructure
- [ ] All workflows present in `.github/workflows/`
- [ ] Workflows trigger correctly
- [ ] Jobs run in parallel where possible
- [ ] Artifacts upload/download correctly
- [ ] Caching works (subsequent runs faster)

### Code Quality
- [ ] Linting enforced
- [ ] Type checking enforced
- [ ] Code formatting checked
- [ ] Test coverage measured
- [ ] Coverage threshold enforced (80%)

### Testing
- [ ] Unit tests run
- [ ] Integration tests run
- [ ] E2E tests run on all browsers
- [ ] Mobile device tests run
- [ ] Tests run against preview deployments

### Security
- [ ] NPM audit runs
- [ ] Secret scanning works
- [ ] License compliance checked
- [ ] Snyk scanning works (if configured)
- [ ] CodeQL analysis runs
- [ ] No secrets in code/logs

### Performance
- [ ] Bundle size tracked
- [ ] Bundle budgets enforced
- [ ] Lighthouse CI runs
- [ ] Scores meet thresholds
- [ ] Load testing works
- [ ] Build time tracked

### Deployment
- [ ] Preview deployments work
- [ ] Preview URLs posted to PRs
- [ ] Production deployment requires approval
- [ ] Smoke tests run post-deployment
- [ ] Failed smoke tests prevent deployment
- [ ] GitHub releases created
- [ ] Version tags created

### Rollback
- [ ] Cloudflare rollback works
- [ ] GitHub Actions re-run works
- [ ] Git revert works
- [ ] Rollback completes < 5 minutes
- [ ] No data loss during rollback

### Monitoring
- [ ] Workflow status visible in Actions
- [ ] Artifacts available for download
- [ ] Logs detailed and helpful
- [ ] Notifications work (if configured)
- [ ] Performance metrics tracked

### Documentation
- [ ] All procedures documented
- [ ] Secrets configuration clear
- [ ] Rollback procedure accessible
- [ ] Testing guide complete
- [ ] README up to date

---

## Troubleshooting Common Issues

### Issue: Workflow doesn't trigger

**Solutions**:
- Check workflow file syntax (YAML)
- Verify workflow is on the branch you're testing
- Check if workflow is disabled
- Verify trigger conditions match

### Issue: Secrets not available

**Solutions**:
- Check secret names match exactly
- Secrets not available for fork PRs (security)
- Verify repository settings allow secrets
- Check environment configuration

### Issue: Deployment fails

**Solutions**:
- Check Cloudflare credentials
- Verify Pages project name matches
- Check account ID is correct
- Review deployment logs

### Issue: Tests fail in CI but pass locally

**Solutions**:
- Check Node.js version matches
- Verify environment variables
- Check for timing issues in tests
- Review CI logs for specific errors

---

## Performance Benchmarks

**Target Times**:
- CI Pipeline: < 10 minutes
- Preview Deployment: < 5 minutes
- Production Deployment: < 8 minutes (excluding approval wait)
- Rollback: < 2 minutes
- Full Test Suite: < 15 minutes

**If times exceed targets**:
- Check for network issues
- Review job parallelization
- Optimize build process
- Consider caching improvements

---

## Next Steps After Testing

Once all tests pass:

1. **Document any issues found**
   - Create GitHub issues
   - Update documentation
   - Fix configuration problems

2. **Train the team**
   - Walk through deployment process
   - Practice rollback procedure
   - Review monitoring tools

3. **Set up monitoring**
   - Configure alerts
   - Set up dashboards
   - Define SLOs

4. **Regular maintenance**
   - Review workflows monthly
   - Update dependencies regularly
   - Test rollback procedure quarterly

---

## Support

**Need help?**
- Review workflow logs in GitHub Actions
- Check [Deployment Pipeline Guide](./DEPLOYMENT_PIPELINE_GUIDE.md)
- See [Rollback Procedure](./ROLLBACK_PROCEDURE.md)
- Review [CI/CD Documentation](./CI_CD_DOCUMENTATION.md)

---

**Last Updated**: 2025-11-23
**Version**: 1.0.0
**Test Frequency**: Before major releases and quarterly
