# Enterprise CI/CD Pipeline

## Overview

Kids Home Hub features a production-ready, enterprise-grade CI/CD pipeline with strict quality gates, comprehensive security scanning, and automated deployments.

## Quick Links

- 🚀 [Quick Start Guide](.github/CI_CD_QUICKSTART.md) - Get started in 15 minutes
- 📖 [Full Documentation](CI_CD_DOCUMENTATION.md) - Complete pipeline documentation
- 🔐 [Secrets Setup](.github/SECRETS_SETUP.md) - Configure GitHub secrets
- 🛡️ [Branch Protection](.github/BRANCH_PROTECTION.md) - Branch protection rules

## Pipeline Overview

```
Pull Request → CI Checks → Security Scans → Performance Tests
                    ↓
              Quality Gate
                    ↓
    Merge → Auto Deploy Staging → Integration Tests
                    ↓
           Manual Approval Required
                    ↓
         Deploy Production → Smoke Tests
```

## Quality Gates

All PRs must pass:

| Check | Description | Threshold |
|-------|-------------|-----------|
| ✅ ESLint | Code quality & style | Zero errors |
| ✅ Prettier | Code formatting | 100% formatted |
| ✅ TypeScript | Type checking | Zero errors |
| ✅ Unit Tests | Component testing | 80% coverage |
| ✅ Integration Tests | API testing | All passing |
| ✅ E2E Tests | Browser testing | All passing |
| ✅ Build | Production build | Success |
| 🔒 Security Scan | Vulnerability check | No critical/high |
| 📦 Bundle Size | Size budget | < 1 MB total |
| ⚡ Lighthouse | Performance score | > 90 |

## Features

### Continuous Integration (CI)
- Automated testing on every commit
- Parallel job execution for speed
- Code coverage tracking with Codecov
- Multi-browser E2E testing (Chrome, Firefox, Safari)
- Mobile device testing (iOS, Android)

### Security Scanning
- NPM audit for known vulnerabilities
- Snyk deep dependency scanning
- CodeQL static code analysis
- Gitleaks secret detection
- TruffleHog verified secrets
- License compliance checking
- Dependency review on PRs

### Performance Monitoring
- Bundle size budget enforcement
- Lighthouse CI (Performance, A11y, PWA)
- Load testing with k6
- Memory profiling
- Build time tracking
- Core Web Vitals monitoring

### Continuous Deployment (CD)
- Auto-deploy to staging on merge
- Manual approval for production
- Automated backup creation
- Smoke tests after deployment
- Auto-rollback on failure
- Blue-green deployment via Cloudflare
- GitHub release creation

### Automation
- Dependabot for dependency updates
- Automated security alerts
- Slack notifications
- PR status comments
- Deployment tracking

## Workflows

### 1. CI Pipeline
**File:** `.github/workflows/ci.yml`
**Trigger:** Push to main/develop, Pull requests
**Duration:** ~10-15 minutes

Jobs:
- Setup & Cache
- Lint Code
- TypeScript Type Check
- Unit Tests (with coverage)
- Integration Tests
- E2E Tests
- Build
- Quality Gate

### 2. Security Scanning
**File:** `.github/workflows/security.yml`
**Trigger:** Push, PR, Daily at 2 AM UTC
**Duration:** ~5-8 minutes

Jobs:
- NPM Audit
- Snyk Vulnerability Scan
- CodeQL Analysis
- Secret Detection
- License Compliance
- OSV Scanner

### 3. Performance Monitoring
**File:** `.github/workflows/performance.yml`
**Trigger:** Push, PR
**Duration:** ~8-12 minutes

Jobs:
- Bundle Size Analysis
- Lighthouse CI
- Load Testing
- Memory Profiling
- Build Time Tracking

### 4. CD Pipeline
**File:** `.github/workflows/cd.yml`
**Trigger:** Merge to main, Manual
**Duration:** ~15-20 minutes

Jobs:
- Prepare Deployment
- Quality Check (reuse CI)
- Build Production
- Deploy Staging
- Integration Tests (Staging)
- Deploy Production (manual approval)
- Post-deployment Tasks

## Usage

### Local Development

```bash
# Install dependencies
pnpm install

# Run dev server
pnpm dev

# Run all quality checks
pnpm validate

# Run tests
pnpm test                  # Unit tests
pnpm test:watch           # Watch mode
pnpm test:coverage        # With coverage
pnpm test:e2e            # E2E tests

# Code quality
pnpm lint                 # Check linting
pnpm lint:fix            # Fix issues
pnpm format              # Format code
pnpm type-check          # TypeScript

# Build
pnpm build               # Production build
pnpm build:analyze       # With analysis
```

### Creating a Pull Request

```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push and create PR
git push origin feature/my-feature
gh pr create
```

