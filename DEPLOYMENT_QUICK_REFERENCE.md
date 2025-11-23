# Deployment Quick Reference Card

**Kids Home Hub CI/CD Pipeline**

---

## 🚀 Quick Commands

```bash
# Local Development
pnpm dev                    # Start dev server
pnpm validate               # Run all checks (lint, test, type-check)
pnpm build                  # Build for production
pnpm preview                # Preview production build

# Testing
pnpm test                   # Unit tests
pnpm test:e2e               # E2E tests
pnpm test:coverage          # Coverage report
node scripts/ci/smoke-test.js --url=<url>  # Smoke tests

# Deployment
# Production deployment happens automatically via GitHub Actions
# No manual deployment commands needed for PWA
```

---

## 📋 Deployment Checklist

### Before Creating PR
- [ ] `pnpm validate` passes
- [ ] All tests pass
- [ ] No console errors locally
- [ ] Changes tested in dev mode

### During PR Review
- [ ] CI checks all green ✅
- [ ] Preview deployment works
- [ ] Code reviewed and approved
- [ ] No merge conflicts

### After Merging to Main
- [ ] Production deployment starts automatically
- [ ] Approve deployment in GitHub Actions
- [ ] Monitor deployment progress
- [ ] Verify production URL after deploy

---

## 🔐 Required Secrets

**GitHub Repository → Settings → Secrets and variables → Actions**

