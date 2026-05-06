# Webhook Router - Cloudflare Workers Edition

A serverless webhook router deployed globally on Cloudflare Workers. Route webhooks from any source to Slack, Discord, Telegram, Google Chat, or custom APIs.

## Features

- 🌍 **Global Edge Network** — Fast webhooks anywhere in the world
- 💰 **Serverless Pricing** — Free tier (100K requests/day), pay only for what you use
- 🔐 **Secure** — Per-account webhook secrets, password-protected admin
- 📊 **Logging** — Track all webhook deliveries and failures
- 🚀 **Easy Deployment** — `wrangler deploy` one-liner
- ⚡ **TypeScript** — Type-safe serverless code

## Prerequisites

- Cloudflare account (free tier works)
- Node.js 18+
- `wrangler` CLI

## Setup

### 1. Install Wrangler

```bash
npm install -g wrangler@latest
```

### 2. Authenticate

```bash
wrangler login
```

### 3. Clone & Install Dependencies

```bash
cd webhook-central/webhook-router-cf
npm install
```

### 4. Create D1 Database

```bash
wrangler d1 create webhook-router
```

This creates a database and outputs a database ID. Update `wrangler.toml` with the ID:

```toml
[[d1_databases]]
binding = "DB"
database_name = "webhook-router"
database_id = "your-database-id-here"
```

### 5. Initialize Database Schema

```bash
wrangler d1 execute webhook-router --remote --file schema.sql
```

### 6. Set Environment Secrets

```bash
# Generate a secure session secret
openssl rand -hex 32  # Copy the output

# Set it in Cloudflare
wrangler secret put SESSION_SECRET
# Paste the generated secret
```

### 7. Deploy

```bash
npm run build
wrangler deploy
```

Your app is now live at: `https://webhook-router.<account>.workers.dev`

## Local Development

```bash
npm run dev
```

Opens `http://localhost:8787` with hot reload.

## API Endpoints

### Webhook Receiver (Public)

```bash
POST /webhook/<webhook_secret>

Request:
{
  "alert_type": "critical",
  "message": "Server down",
  "timestamp": "2026-05-05T18:32:00Z"
}

Response:
{
  "success": true,
  "matched": true,
  "ruleCount": 1,
  "results": [
    {
      "ruleId": "...",
      "success": true
    }
  ]
}
```

### Health Check

```bash
GET /api/health
```

## Architecture

### Database Layer (D1)

- `notification_accounts` — Webhook endpoints and credentials
- `notification_rules` — Matching rules
- `webhook_logs` — Audit trail
- `sessions` — Admin authentication
- `config` — Configuration key-value pairs

### Notification Services

Adapters for:
- Slack (webhook)
- Discord (webhook)
- Telegram (bot API)
- Google Chat (service account API)
- Custom APIs

### Framework

- **Hono** — Lightweight web framework for Workers
- **TypeScript** — Type safety for serverless code
- **Axios** — HTTP client (works in Workers)
- **bcryptjs** — Password hashing

## Workflow

1. **Create Account** → Add Slack/Discord/Telegram webhook
2. **Get Secret** → Copy the webhook URL for your account
3. **Add Rules** → Match on JSON keys (e.g., `alert_type = "critical"`)
4. **Send Webhooks** → POST to `/webhook/<secret>`
5. **Auto-route** → Matching rules send to configured platform

## Example

```bash
# Account created: Test Slack
# Webhook URL: https://webhook-router.myaccount.workers.dev/webhook/abc123...
# Rule: match alert_type = "critical"

curl -X POST https://webhook-router.myaccount.workers.dev/webhook/abc123 \
  -H "Content-Type: application/json" \
  -d '{
    "alert_type": "critical",
    "message": "Database connection failed",
    "timestamp": "2026-05-05T18:32:00Z"
  }'

# ✅ Slack message sent!
```

## Pricing

**Free Tier (included):**
- 100K requests/day
- D1: 5M rows read/day, 100K rows write/day, 5GB storage
- Perfect for testing and low-traffic apps

**Paid:**
- Pay only for additional usage
- D1 reads: $0.001 per million (after 25B/month)
- D1 writes: $1 per million (after 50M/month)
- Storage: $0.75/GB-month (after 5GB)

**Typical Usage:**
- 1K webhooks/day: ~$0/month (free tier)
- 10K webhooks/day: ~$0.05/month
- 100K webhooks/day: ~$0.50/month

## Development

Build TypeScript:
```bash
npm run build
```

Format code:
```bash
npm run format
```

Type check:
```bash
npm run type-check
```

## Deployment Checklist

- [ ] Cloudflare account created
- [ ] `wrangler login` authenticated
- [ ] D1 database created and ID set in `wrangler.toml`
- [ ] Database schema initialized
- [ ] `SESSION_SECRET` set via `wrangler secret`
- [ ] `npm run deploy` successful
- [ ] Test webhook endpoint works

## Custom Domain

Add a custom domain in Cloudflare dashboard:
1. Go to Workers → webhook-router
2. Settings → Domains
3. Add custom domain (e.g., `webhooks.example.com`)
4. Ensure domain is on Cloudflare nameservers

## Troubleshooting

**Database not found:**
```bash
wrangler d1 list
wrangler d1 info webhook-router
```

**Schema not initialized:**
```bash
wrangler d1 execute webhook-router --remote --file schema.sql
```

**Secret not set:**
```bash
wrangler secret list
wrangler secret put SESSION_SECRET
```

**Deploy failed:**
```bash
npm run type-check
npm run build
```

## Platform Setup Guides

For detailed setup instructions for each notification platform:

- **[Google Chat API Setup](./GOOGLE_CHAT_API_SETUP.md)** — Configure service account authentication for Google Chat (works with personal Google accounts)

Other platforms (Slack, Discord, Telegram) use standard webhook/API credentials available from their respective platforms.

## What's Included

✅ **Complete webhook routing engine** with JSON-based rule matching  
✅ **Admin dashboard** for managing accounts and rules  
✅ **Authentication system** with session-based login and password hashing  
✅ **Database layer** with D1 migrations and logging  
✅ **Multiple notification platforms** (Slack, Discord, Telegram, Google Chat, Custom APIs)  
✅ **GitHub Actions CI/CD** for automatic deployment  

## Future Enhancements

Possible additions:
- Advanced rule matching (regex, complex JSON queries)
- Webhook delivery retry logic
- Admin user management (multiple users)
- Notification templates and custom formatting
- Webhook signing for security
- Rate limiting per account

## Support

- **Cloudflare Docs**: https://developers.cloudflare.com/workers/
- **D1 Docs**: https://developers.cloudflare.com/d1/
- **Hono Docs**: https://hono.dev/

## Continuous Deployment with GitHub Actions

Every push to `main` automatically builds and deploys your worker.

**Setup takes 5 minutes:**
1. Create Cloudflare API token
2. Add GitHub secrets (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`)
3. Push to `main` → Automatic deployment

See **[GITHUB_ACTIONS_SETUP.md](./GITHUB_ACTIONS_SETUP.md)** for detailed setup instructions.

**What you get:**
- ✅ Automatic deployment on every push
- ✅ Type-check and build validation
- ✅ PR checks before merging
- ✅ Health checks after deployment
- ✅ One-click rollback
- ✅ Slack notifications (optional)

## GitHub Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| **Deploy** | Push to `main`, manual dispatch | Build and deploy worker |
| **Test** | Pull requests, code changes | Type-check and lint |
| **Rollback** | Manual dispatch | Rollback to previous version |

## License

MIT
