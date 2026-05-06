# Deployment Quick Reference

## Scenario: Normal Development Workflow

```bash
# 1. Make changes
vim src/index.ts

# 2. Test locally
npm run dev

# 3. Type-check
npm run type-check

# 4. Build
npm run build

# 5. Push to GitHub (automatic deployment)
git add .
git commit -m "Add feature X"
git push origin main

# 6. Watch in GitHub Actions
# Go to Actions tab, see deployment progress
```

**Result:** ✅ Deployed automatically within 2 minutes

---

## Scenario: Fix Broken Deployment (Rollback)

```bash
# 1. Find the commit that was working
git log --oneline | head -20

# 2. Go to GitHub Actions → Rollback workflow
# Click "Run workflow"
# Enter commit hash: abc123def
# Click "Run workflow"

# 3. Wait for rollback to complete
# Result: ✅ Rolled back to previous version
```

---

## Scenario: Deploy Without Pushing Code

```bash
# 1. Go to GitHub → Actions tab
# 2. Click "Deploy to Cloudflare Workers"
# 3. Click "Run workflow" button
# 4. Select branch and environment
# 5. Click "Run workflow"

# Result: ✅ Manual deployment triggered
```

---

## Scenario: Test PR Before Merging

```bash
# 1. Create branch and make changes
git checkout -b feature/add-slack

# 2. Push to GitHub
git push origin feature/add-slack

# 3. Create Pull Request
# GitHub will automatically run test checks

# 4. Check PR for:
# ✅ Type Check & Build - PASSED
# ✅ Code Quality - PASSED

# 5. If checks pass, merge PR
# → Automatic deployment to main happens
```

---

## Scenario: Check Deployment Status

### In GitHub

```bash
# Option 1: via git
git log --oneline -10

# Option 2: In browser
# Go to Actions tab
# See recent deployments
# Click workflow to see details
```

### In Cloudflare

```bash
# View deployments
# Workers → webhook-router → Deployments tab
# See list of all deployments and their status
```

---

## Scenario: Emergency - Revert Last Change

```bash
# Option 1: Using git (preferred)
git revert HEAD
git push origin main
# → Automatic deployment of reverted code

# Option 2: Using rollback workflow
# Actions → Manual Rollback → Run workflow
# Enter commit hash of working version
```

---

## Scenario: Set Up Slack Notifications

```bash
# 1. Create Slack webhook
# Slack Workspace → Apps → Incoming Webhooks
# Copy webhook URL

# 2. Add to GitHub secrets
# Settings → Secrets → New secret
# Name: SLACK_WEBHOOK_URL
# Value: <webhook URL>

# 3. Deployments will now notify Slack on success/failure
```

---

## Common Issues & Solutions

### "Deployment failed - type error"

```bash
# 1. Find the error
npm run type-check

# 2. Fix locally
# Edit the file with the error

# 3. Verify fix
npm run type-check
npm run build

# 4. Push
git add .
git commit -m "Fix TypeScript error"
git push origin main
```

### "Deployment failed - build error"

```bash
# 1. Check build locally
npm ci
npm run build

# 2. Fix the issue
# Edit the broken code

# 3. Verify locally
npm run build

# 4. Push
git push origin main
```

### "Worker not responding after deploy"

```bash
# Check the error
# Go to Actions → Latest deployment → View logs

# Option 1: Rollback
# Go to Actions → Manual Rollback
# Enter last-known-good commit hash

# Option 2: Fix and redeploy
# Fix the issue locally
# Push to main
```

---

## Performance Tips

### Faster Deployments

```bash
# Commit with [skip test] to skip PR checks
git commit -m "Minor doc update [skip test]"

# But always test before pushing to main!
npm run type-check && npm run build
```

### Monitor Deployment Time

```bash
# View workflow run duration
# Actions → Latest run → See duration
# Typical: 2-3 minutes from push to live
```

---

## Checklist: Before Pushing to Main

- [ ] `npm run type-check` passes
- [ ] `npm run build` completes
- [ ] No new warnings
- [ ] Tested locally with `npm run dev`
- [ ] Code follows conventions
- [ ] Commit message is clear

---

## Checklist: After Deployment

- [ ] Go to Actions tab
- [ ] See green checkmark ✅
- [ ] Click workflow to view summary
- [ ] See "Deployment complete" message
- [ ] Click worker URL to verify it's live
- [ ] Test webhook endpoint works

---

## Command Cheat Sheet

```bash
# Development
npm run dev              # Start local server
npm run type-check      # Find TypeScript errors
npm run build           # Compile TypeScript
npm run lint            # Check code style

# Git
git add .               # Stage changes
git commit -m "msg"     # Create commit
git push origin main    # Push to GitHub (triggers deploy)
git log --oneline       # See recent commits

# Debugging
git status              # See what changed
git diff                # See exact changes
git show <commit>       # See specific commit details
```

---

## When to Use Rollback

✅ **Use rollback when:**
- Worker is returning 500 errors
- Health check fails
- Critical functionality broken
- Need to revert immediately

✅ **How to rollback:**
1. Find working commit: `git log --oneline`
2. Actions → Manual Rollback
3. Enter commit hash
4. Click "Run workflow"

---

## Getting Help

- **Type errors?** Run `npm run type-check`
- **Build failed?** Run `npm run build` locally
- **Deployment issues?** Check Actions tab logs
- **Worker not working?** Check Cloudflare dashboard
- **Forgot API token?** Recreate in Cloudflare dashboard