| Secret | Get From | Required? |
|--------|----------|-----------|
| `CLOUDFLARE_API_TOKEN` | [Create Token](https://dash.cloudflare.com/profile/api-tokens) | ✅ Yes |
| `CLOUDFLARE_ACCOUNT_ID` | [Dashboard](https://dash.cloudflare.com) | ✅ Yes |
| `CODECOV_TOKEN` | [Codecov.io](https://codecov.io) | Optional |
| `SNYK_TOKEN` | [Snyk.io](https://snyk.io) | Optional |
| `SLACK_WEBHOOK_URL` | [Slack API](https://api.slack.com/messaging/webhooks) | Optional |

**Full setup**: See [SECRETS_CONFIGURATION.md](./SECRETS_CONFIGURATION.md)

---

## 🌐 Environment URLs

| Environment | URL | Trigger |
|-------------|-----|---------|
| **Local** | http://localhost:3000 | `pnpm dev` |
| **Preview** | Auto-generated | PR created |
| **Production** | https://kids-home-hub.pages.dev | Merge to `main` |

---

## 🔄 Deployment Flow

```
1. Create Feature Branch
   ↓
2. Develop & Test Locally
   ↓
3. Push & Create PR
   ↓
4. CI Runs (auto) → Preview Deploy (auto)
   ↓
5. Code Review & Approval
   ↓
6. Merge to Main
   ↓
7. Production Build (auto)
   ↓
8. Manual Approval Required ⏸
   ↓
9. Deploy to Production (auto)
   ↓
10. Smoke Tests (auto)
   ↓
11. ✅ Live! or ❌ Rollback
```

---

## ⚡ Emergency Rollback

**Fastest method (< 1 minute)**:

1. Open [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Workers & Pages → kids-home-hub-pwa → Deployments
3. Find previous working deployment
4. Click "..." → "Rollback to this deployment"
5. Confirm

**Full guide**: [ROLLBACK_PROCEDURE.md](./ROLLBACK_PROCEDURE.md)

---

## 📊 Quality Gates

All must pass before deployment:

- ✅ Lint (zero warnings)
- ✅ Type check (no errors)
- ✅ Tests (80% coverage)
- ✅ Build (successful)
- ✅ Security scan (no critical)
- ✅ Bundle size (< 150KB)

---

## 🔍 Monitoring

### GitHub Actions
**Repository → Actions tab**
- View workflow runs
- Download artifacts
- Check logs

### Cloudflare Dashboard
**Workers & Pages → kids-home-hub-pwa**
- Deployment history
- Analytics
- Error logs

---

## 📞 Support

| Issue | Document | Time |
|-------|----------|------|
| First time setup | [SECRETS_CONFIGURATION.md](./SECRETS_CONFIGURATION.md) | 30 min |
| Test pipeline | [PIPELINE_TESTING_GUIDE.md](./PIPELINE_TESTING_GUIDE.md) | 60 min |
| Emergency rollback | [ROLLBACK_PROCEDURE.md](./ROLLBACK_PROCEDURE.md) | < 5 min |
| Full documentation | [DEPLOYMENT_PIPELINE_GUIDE.md](./DEPLOYMENT_PIPELINE_GUIDE.md) | Reference |

---

## 🎯 Common Tasks

### Deploy a Feature

```bash
git checkout -b feature/my-feature
# ... make changes ...
pnpm validate
git commit -am "feat: add new feature"
git push origin feature/my-feature
# Create PR on GitHub
# Wait for CI and preview deployment
# Review, approve, merge
# Approve production deployment in Actions tab
```

### Fix a Bug in Production

```bash
git checkout -b hotfix/critical-bug
# ... fix bug ...
pnpm validate
git commit -am "fix: critical production bug"
git push origin hotfix/critical-bug
# Create PR, get quick review, merge
# Approve production deployment immediately
```

### Rollback Bad Deployment

```bash
# Option 1: Cloudflare Dashboard (fastest)
# See Emergency Rollback section above

# Option 2: Git revert
git revert <bad-commit-sha>
git push origin main
# Approve new deployment
```

---

## 📝 Workflow Files

| Workflow | Purpose | Trigger |
|----------|---------|---------|
| `ci.yml` | Quality checks | PR, Push |
| `deploy-pwa.yml` | PWA deployment | PR (preview), Push to main (prod) |
| `security.yml` | Security scans | PR, Push, Daily |
| `performance.yml` | Performance checks | PR, Push |
| `e2e-tests.yml` | Browser tests | PR, Push |

---

## ⏱ Time Estimates

| Task | Duration |
|------|----------|
| CI Pipeline | 5-8 min |
| Preview Deploy | 3-5 min |
| Production Deploy (after approval) | 8-12 min |
| Rollback | < 1 min |
| First-time setup | 30 min |

---

## ✅ Pre-Flight Checklist

Before every deployment:

- [ ] Tests pass locally
- [ ] No lint errors
- [ ] Build succeeds
- [ ] Preview deployment tested
- [ ] Code reviewed
- [ ] Change log updated

---

## 🚨 When Things Go Wrong

| Symptom | Action |
|---------|--------|
| CI fails | Check logs in Actions tab |
| Preview not created | Verify Cloudflare secrets |
| Smoke tests fail | Rollback immediately |
| Production broken | Follow [ROLLBACK_PROCEDURE.md](./ROLLBACK_PROCEDURE.md) |
| Can't approve deployment | Check environment permissions |

---

## 📚 Documentation Index

1. **[DEPLOYMENT_PIPELINE_SUMMARY.md](./DEPLOYMENT_PIPELINE_SUMMARY.md)** - Complete overview
2. **[DEPLOYMENT_PIPELINE_GUIDE.md](./DEPLOYMENT_PIPELINE_GUIDE.md)** - Detailed guide
3. **[SECRETS_CONFIGURATION.md](./SECRETS_CONFIGURATION.md)** - Setup secrets
4. **[ROLLBACK_PROCEDURE.md](./ROLLBACK_PROCEDURE.md)** - Rollback guide
5. **[PIPELINE_TESTING_GUIDE.md](./PIPELINE_TESTING_GUIDE.md)** - Testing guide
6. **[CI_CD_DOCUMENTATION.md](./CI_CD_DOCUMENTATION.md)** - CI/CD reference

---

**Print this card and keep it handy for deployments!**

**Last Updated**: 2025-11-23 | **Version**: 1.0.0
