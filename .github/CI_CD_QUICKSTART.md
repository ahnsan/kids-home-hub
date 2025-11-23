# CI/CD Pipeline - Quick Start Guide

Get your CI/CD pipeline up and running in 15 minutes.

## Prerequisites Checklist

- [ ] GitHub repository access
- [ ] Node.js 18+ installed
- [ ] pnpm 8+ installed
- [ ] Cloudflare Workers account
- [ ] Admin access to repository settings

## 5-Step Setup

### Step 1: Configure GitHub Secrets (5 minutes)

Navigate to: **Settings → Secrets and variables → Actions → New repository secret**

**Required:**
```bash
CLOUDFLARE_API_TOKEN=<your-cloudflare-api-token>
CLOUDFLARE_ACCOUNT_ID=<your-cloudflare-account-id>
```

**Optional (but recommended):**
```bash
SNYK_TOKEN=<your-snyk-token>
SLACK_WEBHOOK_URL=<your-slack-webhook>
CODECOV_TOKEN=<your-codecov-token>
```

📖 **Detailed instructions:** See [SECRETS_SETUP.md](./SECRETS_SETUP.md)

### Step 2: Enable Branch Protection (3 minutes)

Navigate to: **Settings → Branches → Add rule**

**Branch:** `main`

**Quick config:**
- [x] Require pull request before merging (1 approval)
- [x] Require status checks to pass
- [x] Require branches to be up to date

**Required status checks:**
```
- Quality Gate
```

📖 **Detailed instructions:** See [BRANCH_PROTECTION.md](./BRANCH_PROTECTION.md)

### Step 3: Configure Environments (2 minutes)

Navigate to: **Settings → Environments**

**Create two environments:**

1. **staging**
   - No protection rules

2. **production**
   - [x] Required reviewers: 1
   - Deployment branch: `main` only

### Step 4: Install Dependencies Locally (3 minutes)

```bash
# Clone repository
git clone https://github.com/your-org/kids-home-hub.git
cd kids-home-hub

# Install dependencies
pnpm install

# Run validation to ensure everything works
pnpm validate
```

### Step 5: Test the Pipeline (2 minutes)

```bash
# Create a test branch
git checkout -b test/ci-pipeline

# Make a small change
echo "# CI/CD Pipeline Active" >> README.md

# Commit and push
git add README.md
git commit -m "test: verify CI/CD pipeline"
git push origin test/ci-pipeline

# Create pull request via GitHub UI or CLI
gh pr create --title "Test CI/CD Pipeline" --body "Testing automated pipeline"
```

Watch the CI/CD pipeline run on GitHub Actions tab!

## What Happens Next?

### On Pull Request

1. ✅ **Lint Code** - ESLint checks (30s)
2. ✅ **Type Check** - TypeScript validation (30s)
3. ✅ **Unit Tests** - With coverage (1-2 min)
4. ✅ **Integration Tests** - API tests (1-2 min)
5. ✅ **E2E Tests** - Browser tests (2-3 min)
6. ✅ **Build** - Production build (1 min)
7. ✅ **Security Scans** - Vulnerability checks (2-3 min)
8. ✅ **Performance** - Bundle size & Lighthouse (2-3 min)
9. ✅ **Quality Gate** - All checks must pass

**Total time:** ~10-15 minutes

### On Merge to Main

1. ✅ All CI checks run again
2. 🚀 **Auto-deploy to staging**
3. ✅ Smoke tests run
4. ✅ Integration tests on staging
5. ⏸️ **Manual approval needed for production**
6. 🚀 **Deploy to production** (after approval)
7. ✅ Production smoke tests
8. 📦 GitHub release created

## Quick Commands Reference

```bash
# Development
pnpm dev                    # Start dev server
pnpm test                   # Run tests
pnpm test:watch            # Watch mode
pnpm lint                   # Check linting
pnpm format                 # Format code

# Testing
pnpm test:coverage         # Coverage report
pnpm test:e2e             # E2E tests
pnpm test:smoke           # Smoke tests

# Quality Checks
pnpm validate             # Run all checks
pnpm type-check          # TypeScript check
pnpm lint:fix            # Fix lint issues

# Deployment
pnpm deploy:staging      # Deploy to staging
pnpm deploy:production   # Deploy to production
pnpm deployment:rollback # Rollback deployment

# CI/CD
pnpm bundle:check        # Check bundle sizes
pnpm security:audit      # Security audit
```

## Troubleshooting

