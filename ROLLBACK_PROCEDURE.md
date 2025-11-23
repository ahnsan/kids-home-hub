# Rollback Procedure - Kids Home Hub

**Purpose**: Quick reference for rolling back failed deployments
**Severity**: Critical
**Audience**: DevOps, On-call Engineers

---

## Quick Decision Matrix

| Symptom | Severity | Action | Time to Rollback |
|---------|----------|--------|------------------|
| Smoke tests failed | 🔴 Critical | Automatic rollback via Cloudflare | < 1 minute |
| JavaScript errors in production | 🔴 Critical | Manual rollback immediately | < 5 minutes |
| Performance degradation (>2x slower) | 🟡 High | Rollback within 15 minutes | < 5 minutes |
| Minor UI bug (no functionality loss) | 🟢 Low | Fix forward, no rollback | N/A |
| Analytics not tracking | 🟡 High | Investigate first, rollback if needed | 15-30 minutes |

---

## Emergency Rollback (< 5 Minutes)

Use this when production is severely broken.

### Method 1: Cloudflare Dashboard (Fastest - Recommended)

**Time**: < 2 minutes

1. **Open Cloudflare Dashboard**
   ```
   https://dash.cloudflare.com
   ```

2. **Navigate to Pages**
   - Click "Workers & Pages" in left sidebar
   - Click "kids-home-hub-pwa" project

3. **View Deployments**
   - Click "Deployments" tab
   - You'll see list of all deployments

4. **Identify Last Good Deployment**
   - Look for the previous successful deployment (before the broken one)
   - It will have a green checkmark ✅
   - Note the deployment time and commit

5. **Rollback**
   - Click the "..." menu on the right of the good deployment
   - Click "Rollback to this deployment"
   - Click "Rollback" to confirm

6. **Verify**
   - Wait 10-30 seconds for rollback to complete
   - Visit production URL: https://kids-home-hub.pages.dev
   - Verify app loads correctly
   - Check key functionality works

**Done!** Production is now running the previous version.

---

### Method 2: GitHub Actions Re-run

**Time**: 5-10 minutes (includes build time)

1. **Go to GitHub Actions**
   ```
   https://github.com/[your-org]/kids-home-hub/actions
   ```

2. **Find Last Successful Deployment**
   - Click "Deploy PWA to Cloudflare Pages" workflow
   - Find the last successful run (green checkmark)
   - Click on it

3. **Re-run Workflow**
   - Click "Re-run all jobs" button (top right)
   - Confirm re-run

4. **Approve Deployment**
   - Wait for build to complete (~3-5 minutes)
   - Workflow will pause at "Deploy Production"
   - Click "Review deployments"
   - Check "production"
   - Click "Approve and deploy"

5. **Verify**
   - Wait for deployment to complete
   - Check production URL
   - Verify functionality

---

### Method 3: Git Revert + Push

**Time**: 5-10 minutes (includes build time)

**Use when**: You need to permanently revert code changes

1. **Identify Bad Commit**
   ```bash
   # View recent commits
   git log --oneline -10

   # Example output:
   # abc1234 (HEAD -> main, origin/main) Deploy new feature  <- BAD
   # def5678 Update dependencies                             <- GOOD
   # ghi9012 Fix authentication bug
   ```

2. **Create Revert Commit**
   ```bash
   # Revert the bad commit (creates new commit that undoes it)
   git revert abc1234

   # Or revert multiple commits
   git revert abc1234 def5678

   # Edit commit message if needed, then save
   ```

3. **Push to Main**
   ```bash
   # Push revert commit
   git push origin main
   ```

4. **Automatic Deployment**
   - Push to main automatically triggers deployment
   - Go to GitHub Actions to monitor
   - Approve production deployment when prompted
   - Verify deployment succeeds

---

## Scheduled Rollback (15-30 Minutes)

Use when you have time to investigate before rolling back.

### Step 1: Assess the Situation

**Gather Information**:

