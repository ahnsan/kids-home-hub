# Branch Protection Rules

This document describes the required branch protection rules for the Kids Home Hub repository.

## Main Branch Protection

### Configuration Steps

Navigate to: **Settings → Branches → Add rule**

Branch name pattern: `main`

### Required Settings

#### Pull Request Requirements
- [x] **Require a pull request before merging**
  - Required approving reviews: `1`
  - [x] Dismiss stale pull request approvals when new commits are pushed
  - [x] Require review from Code Owners (if CODEOWNERS file exists)
  - [x] Require approval of the most recent reviewable push

#### Status Checks
- [x] **Require status checks to pass before merging**
  - [x] Require branches to be up to date before merging

**Required status checks:**
```
- Lint Code
- TypeScript Type Check
- Unit Tests
- Integration Tests
- E2E Tests
- Build Application
- Quality Gate
- NPM Audit
- Secret Detection
- License Compliance
- Bundle Size Analysis
- Lighthouse CI
```

#### Additional Settings
- [x] **Require conversation resolution before merging**
- [x] **Require signed commits** (optional but recommended)
- [x] **Require linear history**
- [x] **Include administrators**
- [x] **Restrict who can push to matching branches** (optional)
- [x] **Allow force pushes: Disabled**
- [x] **Allow deletions: Disabled**

## Develop Branch Protection

Branch name pattern: `develop`

### Required Settings

#### Pull Request Requirements
- [x] **Require a pull request before merging**
  - Required approving reviews: `1`
  - [x] Dismiss stale pull request approvals when new commits are pushed

#### Status Checks
- [x] **Require status checks to pass before merging**
  - [x] Require branches to be up to date before merging

**Required status checks:**
```
- Lint Code
- TypeScript Type Check
- Unit Tests
- Build Application
```

#### Additional Settings
- [x] **Require conversation resolution before merging**
- [x] **Allow force pushes: Disabled**
- [x] **Allow deletions: Disabled**

## Feature Branches

Branch name pattern: `feature/*`

### Recommended Settings

- [x] **Delete branch on merge**
- [x] **Automatically delete head branches**

## Release Branches

Branch name pattern: `release/*`

### Required Settings

#### Pull Request Requirements
- [x] **Require a pull request before merging**
  - Required approving reviews: `2`
  - [x] Require review from Code Owners

#### Status Checks
- [x] All CI/CD checks must pass

#### Additional Settings
- [x] **Require signed commits**
- [x] **Restrict who can push**

## Hotfix Branches

Branch name pattern: `hotfix/*`

### Required Settings

#### Pull Request Requirements
- [x] **Require a pull request before merging**
  - Required approving reviews: `1`
  - Can skip tests in emergency (manual override)

#### Status Checks
- [x] Security checks must pass
- [x] Build must succeed

## Automation

You can use the GitHub API to configure branch protection programmatically:

```bash
# Install GitHub CLI
brew install gh

# Authenticate
gh auth login

# Set branch protection for main
gh api repos/:owner/:repo/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["Lint Code","TypeScript Type Check","Unit Tests","Integration Tests","E2E Tests","Build Application","Quality Gate"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true}' \
  --field restrictions=null
```

## CODEOWNERS File

Create `.github/CODEOWNERS` to automatically assign reviewers:

```
# Global owners
* @your-team/developers

# CI/CD changes
/.github/workflows/ @your-team/devops
/scripts/ci/ @your-team/devops

# Frontend changes
/apps/frontend/ @your-team/frontend
/packages/ui/ @your-team/frontend

# Backend changes
/apps/backend/ @your-team/backend

# Security-sensitive files
/wrangler.toml @your-team/security
/.env.example @your-team/security
```

## Verification

After configuring branch protection, verify with:

```bash
# Check branch protection status
gh api repos/:owner/:repo/branches/main/protection

# Test by creating a PR without required checks
# It should be blocked from merging
```

## Common Issues

### Issue: Can't merge despite passing checks
**Solution:** Ensure branch is up to date with base branch

### Issue: Required checks not appearing
**Solution:**
- Check workflow names match exactly
- Ensure workflows run on PR events
- Verify workflow permissions

### Issue: Admin can bypass rules
**Solution:** Enable "Include administrators" in settings

## Notes

- Branch protection rules apply to the entire branch
- Rules can be overridden with admin permissions
- Status checks must match workflow job names exactly
- Changes to branch protection don't affect existing PRs
- Consider using rulesets for more complex scenarios

## References

- [GitHub Branch Protection](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches)
- [Required Status Checks](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/collaborating-on-repositories-with-code-quality-features/about-status-checks)
- [CODEOWNERS](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)