### Build Failing?

1. **Check logs** in GitHub Actions tab
2. **Run locally:** `pnpm validate`
3. **Fix errors** and push again

### Tests Failing?

1. **Run locally:** `pnpm test`
2. **Check coverage:** `pnpm test:coverage`
3. **Fix tests** and push

### Deployment Failing?

1. **Verify secrets** are set correctly
2. **Check Cloudflare** credentials
3. **Review logs** in GitHub Actions
4. **Rollback if needed:** `pnpm deployment:rollback`

## Common First-Time Issues

### Issue: "Required status checks not found"
**Fix:** Wait for first workflow run, then add checks to branch protection

### Issue: "Secrets not working"
**Fix:** Verify secret names match exactly (case-sensitive)

### Issue: "Can't merge PR"
**Fix:** Ensure all required checks pass and branch is up to date

### Issue: "Deployment unauthorized"
**Fix:** Check Cloudflare API token has correct permissions

## Workflow Status Badges

Add these to your README.md:

```markdown
![CI](https://github.com/your-org/kids-home-hub/workflows/CI%20Pipeline/badge.svg)
![Security](https://github.com/your-org/kids-home-hub/workflows/Security%20Scanning/badge.svg)
![Performance](https://github.com/your-org/kids-home-hub/workflows/Performance%20Monitoring/badge.svg)
```

## Notification Setup (Optional)

### Slack Notifications

1. Create Slack incoming webhook
2. Add to GitHub secrets as `SLACK_WEBHOOK_URL`
3. Notifications will auto-send on:
   - CI failures
   - Security issues
   - Deployments
   - Rollbacks

## Next Steps

Once basic pipeline is working:

1. 📊 **Set up monitoring**
   - Add Codecov for coverage tracking
   - Enable Lighthouse CI dashboard

2. 🔒 **Enhance security**
   - Add Snyk token
   - Enable signed commits
   - Set up CODEOWNERS

3. 📈 **Optimize performance**
   - Review bundle sizes
   - Improve Lighthouse scores
   - Optimize build times

4. 📝 **Team onboarding**
   - Share this guide with team
   - Set up code review process
   - Define deployment schedule

## Pipeline Diagram

```
┌─────────────┐
│   Commit    │
└──────┬──────┘
       │
       ├──► Lint ──────┐
       ├──► Type Check ─┤
       ├──► Tests ──────┤
       ├──► Build ──────┤──► Quality Gate
       ├──► Security ───┤
       └──► Performance ┘
       │
       ▼
┌──────────────┐
│   Staging    │
└──────┬───────┘
       │
       ├──► Smoke Tests
       └──► E2E Tests
       │
       ▼
┌──────────────┐
│Manual Approval│
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Production  │
└──────────────┘
```

## Quality Standards

Your pipeline enforces:

- ✅ **80% code coverage** minimum
- ✅ **Zero ESLint errors** allowed
- ✅ **No TypeScript errors**
- ✅ **Bundle size < 1MB**
- ✅ **Lighthouse score > 90**
- ✅ **No critical vulnerabilities**
- ✅ **All tests passing**

## Support & Resources

- 📖 [Full Documentation](../CI_CD_DOCUMENTATION.md)
- 🔐 [Secrets Setup](./SECRETS_SETUP.md)
- 🛡️ [Branch Protection](./BRANCH_PROTECTION.md)
- 💬 Slack: #devops-help
- 📧 Email: devops@your-company.com

## Success Checklist

Before considering setup complete:

- [ ] All required secrets configured
- [ ] Branch protection rules active
- [ ] Environments configured
- [ ] First PR successfully merged
- [ ] Staging deployment working
- [ ] Production deployment tested
- [ ] Team notified and trained
- [ ] Documentation reviewed
- [ ] Monitoring/alerts set up
- [ ] Rollback procedure tested

## Congratulations! 🎉

Your enterprise-grade CI/CD pipeline is now active!

**What you've achieved:**
- ✅ Automated testing on every commit
- ✅ Security scanning on every PR
- ✅ Performance monitoring
- ✅ Automated deployments
- ✅ Quality gates preventing bad code
- ✅ Rollback capabilities
- ✅ Production-ready infrastructure

**Next commit will trigger:**
- All quality checks
- Security scans
- Performance analysis
- Automated deployment pipeline

Happy coding! 🚀

---

Questions? Check the [full documentation](../CI_CD_DOCUMENTATION.md) or contact DevOps.