1. **Check Error Logs**
   ```bash
   # View Cloudflare Pages logs
   wrangler pages deployment tail kids-home-hub-pwa --environment production
   ```

2. **Check Recent Changes**
   ```bash
   # What changed in the bad deployment?
   git diff [good-commit] [bad-commit]
   ```

3. **Check Monitoring**
   - Error rate
   - Response times
   - User impact (how many users affected?)

4. **Reproduce Locally**
   ```bash
   # Checkout bad commit
   git checkout [bad-commit]

   # Build and test
   pnpm build
   pnpm preview

   # Try to reproduce the issue
   ```

### Step 2: Decide: Fix Forward or Rollback?

**Fix Forward if**:
- Issue affects < 5% of users
- Fix is simple and can be deployed in < 15 minutes
- Rollback would lose important data or changes

**Rollback if**:
- Issue affects > 5% of users
- No quick fix available
- Production is severely degraded
- Security vulnerability introduced

### Step 3: Execute Decision

**If Fix Forward**:
```bash
# Create hotfix branch
git checkout -b hotfix/urgent-fix

# Make fix
# ... edit files ...

# Test fix locally
pnpm validate
pnpm build
pnpm preview

# Commit and push
git add .
git commit -m "fix: urgent production issue"
git push origin hotfix/urgent-fix

# Create PR and merge quickly
# Or push directly to main if critical:
git checkout main
git merge hotfix/urgent-fix
git push origin main
```

**If Rollback**:
- Use one of the Emergency Rollback methods above

---

## Database/KV Rollback

**Note**: Cloudflare KV doesn't have built-in rollback. Plan carefully.

### Before Deployment (Prevention)

**Create Backup**:
```bash
# Backup script (add to deployment workflow)
node scripts/ci/backup-kv.js --environment=production
```

### After Failed Deployment

**Restore from Backup**:
```bash
# Manual restore
node scripts/ci/restore-kv.js --backup=backup-20250123.json
```

**Strategies**:
1. **Versioned Keys**: Use versioned keys (e.g., `child:v2:123`)
2. **Dual Write**: Write to both old and new keys during migration
3. **Feature Flags**: Use flags to control which version is active

---

## Testing After Rollback

**Critical Checks** (must pass before declaring success):

### 1. Smoke Tests
```bash
# Run automated smoke tests
node scripts/ci/smoke-test.js --url=https://kids-home-hub.pages.dev

# Expected output:
# ✅ Health Check: PASSED
# ✅ Service Worker: PASSED
# ✅ Main Application: PASSED
# ✅ API Endpoint - Children: PASSED
# ✅ Static Assets: PASSED
```

### 2. Manual Testing

**Critical User Flows**:
- [ ] App loads without errors
- [ ] User can view children list
- [ ] User can add/deduct money
- [ ] User can complete chores
- [ ] User can redeem rewards
- [ ] Data persists (reload page)
- [ ] Service worker registers
- [ ] App works offline

### 3. Browser Testing

Test in multiple browsers:
- [ ] Chrome (Desktop)
- [ ] Safari (Desktop)
- [ ] Firefox (Desktop)
- [ ] Chrome (Mobile)
- [ ] Safari (iOS)

### 4. Performance Check

```bash
# Run Lighthouse audit
npx lighthouse https://kids-home-hub.pages.dev --view

# Check scores:
# Performance > 90
# PWA = 100
# Accessibility > 90
```

---

## Communication Protocol

### Who to Notify

**Immediately**:
- Team lead
- On-call engineer
- Product owner

**Within 30 minutes**:
- Engineering team (Slack/email)
- QA team

**Within 2 hours**:
- Post-mortem document started
- Incident report created

### Communication Template

