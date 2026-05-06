# CI/CD Architecture

## End-to-End Deployment Flow

```
Developer pushes to main
        ↓
GitHub webhook triggers
        ↓
├─ Test Workflow (runs on all PRs)
│  ├─ Type Check TypeScript
│  ├─ Build code
│  └─ Lint code
│
└─ Deploy Workflow (runs on main push)
   ├─ Checkout code
   ├─ Setup Node.js
   ├─ Install dependencies
   ├─ Type check
   ├─ Build (TypeScript → JavaScript)
   ├─ Deploy to Cloudflare
   ├─ Create GitHub deployment record
   ├─ Run health check
   └─ Notify (Slack, GitHub)
        ↓
Worker deployed & live
```

## Workflow Triggers

### Deploy Workflow (`deploy.yml`)

**Automatic Triggers:**
- Push to `main` branch
- Skip if only `.md` or `.gitignore` changed

**Manual Trigger:**
- Actions tab → "Deploy" → "Run workflow"
- Choose environment: production or staging

**Branch Policy:**
```yaml
on:
  push:
    branches:
      - main        # Only deploy from main
    paths-ignore:
      - '**.md'     # Skip on README changes
      - '.gitignore'
```

### Test Workflow (`test.yml`)

**Automatic Triggers:**
- Pull requests to `main`
- Push to `main` (runs before deploy)
- Changes to `src/`, `package.json`, etc.

**Purpose:**
- Catch errors before deployment
- Post PR comments with results
- Block merge if checks fail

### Rollback Workflow (`rollback.yml`)

**Manual Trigger:**
- Actions tab → "Manual Rollback"
- Input: commit hash to rollback to

**Use Case:**
- Emergency fix for broken deployment
- Revert to known-good version
- Takes ~1-2 minutes

## Deployment Steps (Deploy Workflow)

### Step 1: Checkout
```bash
actions/checkout@v4
```
Gets the latest code from the branch

### Step 2: Setup Node.js
```bash
actions/setup-node@v4
- node-version: 18
- cache: npm
```
Installs Node and caches npm packages

### Step 3: Install Dependencies
```bash
npm ci
```
Clean install of dependencies (reproducible)

### Step 4: Type Check
```bash
npm run type-check
```
Validates TypeScript before building

### Step 5: Build
```bash
npm run build
```
Compiles TypeScript to JavaScript in `dist/`

### Step 6: Deploy
```bash
CLOUDFLARE_API_TOKEN=***
CLOUDFLARE_ACCOUNT_ID=***
wrangler deploy
```
Uploads to Cloudflare and activates

### Step 7: Health Check
```bash
curl https://webhook-router.*.workers.dev/api/health
```
Verifies worker is responding

### Step 8: Create Deployment
```bash
github.rest.repos.createDeployment()
```
Records deployment in GitHub

### Step 9: Notifications
```bash
- Post to GitHub (commit status)
- Slack (if webhook configured)
```

## Environment Variables & Secrets

### Required Secrets
```
CLOUDFLARE_API_TOKEN     # For wrangler auth
CLOUDFLARE_ACCOUNT_ID    # Your CF account
```

### Optional Secrets
```
SLACK_WEBHOOK_URL        # For notifications
```

### Environment Variables (in workflow)
```
NODE_VERSION: 18
WORKING_DIRECTORY: ./webhook-router-cf
```

## Deployment States

### Success Path ✅
```
Build → Type Check Pass → Build Pass → Deploy → Health Check → ✅ Live
  ↓         ↓                 ↓            ↓           ↓
Green     Green            Green         Green       Green
Check     Check            Check         Check       Check
```

### Failure Paths ❌
```
Build → Type Check FAIL → ❌ Stop (don't deploy)

Build → Type Check Pass → Build FAIL → ❌ Stop (don't deploy)

Build → Deploy → Health Check FAIL → ⚠️ Deployed but unhealthy

Build → Deploy → Deploy FAIL → ❌ Stop (don't activate)
```

