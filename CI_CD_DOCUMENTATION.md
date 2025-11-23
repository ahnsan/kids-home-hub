# CI/CD Documentation - Kids Home Hub

## Overview

This document describes the enterprise-grade CI/CD pipeline for the Kids Home Hub application. The pipeline enforces strict quality gates, security scanning, performance monitoring, and automated deployments with rollback capabilities.

## Table of Contents

- [Architecture](#architecture)
- [Workflows](#workflows)
- [Quality Gates](#quality-gates)
- [Security Scanning](#security-scanning)
- [Performance Monitoring](#performance-monitoring)
- [Deployment Strategy](#deployment-strategy)
- [Setup Instructions](#setup-instructions)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)

## Architecture

The CI/CD pipeline consists of four main workflows:

1. **CI Pipeline** - Continuous Integration with quality checks
2. **Security Scanning** - Automated security and vulnerability scanning
3. **Performance Monitoring** - Bundle size, Lighthouse, and load testing
4. **CD Pipeline** - Continuous Deployment to staging and production

### Pipeline Flow

```
┌─────────────┐
│   Commit    │
└──────┬──────┘
       │
       ├─────► CI Pipeline (Parallel)
       │       ├─ Lint
       │       ├─ Type Check
       │       ├─ Unit Tests
       │       ├─ Integration Tests
       │       ├─ E2E Tests
       │       └─ Build
       │
       ├─────► Security Scanning (Parallel)
       │       ├─ NPM Audit
       │       ├─ Snyk
       │       ├─ CodeQL
       │       ├─ Secret Detection
       │       └─ License Compliance
       │
       └─────► Performance Monitoring (Parallel)
               ├─ Bundle Size Analysis
               ├─ Lighthouse CI
               ├─ Load Testing
               ├─ Memory Profiling
               └─ Build Time Tracking
       │
       ▼
┌──────────────┐
│ Quality Gate │ ◄─── All checks must pass
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Deploy     │
│   Staging    │
└──────┬───────┘
       │
       ├─────► Smoke Tests
       ├─────► Integration Tests
       └─────► E2E Tests
       │
       ▼
┌──────────────┐
│Manual Approval│
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Deploy     │
│ Production   │
└──────┬───────┘
       │
       ├─────► Smoke Tests
       ├─────► Auto Rollback (if failed)
       └─────► Monitoring
```

## Workflows

### 1. CI Pipeline (.github/workflows/ci.yml)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`
- Manual workflow dispatch

**Jobs:**

#### Setup
- Caches dependencies for faster subsequent runs
- Installs npm packages

#### Lint
- Runs ESLint with zero-error policy
- Checks Prettier formatting
- Uploads ESLint results

#### Type Check
- TypeScript compilation check
- Ensures type safety across codebase

#### Unit Tests
- Runs Vitest with coverage
- Enforces 80% minimum coverage threshold
- Uploads coverage to Codecov

#### Integration Tests
- Tests API integrations
- Validates data flow between services

#### E2E Tests
- Playwright tests across multiple browsers
- Desktop and mobile device testing
- Visual regression testing

#### Build
- Production build
- Bundle analysis
- Artifact upload for deployment

#### Quality Gate
- Validates all previous jobs passed
- Fails pipeline if any check failed
- Posts results to PR

### 2. Security Scanning (.github/workflows/security.yml)

**Triggers:**
- Push to `main` or `develop`
- Pull requests
- Daily at 2 AM UTC (scheduled)
- Manual workflow dispatch

**Jobs:**

#### NPM Audit
- Scans for known vulnerabilities
- Fails on critical/high severity
- Generates audit report

#### Snyk Vulnerability Scan
- Deep dependency scanning
- License compliance check
- Security vulnerability database

#### CodeQL Analysis
- Static code analysis
- Security pattern detection
- Identifies potential vulnerabilities

#### Secret Scanning
- Gitleaks for secret detection
- TruffleHog for verified secrets
- Prevents credential leaks

#### License Compliance
- Checks dependency licenses
- Blocks forbidden licenses (GPL, AGPL)
- Generates license report

#### OSV Scanner
- Open Source Vulnerabilities database
- Cross-references known CVEs
- Additional vulnerability layer

### 3. Performance Monitoring (.github/workflows/performance.yml)

**Triggers:**
- Push to `main` or `develop`
- Pull requests
- Manual workflow dispatch

**Jobs:**

#### Bundle Size Analysis
- Tracks bundle sizes
- Enforces size budgets
- Fails if budget exceeded
- Generates size reports

**Budgets:**
- Worker: 500 KB
- Main bundle: 300 KB
- Vendor bundle: 500 KB
- Total: 1 MB

#### Lighthouse CI
- Performance audits
- Accessibility checks
- Best practices validation
- PWA compliance

**Thresholds (minimum 90%):**
- Performance
- Accessibility
- Best Practices
- SEO
- PWA Score

#### Load Testing
- k6 load tests
- Stress testing under load
- Response time validation
- Error rate monitoring

#### Memory Profiling
- Heap usage tracking
- Memory leak detection
- Performance optimization

#### Build Time Tracking
- Monitors build performance
- Fails if build > 120 seconds
- Identifies build regressions

### 4. CD Pipeline (.github/workflows/cd.yml)

**Triggers:**
- Push to `main` (staging deployment)
- Manual workflow dispatch (production)

**Jobs:**

#### Prepare Deployment
- Generates version number
- Determines target environment
- Creates deployment metadata

#### Quality Check
- Reuses CI pipeline
- Ensures all quality gates pass
- Can be skipped for emergencies

#### Build Production
- Production-optimized build
- Creates deployment package
- Uploads artifacts

#### Deploy Staging
- Auto-deploys to staging
- Runs smoke tests
- Validates deployment

#### Integration Tests (Staging)
- Full integration test suite
- E2E tests on staging
- Validates production readiness

#### Deploy Production
- Requires manual approval
- Creates deployment backup
- Deploys to production
- Runs smoke tests
- Auto-rollback on failure
- Creates GitHub release

## Quality Gates

### Mandatory Checks

All checks must pass before merge:

1. **ESLint**: Zero errors, zero warnings
2. **Prettier**: All code formatted
3. **TypeScript**: No type errors
4. **Unit Tests**: 80% minimum coverage
5. **Integration Tests**: All passing
6. **E2E Tests**: All passing
7. **Build**: Successful compilation
8. **Security**: No critical/high vulnerabilities
9. **Bundle Size**: Within budget
10. **Lighthouse**: Score > 90

### Coverage Requirements

Minimum code coverage: 80%
- Lines: 80%
- Functions: 80%
- Branches: 80%
- Statements: 80%

## Security Scanning

### Vulnerability Scanning

**Daily automated scans:**
- NPM Audit
- Snyk vulnerability database
- CodeQL static analysis
- OSV Scanner

**On every commit:**
- Secret detection (Gitleaks, TruffleHog)
- Dependency review
- License compliance

### Severity Levels

| Severity | Action |
|----------|--------|
| Critical | Immediate failure, block merge |
| High     | Immediate failure, block merge |
| Moderate | Warning, requires review |
| Low      | Informational only |

### Forbidden Licenses

The following licenses are blocked:
- GPL-2.0
- GPL-3.0
- AGPL-3.0
- LGPL (all versions)

## Performance Monitoring

### Bundle Size Budgets

```javascript
{
  'worker.js': 500 KB,
  'main.bundle.js': 300 KB,
  'vendor.bundle.js': 500 KB,
  'total': 1 MB
}
```

### Lighthouse Thresholds

All scores must be ≥ 90:
- Performance: 90+
- Accessibility: 90+
- Best Practices: 90+
- SEO: 90+
- PWA: 90+

### Core Web Vitals

- First Contentful Paint (FCP): < 2s
- Largest Contentful Paint (LCP): < 2.5s
- Cumulative Layout Shift (CLS): < 0.1
- Total Blocking Time (TBT): < 300ms
- Speed Index: < 3s
- Time to Interactive (TTI): < 3.5s

### Load Testing

k6 load test stages:
1. Ramp up to 10 users (1 min)
2. Hold 10 users (3 min)
3. Ramp up to 50 users (1 min)
4. Hold 50 users (3 min)
5. Ramp up to 100 users (1 min)
6. Hold 100 users (2 min)
7. Ramp down (1 min)

## Deployment Strategy

### Environments

#### Staging
- **URL**: https://staging.kids-home-hub.com
- **Deployment**: Automatic on merge to `main`
- **Purpose**: Pre-production testing
- **Data**: Test data only

#### Production
- **URL**: https://kids-home-hub.com
- **Deployment**: Manual approval required
- **Purpose**: Live application
- **Data**: Real user data

### Deployment Process

1. **Code Push**: Developer pushes to `main`
2. **CI Pipeline**: All quality gates must pass
3. **Staging Deploy**: Automatic deployment
4. **Staging Tests**: Integration and E2E tests
5. **Manual Approval**: Team lead approves production
6. **Backup**: Automatic backup created
7. **Production Deploy**: Deploy to production
8. **Smoke Tests**: Validate deployment
9. **Monitoring**: Track performance and errors
10. **Rollback**: Automatic if smoke tests fail

### Rollback Strategy

**Automatic Rollback Triggers:**
- Smoke tests fail
- Health check fails
- Error rate spike

**Manual Rollback:**
```bash
npm run deployment:rollback -- --environment=production
```

### Blue-Green Deployment

Cloudflare Workers automatically provides blue-green deployment:
- New version deployed alongside old
- Traffic gradually shifted to new version
- Instant rollback if issues detected

## Setup Instructions

### Prerequisites

1. Node.js 18+ and pnpm 8+
2. GitHub repository
3. Cloudflare Workers account
4. Snyk account (optional)
5. Codecov account (optional)

### Initial Setup

1. **Clone Repository**
   ```bash
   git clone https://github.com/your-org/kids-home-hub.git
   cd kids-home-hub
   ```

2. **Install Dependencies**
   ```bash
   pnpm install
   ```

3. **Configure GitHub Secrets**

   Navigate to GitHub Settings → Secrets and add:

   ```
   CLOUDFLARE_API_TOKEN=your-api-token
   CLOUDFLARE_ACCOUNT_ID=your-account-id
   SNYK_TOKEN=your-snyk-token (optional)
   SLACK_WEBHOOK_URL=your-slack-webhook (optional)
   CODECOV_TOKEN=your-codecov-token (optional)
   LHCI_GITHUB_APP_TOKEN=your-lighthouse-token (optional)
   ```

4. **Configure Branch Protection**

   Settings → Branches → Add rule for `main`:
   - ✅ Require pull request reviews (1 minimum)
   - ✅ Require status checks to pass
   - ✅ Require branches to be up to date
   - ✅ Include administrators

   Required status checks:
   - Lint Code
   - TypeScript Type Check
   - Unit Tests
   - Integration Tests
   - E2E Tests
   - Build Application
   - Quality Gate

5. **Configure Environments**

   Settings → Environments → New environment:

   **Staging:**
   - No protection rules
   - Environment secrets (if needed)

   **Production:**
   - ✅ Required reviewers (1 minimum)
   - ✅ Wait timer: 0 minutes
   - Environment secrets (if needed)

### Local Development

1. **Run Locally**
   ```bash
   pnpm dev
   ```

2. **Run Tests**
   ```bash
   pnpm test              # Unit tests
   pnpm test:integration  # Integration tests
   pnpm test:e2e          # E2E tests
   pnpm test:coverage     # With coverage
   ```

3. **Lint and Format**
   ```bash
   pnpm lint              # Check linting
   pnpm lint:fix          # Fix linting issues
   pnpm format            # Format code
   pnpm format:check      # Check formatting
   ```

4. **Type Check**
   ```bash
   pnpm type-check
   ```

5. **Build**
   ```bash
   pnpm build
   pnpm build:analyze     # With bundle analysis
   ```

6. **Validate All**
   ```bash
   pnpm validate          # Run all checks
   ```

## Configuration

### CI/CD Scripts

All CI/CD scripts are located in `scripts/ci/`:

- `smoke-test.js` - Post-deployment health checks
- `load-test.js` - k6 load testing script
- `bundle-check.js` - Bundle size validation
- `deployment-backup.js` - Create deployment backups
- `deployment-rollback.js` - Rollback deployments

### Configuration Files

- `.github/workflows/` - GitHub Actions workflows
- `.eslintrc.json` - ESLint configuration
- `.prettierrc.json` - Prettier configuration
- `tsconfig.json` - TypeScript configuration
- `vitest.config.js` - Vitest testing configuration
- `playwright.config.js` - Playwright E2E configuration
- `.lighthouserc.json` - Lighthouse CI configuration
- `.github/dependabot.yml` - Dependabot configuration

### Environment Variables

**Required for CI:**
- `CLOUDFLARE_API_TOKEN` - Cloudflare API token
- `CLOUDFLARE_ACCOUNT_ID` - Cloudflare account ID

**Optional:**
- `SNYK_TOKEN` - Snyk authentication
- `SLACK_WEBHOOK_URL` - Slack notifications
- `CODECOV_TOKEN` - Codecov uploads
- `LHCI_GITHUB_APP_TOKEN` - Lighthouse CI

## Troubleshooting

### Common Issues

#### 1. Tests Failing in CI but Pass Locally

**Solution:**
- Ensure consistent Node.js version (use `.nvmrc`)
- Check for timezone-dependent tests
- Verify environment variables
- Clear cache and retry

#### 2. Bundle Size Budget Exceeded

**Solution:**
- Run `pnpm build:analyze` locally
- Identify large dependencies
- Use dynamic imports for code splitting
- Remove unused dependencies

#### 3. Lighthouse Score Below Threshold

**Solution:**
- Run Lighthouse locally
- Optimize images
- Minimize JavaScript
- Enable compression
- Use CDN for static assets

#### 4. Security Vulnerabilities Detected

**Solution:**
- Run `pnpm security:audit` locally
- Update vulnerable dependencies
- Check if patch available
- Consider alternative packages

#### 5. Deployment Failed

**Solution:**
- Check smoke test logs
- Verify Cloudflare credentials
- Check wrangler configuration
- Review deployment logs
- Manual rollback if needed

#### 6. Coverage Below Threshold

**Solution:**
- Run `pnpm test:coverage` locally
- Identify uncovered code
- Add missing tests
- Remove dead code

### Getting Help

1. Check GitHub Actions logs
2. Review error messages
3. Consult this documentation
4. Check Cloudflare Workers dashboard
5. Contact DevOps team

## Monitoring and Alerting

### Slack Notifications

Notifications sent for:
- ✅ CI pipeline success/failure
- 🔒 Security scan results
- 🚀 Deployment success
- 🚨 Deployment failures
- 🔄 Rollback events

### GitHub Status Checks

All workflows report status to GitHub:
- PR comments with results
- Status badges on commits
- Required checks for merge

### Deployment Tracking

- Version tags created on production deploy
- GitHub releases with changelog
- Deployment logs archived

## Best Practices

### Development Workflow

1. Create feature branch
2. Write code and tests
3. Run `pnpm validate` locally
4. Commit with conventional commits
5. Push and create PR
6. Wait for CI to pass
7. Request review
8. Address feedback
9. Merge when approved

### Commit Messages

Follow conventional commits:
```
feat: add new feature
fix: bug fix
docs: documentation update
chore: maintenance task
test: test updates
refactor: code refactoring
perf: performance improvement
ci: CI/CD changes
```

### Pull Request Guidelines

- Keep PRs small (< 400 lines)
- Include tests
- Update documentation
- Fill out PR template
- Request specific reviewers
- Address all comments

### Security Best Practices

- Never commit secrets
- Use environment variables
- Review dependency updates
- Keep dependencies updated
- Monitor security alerts
- Enable signed commits

## Maintenance

### Weekly Tasks

- Review Dependabot PRs
- Check security alerts
- Monitor performance trends
- Review failed builds

### Monthly Tasks

- Update Node.js version
- Review and update dependencies
- Audit bundle sizes
- Review Lighthouse scores
- Optimize build times

### Quarterly Tasks

- Review CI/CD pipeline
- Update workflows
- Review security policies
- Conduct security audit
- Performance review

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [k6 Load Testing](https://k6.io/docs/)

## Support

For issues or questions:
- Create GitHub issue
- Contact DevOps team
- Check documentation
- Review workflow logs

---

Last Updated: 2025-11-23
Version: 2.0.0
