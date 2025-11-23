# GitHub Secrets & Environment Variables Configuration Guide

**For**: Kids Home Hub Deployment Pipeline
**Last Updated**: November 23, 2025

---

## Quick Setup Checklist

- [ ] Cloudflare API Token created
- [ ] Cloudflare Account ID copied
- [ ] GitHub Secrets configured
- [ ] GitHub Environments created
- [ ] Branch protection rules set
- [ ] First test deployment successful

---

## Required Secrets (Must Have)

These secrets are **required** for the deployment pipeline to work.

### 1. CLOUDFLARE_API_TOKEN

**What it is**: API token for deploying to Cloudflare Pages

**How to get it**:

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Click on your profile icon (top right) → "My Profile"
3. Go to "API Tokens" tab
4. Click "Create Token"
5. Use "Edit Cloudflare Workers" template or create custom with these permissions:
   - **Account** → **Cloudflare Pages** → **Edit**
   - **Account** → **Account Settings** → **Read**
6. Click "Continue to summary"
7. Click "Create Token"
8. **Copy the token** (you'll only see it once!)

**Where to add it**:
- GitHub Repository → Settings → Secrets and variables → Actions
- Click "New repository secret"
- Name: `CLOUDFLARE_API_TOKEN`
- Value: Paste the token
- Click "Add secret"

**Permissions needed**:
```
Account - Cloudflare Pages:Edit
Account - Account Settings:Read
```

**Test it works**:
```bash
# Export token locally
export CLOUDFLARE_API_TOKEN="your-token-here"

# Test with wrangler
wrangler whoami

# Should show your Cloudflare account details
```

---

### 2. CLOUDFLARE_ACCOUNT_ID

**What it is**: Your Cloudflare account identifier

**How to get it**:

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Click on any domain or Workers & Pages
3. Scroll down in the right sidebar
4. Copy the "Account ID"

Alternative method:
```bash
# If you have wrangler installed and logged in
wrangler whoami
# Look for "Account ID" in the output
```

**Where to add it**:
- GitHub Repository → Settings → Secrets and variables → Actions
- Click "New repository secret"
- Name: `CLOUDFLARE_ACCOUNT_ID`
- Value: Paste the account ID (32-character hex string)
- Click "Add secret"

**Format**: 32-character hexadecimal string
**Example**: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`

---

## Optional Secrets (Recommended)

These secrets enable additional features but are not required for basic deployment.

### 3. CODECOV_TOKEN

**What it is**: Token for uploading code coverage reports to Codecov

**How to get it**:

1. Go to [Codecov.io](https://codecov.io)
2. Sign in with GitHub
3. Add your repository
4. Go to Settings → General
5. Copy the "Repository Upload Token"

**Where to add it**:
- GitHub Repository → Settings → Secrets and variables → Actions
- Name: `CODECOV_TOKEN`
- Value: Paste the token

**Used in**: `ci.yml` workflow (Unit Tests job)

**What happens if not set**: Coverage reports won't be uploaded to Codecov (tests still run)

---

### 4. SNYK_TOKEN

**What it is**: Token for Snyk security vulnerability scanning

**How to get it**:

1. Go to [Snyk.io](https://snyk.io)
2. Sign up/Sign in
3. Go to Account Settings
4. Click "General" → "Auth Token"
5. Click "Click to show" and copy

**Where to add it**:
- GitHub Repository → Settings → Secrets and variables → Actions
- Name: `SNYK_TOKEN`
- Value: Paste the token

**Used in**: `security.yml` workflow (Snyk job)

**What happens if not set**: Snyk scans won't run (NPM audit still runs)

---

### 5. SLACK_WEBHOOK_URL

**What it is**: Webhook URL for sending deployment notifications to Slack

**How to get it**:

1. Go to your Slack workspace
2. Go to [Slack Apps](https://api.slack.com/apps)
3. Create a new app or use existing
4. Enable "Incoming Webhooks"
5. Click "Add New Webhook to Workspace"
6. Select channel for notifications
7. Copy the webhook URL

**Where to add it**:
- GitHub Repository → Settings → Secrets and variables → Actions
- Name: `SLACK_WEBHOOK_URL`
- Value: Paste the webhook URL (starts with `https://hooks.slack.com/`)

**Used in**: `ci.yml`, `cd.yml`, `security.yml` workflows

**What happens if not set**: No Slack notifications (deployments still work)

**Notification Examples**:
- ✅ "CI Pipeline passed"
- 🚀 "Deploying to production"
- ❌ "Deployment failed"
- 🔄 "Rollback initiated"

---

### 6. LHCI_GITHUB_APP_TOKEN

**What it is**: Token for Lighthouse CI to post comments on PRs

**How to get it**:

1. Install [Lighthouse CI GitHub App](https://github.com/apps/lighthouse-ci)
2. Grant access to your repository
3. The app will automatically use `GITHUB_TOKEN`

**Alternative (manual token)**:
1. Create GitHub Personal Access Token
2. Scopes needed: `repo`, `write:discussion`
3. Copy the token

**Where to add it**:
- GitHub Repository → Settings → Secrets and variables → Actions
- Name: `LHCI_GITHUB_APP_TOKEN`
- Value: Paste the token

**Used in**: `performance.yml` workflow

**What happens if not set**: Lighthouse runs but doesn't comment on PRs

---

## GitHub Actions Built-in Secrets

These are automatically available in workflows (no configuration needed).

### GITHUB_TOKEN

**What it is**: Automatically generated token for GitHub API access

**Permissions**: Read/write access to repository

**Used for**:
- Creating PR comments
- Uploading artifacts
- Creating releases

**No setup required** - GitHub provides this automatically

---

## Environment Variables (Non-Secret)

These are not sensitive and can be set as GitHub Variables (not secrets).

### How to add GitHub Variables

1. Go to GitHub Repository → Settings
2. Secrets and variables → Actions
3. Click "Variables" tab
4. Click "New repository variable"

### Recommended Variables

| Variable | Value | Description |
|----------|-------|-------------|
| `NODE_VERSION` | `20.x` | Node.js version for CI |
| `PNPM_VERSION` | `8.15.0` | pnpm version |
| `PRODUCTION_URL` | `https://kids-home-hub.pages.dev` | Production URL |

---

## Cloudflare Pages Environment Variables

Set these in Cloudflare Dashboard for runtime configuration.

**Where to set**: Cloudflare Dashboard → Pages → kids-home-hub-pwa → Settings → Environment variables

### Production Environment

| Variable | Value | Description |
|----------|-------|-------------|
| `NODE_VERSION` | `20` | Node.js version |
| `ENABLE_ANALYTICS` | `true` | Enable web analytics |

### Preview Environment

| Variable | Value | Description |
|----------|-------|-------------|
| `NODE_VERSION` | `20` | Node.js version |
| `ENABLE_ANALYTICS` | `false` | Disable in preview |

---

## Verification Steps

### Test Configuration

After setting up secrets, verify they work:

#### 1. Test Cloudflare Connection

```bash
# Set your token locally
export CLOUDFLARE_API_TOKEN="your-token"

# Test authentication
wrangler whoami

# Expected output:
# ✓ Successfully logged in
# Account Name: Your Name
# Account ID: abc123...
```

#### 2. Trigger a Test Workflow

```bash
# Create a test branch
git checkout -b test-deployment

# Make a small change
echo "# Test" >> README.md

# Commit and push
git add README.md
git commit -m "test: verify deployment pipeline"
git push origin test-deployment

# Create PR on GitHub
# Watch GitHub Actions tab
```

**Expected results**:
- ✅ CI Pipeline runs successfully
- ✅ Security scans complete (if tokens set)
- ✅ Preview deployment created
- ✅ No authentication errors

#### 3. Check Secrets in Workflow Logs

Secrets are masked in logs, you'll see:
```
Using CLOUDFLARE_API_TOKEN: ***
Deploying to account: ***
```

If you see actual values, something is wrong!

---

## Security Best Practices

### Do's ✅

- ✅ Use GitHub Secrets for all sensitive data
- ✅ Rotate tokens every 90 days
- ✅ Use minimum required permissions
- ✅ Set token expiration dates
- ✅ Review token usage regularly
- ✅ Delete unused tokens

### Don'ts ❌

- ❌ Never commit secrets to git
- ❌ Never share secrets in chat/email
- ❌ Never log secrets in workflows
- ❌ Never use personal tokens for production
- ❌ Never grant more permissions than needed
- ❌ Never skip token rotation

### If a Secret is Leaked

**Immediate actions**:

1. **Revoke the token immediately**
   - Cloudflare: Delete token from dashboard
   - GitHub: Delete personal access token
   - Snyk: Regenerate token

2. **Generate new token**
   - Create new token with same permissions
   - Update GitHub Secret

3. **Review access logs**
   - Check Cloudflare audit logs
   - Review GitHub Actions logs
   - Look for unauthorized usage

4. **Rotate related secrets**
   - Change any secrets that might be related
   - Update all dependent systems

---

## Troubleshooting

### Secret Not Working

**Problem**: Workflow fails with "Invalid API token"

**Solutions**:

1. **Check secret name matches exactly**
   ```yaml
   # In workflow file
   CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}

   # Must match secret name in GitHub
   ```

2. **Verify token permissions**
   - Go to Cloudflare → API Tokens
   - Check token has required permissions
   - Regenerate if needed

3. **Check token hasn't expired**
   - Some tokens have expiration dates
   - Regenerate if expired

4. **Verify account ID is correct**
   - Double-check the account ID
   - Must be 32-character hex string

### Secret Not Available in PR from Fork

**Problem**: Secrets don't work in PRs from forked repositories

**Explanation**: This is a GitHub security feature - secrets are not available to forks

**Solutions**:
- Use `pull_request_target` event (risky!)
- Require contributors to create branches in main repo
- Manual testing for fork PRs

### Environment Not Found

**Problem**: "Environment 'production' not found"

**Solution**:
1. Go to Settings → Environments
2. Create "production" environment
3. Add protection rules
4. Re-run workflow

---

## Quick Reference

### Secret Priority

1. **Must Have** (deployments won't work):
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`

2. **Should Have** (better experience):
   - `CODECOV_TOKEN`
   - `SNYK_TOKEN`

3. **Nice to Have** (convenience):
   - `SLACK_WEBHOOK_URL`
   - `LHCI_GITHUB_APP_TOKEN`

### Setup Time Estimate

- Cloudflare tokens: 5 minutes
- GitHub configuration: 5 minutes
- Optional services: 15 minutes
- Testing: 10 minutes
- **Total**: ~35 minutes

### Links

- [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)
- [GitHub Secrets](https://github.com/[your-org]/kids-home-hub/settings/secrets/actions)
- [Codecov](https://codecov.io)
- [Snyk](https://snyk.io)
- [Slack Webhooks](https://api.slack.com/messaging/webhooks)

---

## Support

**Need help?**
- Check [Deployment Pipeline Guide](./DEPLOYMENT_PIPELINE_GUIDE.md)
- Review [CI/CD Documentation](./CI_CD_DOCUMENTATION.md)
- Create GitHub issue with `deployment` label

---

**Last Updated**: 2025-11-23
**Version**: 1.0.0
