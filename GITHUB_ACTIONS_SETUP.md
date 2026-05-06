# GitHub Actions Setup Guide

Automatic deployment to Cloudflare Workers with GitHub Actions. Every push to `main` triggers a build and deployment.

## Prerequisites

- Repository on GitHub
- Cloudflare account with a Worker project
- D1 database initialized

## Step-by-Step Setup

### 1. Create Cloudflare API Token

1. Go to **Cloudflare Dashboard** → **My Profile** → **API Tokens**
2. Click **Create Token**
3. Choose **"Create Custom Token"**
4. Configure:
   - **Name:** `GitHub Actions Webhook Router`
   - **Permissions:**
     - Account → Cloudflare Workers → Edit
     - Account → Cloudflare Workers Secrets → Edit (if using secrets)
     - Zone → (none required)
   - **Account Resources:** All accounts
   - **TTL:** 90 days (or longer if you prefer)
5. Click **Create Token**
6. **Copy the token** (you won't see it again)

### 2. Find Your Cloudflare Account ID

1. In **Cloudflare Dashboard**, click your profile icon → **My Profile**
2. Under **Accounts**, find your account
3. Copy the **Account ID** (8-character alphanumeric string)

### 3. Add GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**

**Add these secrets:**

| Secret Name | Value | How to Get |
|---|---|---|
| `CLOUDFLARE_API_TOKEN` | Your API token | From step 1 |
| `CLOUDFLARE_ACCOUNT_ID` | Your account ID | From step 2 |

Example:
```
CLOUDFLARE_API_TOKEN = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
CLOUDFLARE_ACCOUNT_ID = a1b2c3d4e5f6g7h8
```

### 4. Verify Workflows Are Enabled

1. Go to **Settings** → **Actions** → **General**
2. Under **Actions permissions**, select **Allow all actions and reusable workflows**
3. Click **Save**

### 5. Test the Setup

Push code to `main` branch:

```bash
git checkout main
git add .
git commit -m "Setup GitHub Actions"
git push origin main
```

Watch the deployment:

1. Go to **Actions** tab in GitHub
2. Click the **Deploy to Cloudflare Workers** workflow
3. Watch the job run through:
   - ✅ Type Check & Build
   - ✅ Deploy Worker
   - ✅ Health Check
   - ✅ Notifications (optional)

When complete, you'll see:
- ✅ Green checkmark on commit
- 📝 Deployment URL in workflow summary
- 🚀 Worker is live and accepting webhooks

## Workflow Files

### `deploy.yml` - Main Deployment
- **Triggers:** Push to `main`, manual dispatch
- **Steps:**
  1. Type-check TypeScript
  2. Build the worker
  3. Deploy with wrangler
  4. Create GitHub deployment
  5. Health check
  6. Slack notification (optional)

### `test.yml` - PR Checks
- **Triggers:** Pull requests to `main`
- **Steps:**
  1. Type-check
  2. Build
  3. ESLint (code quality)
  4. Post PR comment with results

### `rollback.yml` - Manual Rollback
- **Trigger:** Manual dispatch via Actions tab
- **Input:** Commit hash to rollback to
- **Steps:**
  1. Checkout specific commit
  2. Build that version
  3. Deploy it
  4. Verify health

## Usage

### Automatic Deployment
```bash
# Just push to main - deployment happens automatically
git push origin main
```

### Manual Deployment
If you need to deploy without pushing:

1. Go to **Actions** tab
2. Click **Deploy to Cloudflare Workers**
3. Click **Run workflow**
4. Select branch and environment
5. Click **Run workflow**

### Rollback to Previous Version
If deployment breaks something:

1. Go to **Actions** tab
2. Click **Manual Rollback**
3. Click **Run workflow**
4. Enter commit hash (e.g., `abc123def`)
5. Click **Run workflow**

To find a commit hash:
```bash
git log --oneline | head -20
```

## Monitoring Deployments

### In GitHub

**Commit View:**
- Green ✅ = Deployment successful
- Red ❌ = Deployment failed
- Click the checkmark for details

**Actions Tab:**
- View all workflow runs
- Check logs for debugging
- See deployment history

### In Cloudflare

1. Go to **Workers** → **webhook-router**
2. Click **Deployments** tab
3. See recent deployments and rollback options

## Troubleshooting

### "Deploy failed - authentication error"

**Problem:** API token or account ID is incorrect

**Solution:**
1. Verify `CLOUDFLARE_API_TOKEN` secret is set correctly
2. Verify `CLOUDFLARE_ACCOUNT_ID` secret is set correctly
3. Recreate token if needed (old token may have expired)

### "Deploy failed - No matching wrangler.toml"

**Problem:** wrangler.toml not found in working directory

**Solution:**
```yaml
# In deploy.yml, change working-directory if needed:
working-directory: ./webhook-router-cf  # Update path
```

### "Type check failed - Cannot find module"

**Problem:** Dependencies not installed or TypeScript errors

**Solution:**
```bash
# Locally
npm ci
npm run type-check
npm run build

# Fix errors, then push
git add .
git commit -m "Fix TypeScript errors"
git push
```

### "Health check failed - HTTP 500"

**Problem:** Worker deployed but isn't responding correctly

**Solution:**
1. Check Cloudflare Workers dashboard for errors
2. Look at deployment logs in GitHub Actions
3. Rollback to previous version
4. Fix the issue locally and redeploy

### Workflow not triggering

**Problem:** Push to `main` doesn't trigger deployment

**Solution:**
1. Check **Settings** → **Actions** → **General** → Workflows enabled
2. Verify `.github/workflows/deploy.yml` exists in repo
3. Check file isn't excluded by `.github/workflows/deploy.yml` path filters
4. Try manual trigger: **Actions** → **Deploy** → **Run workflow**

## Optional: Slack Notifications

Receive Slack alerts for successful deployments and failures.

### Setup Slack Webhook

1. Go to Slack workspace
2. Create incoming webhook (Slack App → Create App → Incoming Webhooks)
3. Copy webhook URL

### Add to GitHub

1. Go to **Settings** → **Secrets** → **Actions**
2. Click **New repository secret**
3. Name: `SLACK_WEBHOOK_URL`
4. Value: Paste webhook URL

Deployment alerts will now post to Slack on success/failure.

## Best Practices

✅ **Do:**
- Always test locally before pushing: `npm run type-check && npm run build`
- Use descriptive commit messages
- Review PR checks before merging
- Monitor deployments in Actions tab
- Use rollback feature if something breaks

❌ **Don't:**
- Force push to `main` (breaks deployment history)
- Merge PRs without passing checks
- Manually deploy via Cloudflare dashboard (use GitHub)
- Use extremely short API token TTL (makes maintenance harder)

## Advanced: Environment Secrets

For staging vs. production deployments:

1. Go to **Settings** → **Environments**
2. Create `staging` and `production` environments
3. Add environment-specific secrets to each
4. In workflow, use: `environment: ${{ github.event.inputs.environment }}`

## Advanced: Scheduled Deployments

Deploy on a schedule:

```yaml
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC
```

## Advanced: Slack Approval Gate

Require approval in Slack before deploying:

```yaml
jobs:
  approve:
    runs-on: ubuntu-latest
    steps:
      - name: Request Slack approval
        # Use https://github.com/slackapi/slack-github-action
```

## Getting Help

- **GitHub Actions Docs:** https://docs.github.com/actions
- **Wrangler Docs:** https://developers.cloudflare.com/workers/wrangler/
- **Cloudflare Workers Docs:** https://developers.cloudflare.com/workers/

## Summary

You now have:

✅ Automatic deployment on `git push origin main`
✅ PR checks before merging
✅ Health checks after deployment
✅ One-click rollback capability
✅ Slack notifications (optional)
✅ GitHub deployments tracked

**Next commit will trigger deployment automatically!** 🚀