**Slack Message**:
```
🚨 PRODUCTION ROLLBACK EXECUTED

Severity: [Critical/High/Medium]
Time: [timestamp]
Duration: [how long production was affected]

ISSUE:
[Brief description of what was broken]

ROLLBACK:
[Method used and time taken]

STATUS:
✅ Rollback complete
✅ Production verified working
[ ] Post-mortem scheduled

Users affected: [estimated number]
Downtime: [duration]

Next steps:
1. [Action item 1]
2. [Action item 2]
```

---

## Post-Rollback Actions

### Immediate (within 1 hour)

- [ ] Verify production fully working
- [ ] Document what happened
- [ ] Create GitHub issue for root cause analysis
- [ ] Notify stakeholders

### Short-term (within 24 hours)

- [ ] Root cause analysis
- [ ] Fix the issue in code
- [ ] Add tests to prevent recurrence
- [ ] Update deployment process if needed
- [ ] Schedule post-mortem meeting

### Long-term (within 1 week)

- [ ] Post-mortem document completed
- [ ] Action items from post-mortem assigned
- [ ] Update runbooks/documentation
- [ ] Improve monitoring/alerting
- [ ] Deploy fix to production

---

## Prevention Strategies

### Pre-Deployment

**Required Checks**:
- [ ] All CI checks pass
- [ ] Code review completed
- [ ] Tests added for new features
- [ ] Manual testing on preview deployment
- [ ] Performance budget check
- [ ] Security scan pass

**Optional but Recommended**:
- [ ] Canary deployment (1% traffic)
- [ ] Staged rollout (10% → 50% → 100%)
- [ ] Feature flags for new features
- [ ] A/B testing for major changes

### During Deployment

**Monitor**:
- Error rate (should not increase)
- Response time (should not degrade)
- User sessions (should not drop)
- Browser console errors

**Automated Checks**:
- Smoke tests (automated)
- Health check endpoint
- Critical API endpoints
- Service worker registration

### Post-Deployment

**Monitor for 30 minutes**:
- Error logs
- User reports
- Performance metrics
- Third-party integrations

---

## Rollback Checklist Template

Print this and keep handy for emergencies:

```
ROLLBACK CHECKLIST

☐ 1. Identify issue severity
     Critical □  High □  Medium □  Low □

☐ 2. Note time issue was detected: _____________

☐ 3. Estimated users affected: _____________

☐ 4. Rollback method chosen:
     Cloudflare Dashboard □
     GitHub Actions Re-run □
     Git Revert □

☐ 5. Rollback executed at: _____________

☐ 6. Rollback completed at: _____________

☐ 7. Production verified working: _____________

☐ 8. Smoke tests passed: □

☐ 9. Critical flows tested manually: □

☐ 10. Stakeholders notified: □

☐ 11. Incident documented: □

☐ 12. Post-mortem scheduled: □

Total downtime: _____________ minutes

Notes:
_________________________________________________
_________________________________________________
_________________________________________________
```

---

## Practice Drills

**Schedule quarterly rollback drills**:

1. **Simulate Failure**
   - Deploy a known-bad version to staging
   - Practice rollback procedure
   - Time how long it takes

2. **Review Process**
   - What went well?
   - What could be faster?
   - Update documentation

3. **Train Team**
   - Ensure everyone knows rollback procedure
   - Rotate who performs the drill
   - Document learnings

---

## Emergency Contacts

**On-Call Rotation**:
- Current on-call: [Check PagerDuty/schedule]
- Backup on-call: [Check schedule]

**Escalation**:
- Team Lead: [Contact info]
- Engineering Manager: [Contact info]
- DevOps Lead: [Contact info]

**External Services**:
- Cloudflare Support: https://dash.cloudflare.com/support
- GitHub Support: https://support.github.com

---

## References

- [Deployment Pipeline Guide](./DEPLOYMENT_PIPELINE_GUIDE.md)
- [CI/CD Documentation](./CI_CD_DOCUMENTATION.md)
- [Secrets Configuration](./SECRETS_CONFIGURATION.md)
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages)

---

**Last Updated**: 2025-11-23
**Review Frequency**: After each production issue
**Owner**: DevOps Team