## Rollback States

```
Broken Deployment (v2)
        ↓
Developer triggers rollback to v1
        ↓
Workflow:
├─ Checkout v1 code
├─ Build v1
├─ Deploy v1
├─ Health check v1
└─ ✅ v1 is live (v2 removed)
```

## Performance Metrics

### Typical Deployment Time

| Step | Time |
|------|------|
| Checkout | 10s |
| Node setup | 15s |
| npm install | 30s |
| Type check | 15s |
| Build | 20s |
| Deploy | 30s |
| Health check | 5s |
| **Total** | **~2-3 min** |

### Build Size

```
TypeScript source:  ~50 KB
Compiled (dist/):   ~40 KB
Deployed (wrangler): ~100 KB (includes runtime)
```

## Concurrency Control

```yaml
concurrency:
  group: deployment
  cancel-in-progress: false
```

**What this means:**
- Only one deployment can run at a time
- New pushes while deploying will wait
- Prevents race conditions
- Ensures consistent state

## Status Reporting

### GitHub

- **Commit Status:** ✅ or ❌ (public)
- **PR Comment:** Deployment result (if PR)
- **Workflow Tab:** Detailed logs and history
- **Deployments Tab:** All deployments tracked

### Cloudflare

- **Workers Dashboard:** Latest deployment
- **Deployments Tab:** Full history with rollback
- **Logs:** Real-time worker logs

### Slack (Optional)

- Deployment started message
- Deployment success/failure alert
- Worker URL in notification

## Security Considerations

### Secrets Management
- Secrets stored in GitHub (encrypted)
- Not visible in logs or workflow output
- Wrangler uses `CLOUDFLARE_API_TOKEN` auth
- API token has "Workers Edit" permission only

### Access Control
- Only main branch deploys automatically
- Other branches require manual dispatch
- GitHub CODEOWNERS can require approval
- Cloudflare account access controlled separately

### Validation
- Type checking catches errors before deploy
- Build validation ensures code compiles
- Health check verifies worker is responding
- GitHub deployments are recorded (audit trail)

## Debugging Deployment Issues

### Check Logs
```
GitHub Actions → [Latest Run] → [Job] → Expand steps
Look for error messages in build or deploy steps
```

### Local Replication
```bash
# Simulate CI environment locally
npm ci
npm run type-check
npm run build

# This catches most issues before pushing
```

### Rollback if Critical
```
If deployed version is broken:
→ Actions → Manual Rollback
→ Enter working commit hash
→ Execute
```

### Check Cloudflare Directly
```
Cloudflare Dashboard → Workers → Logs
See real-time logs from deployed worker
```

## Future Enhancements

```
Potential additions:

1. Database migrations on deploy
   - Auto-run D1 migrations
   - Backup before migration

2. Multi-environment (staging/production)
   - Different secrets per environment
   - Approval gates for production

3. Performance benchmarking
   - Compare build size across versions
   - Track deployment time trends

4. Automated testing
   - Webhook simulation tests
   - Integration tests
   - Load testing

5. Canary deployments
   - Deploy to subset first
   - Gradual rollout
```

## Cost Analysis

**GitHub Actions (Free for public repos):**
- Public repos: Unlimited free minutes
- Private repos: 2000 free minutes/month
- ~180 minutes/month typical usage → Free

**Cloudflare Workers (Pay as you use):**
- Deployments: Free
- Executions: Free tier 100K/day
- D1 database: Very cheap

**Total monthly cost:**
- CI/CD: **$0**
- Worker runtime: **$0-5** (typical usage)
- **Total: $0-5/month**

## Summary

✅ **Automated deployments** on every push to main
✅ **Quality checks** on PRs before merging
✅ **Health checks** after each deployment
✅ **Easy rollback** if something breaks
✅ **Zero-cost** for CI/CD (GitHub Actions free)
✅ **Audit trail** of all deployments
✅ **Notifications** to Slack (optional)

Your entire CI/CD pipeline is now production-ready! 🚀
