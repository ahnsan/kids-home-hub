# GitHub Secrets Configuration Guide

This guide explains how to configure all required secrets for the CI/CD pipeline.

## Required Secrets

### Cloudflare Workers (Required)

#### CLOUDFLARE_API_TOKEN
**Purpose:** Deploy to Cloudflare Workers

**How to get:**
1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Go to My Profile → API Tokens
3. Click "Create Token"
4. Use "Edit Cloudflare Workers" template
5. Configure permissions:
   - Account → Cloudflare Workers Scripts → Edit
   - Zone → Workers Routes → Edit
6. Set account and zone resources
7. Create token and copy immediately

**Permissions needed:**
```
Account:Cloudflare Workers Scripts:Edit
Zone:Workers Routes:Edit
```

#### CLOUDFLARE_ACCOUNT_ID
**Purpose:** Identify your Cloudflare account

**How to get:**
1. Log in to Cloudflare Dashboard
2. Select any domain
3. Scroll down to API section on Overview page
4. Copy Account ID

**Format:** 32-character hexadecimal string

### Security Scanning (Optional but Recommended)

#### SNYK_TOKEN
**Purpose:** Automated vulnerability scanning

**How to get:**
1. Sign up at [Snyk.io](https://snyk.io/)
2. Go to Account Settings
3. Click "Auth Token" in left menu
4. Copy your token or generate new one

**Alternative:** Use npm audit only (no token required)

### Code Coverage (Optional)

#### CODECOV_TOKEN
**Purpose:** Upload code coverage reports

**How to get:**
1. Sign up at [Codecov.io](https://codecov.io/)
2. Add your GitHub repository
3. Copy the repository upload token

**Note:** Public repositories may not need token

### Notifications (Optional)

#### SLACK_WEBHOOK_URL
**Purpose:** Send build/deployment notifications to Slack

**How to get:**
1. Go to Slack workspace settings
2. Navigate to Apps → Incoming Webhooks
3. Click "Add to Slack"
4. Choose channel for notifications
5. Copy webhook URL

**Format:** `https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXX`

### Lighthouse CI (Optional)

#### LHCI_GITHUB_APP_TOKEN
**Purpose:** Post Lighthouse results to PRs

**How to get:**
1. Install [Lighthouse CI GitHub App](https://github.com/apps/lighthouse-ci)
2. Configure for your repository
3. Token is automatically provided

**Alternative:** Use temporary public storage (no token needed)

## Setting Up Secrets

### Via GitHub Web Interface

1. Navigate to your repository
2. Click **Settings**
3. Click **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Enter name and value
6. Click **Add secret**

### Via GitHub CLI

```bash
# Install GitHub CLI if not already installed
brew install gh

# Authenticate
gh auth login

# Add secrets
gh secret set CLOUDFLARE_API_TOKEN
gh secret set CLOUDFLARE_ACCOUNT_ID
gh secret set SNYK_TOKEN
gh secret set CODECOV_TOKEN
gh secret set SLACK_WEBHOOK_URL
gh secret set LHCI_GITHUB_APP_TOKEN
```

### Via GitHub API

```bash
# Encrypt and add secret
gh secret set SECRET_NAME --body "secret-value"
```

## Environment-Specific Secrets

### Staging Environment

Navigate to: **Settings → Environments → staging**

**Secrets:**
- `CLOUDFLARE_API_TOKEN` (can be same as repo secret)
- Any staging-specific configuration

### Production Environment

Navigate to: **Settings → Environments → production**

**Secrets:**
- `CLOUDFLARE_API_TOKEN` (should be production-specific)
- Any production-specific configuration

**Protection Rules:**
- ✅ Required reviewers: 1
- ✅ Deployment branches: main only

## Secret Management Best Practices

### Security

1. **Rotate Regularly**
   - Rotate tokens every 90 days
   - Use calendar reminders

2. **Minimal Permissions**
   - Grant only required permissions
   - Use scoped tokens when possible

3. **Separate Environments**
   - Use different tokens for staging/production
   - Never reuse production credentials

4. **Audit Access**
   - Review who has access to secrets
   - Remove access for departing team members

### Organization

1. **Naming Convention**
   ```
   SERVICE_CREDENTIAL_TYPE
   Examples:
   - CLOUDFLARE_API_TOKEN
   - SNYK_AUTH_TOKEN
   - SLACK_WEBHOOK_URL
   ```

2. **Documentation**
   - Document what each secret is for
   - Include rotation schedule
   - Note who to contact for issues

3. **Version Control**
   - Never commit secrets to git
   - Use .env.example for reference
   - Add secrets to .gitignore

## Verification

### Test Secrets

Create a test workflow to verify secrets:

```yaml
name: Test Secrets
on: workflow_dispatch

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Test Cloudflare Token
        run: |
          if [ -z "${{ secrets.CLOUDFLARE_API_TOKEN }}" ]; then
            echo "❌ CLOUDFLARE_API_TOKEN not set"
            exit 1
          fi
          echo "✅ CLOUDFLARE_API_TOKEN is set"

      - name: Test Cloudflare Account ID
        run: |
          if [ -z "${{ secrets.CLOUDFLARE_ACCOUNT_ID }}" ]; then
            echo "❌ CLOUDFLARE_ACCOUNT_ID not set"
            exit 1
          fi
          echo "✅ CLOUDFLARE_ACCOUNT_ID is set"
```

### Common Issues

#### Secret not available in workflow

**Causes:**
- Secret name mismatch
- Secret scope (repository vs environment)
- Forked PR (secrets not available)

**Solution:**
- Check exact secret name
- Verify secret scope
- For forks, approve workflow run

#### Deployment fails with authentication error

**Causes:**
- Expired token
- Wrong token
- Insufficient permissions

**Solution:**
- Regenerate token
- Verify token permissions
- Check token hasn't been revoked

## Local Development

For local development, use `.env` files (never commit!):

```bash
# .env
CLOUDFLARE_API_TOKEN=your-token-here
CLOUDFLARE_ACCOUNT_ID=your-account-id
```

Load with:
```bash
# Using wrangler
wrangler dev

# Using dotenv
export $(cat .env | xargs)
```

## Secret Rotation Schedule

| Secret | Rotation Frequency | Owner |
|--------|-------------------|-------|
| CLOUDFLARE_API_TOKEN | 90 days | DevOps |
| SNYK_TOKEN | 180 days | Security |
| CODECOV_TOKEN | 180 days | QA |
| SLACK_WEBHOOK_URL | As needed | DevOps |

## Emergency Procedures

### Compromised Secret

1. **Immediately revoke** the compromised secret
2. **Generate new** secret/token
3. **Update** in GitHub Secrets
4. **Notify team** via Slack
5. **Document incident**

### Lost Access

1. Contact secret owner (see table above)
2. Verify identity
3. Regenerate if necessary
4. Update documentation

## Secrets Checklist

Before going live, verify:

- [ ] CLOUDFLARE_API_TOKEN configured
- [ ] CLOUDFLARE_ACCOUNT_ID configured
- [ ] SNYK_TOKEN configured (optional)
- [ ] CODECOV_TOKEN configured (optional)
- [ ] SLACK_WEBHOOK_URL configured (optional)
- [ ] Environment secrets set for staging
- [ ] Environment secrets set for production
- [ ] All secrets tested in workflows
- [ ] Documentation updated
- [ ] Team members have access
- [ ] Rotation schedule established

## Additional Resources

- [GitHub Encrypted Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Cloudflare API Tokens](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/)
- [Snyk Documentation](https://docs.snyk.io/)
- [Codecov Documentation](https://docs.codecov.com/)

## Support

For issues with secrets:
1. Check this documentation
2. Verify secret exists in GitHub
3. Test with verification workflow
4. Contact DevOps team
5. Check service status pages

---

Last Updated: 2025-11-23