The CI/CD pipeline will automatically:
1. Run all quality checks
2. Perform security scans
3. Check performance
4. Report results on PR
5. Block merge if checks fail

### Deployment

#### Staging (Automatic)
```bash
# Merge PR to main
# Pipeline automatically deploys to staging
# URL: https://staging.kids-home-hub.com
```

#### Production (Manual Approval)
```bash
# Go to GitHub Actions
# Find "CD Pipeline" workflow
# Click "Review deployments"
# Approve "production" environment
# Deployment proceeds automatically
```

#### Rollback
```bash
# Via script
pnpm deployment:rollback -- --environment=production

# Or via Cloudflare Dashboard
# Workers → kids-home-hub-production → Deployments → Rollback
```

## Configuration

### Required Secrets

Set in **Settings → Secrets and variables → Actions**:

```
CLOUDFLARE_API_TOKEN      (Required)
CLOUDFLARE_ACCOUNT_ID     (Required)
SNYK_TOKEN               (Optional)
CODECOV_TOKEN            (Optional)
SLACK_WEBHOOK_URL        (Optional)
```

See [Secrets Setup](.github/SECRETS_SETUP.md) for details.

### Branch Protection

Configure in **Settings → Branches**:

- Branch: `main`
- Require PR reviews: 1 minimum
- Require status checks: All CI checks
- Require up-to-date branches
- Include administrators

See [Branch Protection](.github/BRANCH_PROTECTION.md) for details.

### Environments

Configure in **Settings → Environments**:

**staging:**
- No protection rules
- Auto-deploy on merge to main

**production:**
- Required reviewers: 1
- Deployment branch: main only
- Manual approval required

## Scripts

All CI/CD scripts in `scripts/ci/`:

| Script | Purpose |
|--------|---------|
| `smoke-test.js` | Post-deployment health checks |
| `load-test.js` | k6 load testing |
| `bundle-check.js` | Bundle size validation |
| `deployment-backup.js` | Create deployment backups |
| `deployment-rollback.js` | Rollback deployments |

## Monitoring

### GitHub Actions
- View workflow runs in "Actions" tab
- Check logs for failures
- Download artifacts

### Codecov
- Coverage reports and trends
- PR coverage changes
- File-level coverage

### Lighthouse CI
- Performance trends
- Accessibility scores
- PWA compliance

### Slack
- Build notifications
- Deployment updates
- Security alerts

## Troubleshooting

### CI Failing?

1. Check GitHub Actions logs
2. Run `pnpm validate` locally
3. Fix errors and push
4. Workflow reruns automatically

### Tests Failing?

1. Run `pnpm test` locally
2. Check coverage with `pnpm test:coverage`
3. Fix tests and verify locally
4. Push changes

### Deployment Failed?

1. Check deployment logs
2. Verify secrets configured
3. Run smoke tests: `pnpm test:smoke`
4. Rollback if needed: `pnpm deployment:rollback`

### Bundle Size Exceeded?

1. Run `pnpm build:analyze`
2. Identify large dependencies
3. Use code splitting
4. Remove unused code

## Best Practices

### Commits
- Use conventional commits (feat, fix, docs, etc.)
- Write clear commit messages
- Keep commits focused and atomic

### Pull Requests
- Keep PRs small (< 400 lines)
- Include tests for new features
- Update documentation
- Fill out PR template
- Request reviews

### Testing
- Write tests before code (TDD)
- Aim for > 80% coverage
- Test edge cases
- Keep tests fast and focused

### Security
- Never commit secrets
- Review dependency updates
- Fix vulnerabilities promptly
- Use environment variables

## Performance Budgets

### Bundle Sizes
- Worker: 500 KB max
- Main bundle: 300 KB max
- Vendor bundle: 500 KB max
- Total: 1 MB max

### Lighthouse Scores
- Performance: 90+
- Accessibility: 90+
- Best Practices: 90+
- SEO: 90+
- PWA: 90+

### Core Web Vitals
- FCP: < 2s
- LCP: < 2.5s
- CLS: < 0.1
- TBT: < 300ms

## Support

- 📖 [Documentation](CI_CD_DOCUMENTATION.md)
- 💬 Slack: #devops-help
- 📧 Email: devops@your-company.com
- 🐛 Issues: GitHub Issues

## Status

![CI](https://github.com/your-org/kids-home-hub/workflows/CI%20Pipeline/badge.svg)
![Security](https://github.com/your-org/kids-home-hub/workflows/Security%20Scanning/badge.svg)
![Performance](https://github.com/your-org/kids-home-hub/workflows/Performance%20Monitoring/badge.svg)
![Deployment](https://github.com/your-org/kids-home-hub/workflows/CD%20Pipeline/badge.svg)

---

**Last Updated:** 2025-11-23
**Pipeline Version:** 2.0.0
**Maintained by:** DevOps Team
