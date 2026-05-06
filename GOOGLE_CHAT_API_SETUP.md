# Google Chat Integration with Service Account

Google Chat integration uses the Google Chat API v1 with service account authentication. This allows you to send messages from your personal Google account without needing a paid Google Workspace account.

## Prerequisites

- Google Cloud Platform (GCP) account (free tier works)
- Google Chat workspace or space where you can invite the service account bot

## Step-by-Step Setup

### 1. Create a GCP Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown at the top
3. Click **NEW PROJECT**
4. Name it `Webhook Router` (or any name you prefer)
5. Click **CREATE**
6. Wait for the project to be created (takes a few seconds)

### 2. Enable Google Chat API

1. In the Google Cloud Console, search for **"Google Chat API"**
2. Click on **Google Chat API** in the results
3. Click **ENABLE**
4. Wait for the API to be enabled

### 3. Create a Service Account

1. Go to **APIs & Services** → **Credentials**
2. Click **CREATE CREDENTIALS** → **Service Account**
3. Fill in the form:
   - **Service account name:** `webhook-router` (or your preferred name)
   - **Service account ID:** Auto-populated (you can leave as-is)
   - **Description:** (optional) "Webhook routing bot"
4. Click **CREATE AND CONTINUE**
5. On the next screen, click **CONTINUE** (you don't need to grant roles)
6. Click **DONE**

### 4. Create and Download Private Key

1. Go to **APIs & Services** → **Credentials**
2. Under **Service Accounts**, click the service account you just created
3. Click the **KEYS** tab
4. Click **ADD KEY** → **Create new key**
5. Select **JSON** as the key type
6. Click **CREATE**
7. A JSON file will download automatically (keep this safe!)

### 5. Extract Credentials from the JSON File

Open the downloaded JSON file in a text editor. You need three pieces of information:

```json
{
  "type": "service_account",
  "project_id": "...",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "webhook-router@YOUR-PROJECT.iam.gserviceaccount.com",
  "client_id": "...",
  ...
}
```

Extract:
- **service_account_email:** The `client_email` field (e.g., `webhook-router@my-project-123.iam.gserviceaccount.com`)
- **service_account_key:** The entire `private_key` field (including the `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` lines)
- **space_id:** You'll get this in the next step

### 6. Find Your Google Chat Space ID

**Option A: From Google Chat URL**

1. Open Google Chat in your browser
2. Click the space where you want to receive messages
3. Look at the URL bar - it should be something like:
   ```
   https://mail.google.com/chat/u/0/#chat/space/AAAABBBBCCCC
   ```
4. The space ID is the part after `/space/` (e.g., `AAAABBBBCCCC`)

**Option B: From Space Settings**

1. In Google Chat, click the space name at the top
2. Click **Space settings**
3. Look for the space ID in the URL or settings

### 7. Add Service Account Bot to the Space

1. In the space, click **Members** (or the info icon)
2. Click **Add members**
3. Search for your service account email (e.g., `webhook-router@my-project-123.iam.gserviceaccount.com`)
4. Click the result to add the bot as a member

The bot should now appear in the space members list.

### 8. Add Account to Webhook Router

1. Open your Webhook Router admin dashboard (http://localhost:8787/ or your deployed URL)
2. Click **Accounts** → **Add New Account**
3. Fill in:
   - **Account Name:** "Google Chat" (or any name)
   - **Platform:** Select "Google Chat"
   - **Credentials:** Paste this JSON (replace with your actual values):

```json
{
  "service_account_email": "webhook-router@my-project-123.iam.gserviceaccount.com",
  "service_account_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQE...\n-----END PRIVATE KEY-----\n",
  "space_id": "AAAABBBBCCCC"
}
```

4. Click **Create Account**

## Creating Rules

Once the account is set up:

1. Click **Rules** → **Add New Rule**
2. Select your Google Chat account
3. Set a matching condition (e.g., `alert_type = "critical"`)
4. Click **Create Rule**

Now any webhook that matches your rule will send a message to the Google Chat space!

## Testing

### Test with curl

```bash
curl -X POST https://your-worker.workers.dev/webhook/YOUR_WEBHOOK_SECRET \
  -H "Content-Type: application/json" \
  -d '{
    "alert_type": "critical",
    "message": "Test alert from webhook router"
  }'
```

You should see a message appear in your Google Chat space within a few seconds.

### Check Logs

1. In the admin dashboard, go to **Accounts** → Click your Google Chat account
2. Look at **Recent Webhook Activity**
3. You'll see the status of each message sent (success or failure)

## Troubleshooting

### "JWT signing failed" Error

**Problem:** The service account key format is incorrect.

**Solution:**
- Make sure you copied the entire `private_key` field from the JSON file
- Include the `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` lines
- The key should have `\n` (newline characters) preserved

### "404 Not Found" Error

**Problem:** The space ID is incorrect or the bot isn't a member of the space.

**Solution:**
1. Verify the space ID is correct
2. Make sure the service account email is added as a member of the space
3. Check that the space still exists

### "401 Unauthorized" Error

**Problem:** The service account isn't a member of the space.

**Solution:**
1. Go to the Google Chat space
2. Click **Members**
3. Click **Add members**
4. Search for your service account email
5. Add it as a member

### No message appears in Google Chat

**Problem:** Message was sent but didn't appear.

**Possible causes:**
1. Check the **Account Details** page - look at "Recent Webhook Activity"
2. If status is "failed", see the error message for details
3. If status is "sent", the message was accepted by Google Chat API
4. Check that the rule matches your webhook payload
5. Verify the space ID is correct

## Important Security Notes

⚠️ **Protect your service account key:**
- Never commit the private key to version control
- Never share it in chat or forums
- If the key is compromised, delete it immediately in GCP Console and create a new one

## Advanced: Revoking Access

If you want to stop sending messages to Google Chat:

1. **Option A: Disable the account** — In the admin dashboard, edit the account and toggle "Enabled" off
2. **Option B: Delete the service account** — Go to **APIs & Services** → **Service Accounts** → click the account → click the delete icon
3. **Option C: Remove bot from space** — In Google Chat, remove the service account from the space members

## GCP Cleanup (Optional)

To completely remove the service account and free up GCP resources:

1. Go to **APIs & Services** → **Service Accounts**
2. Click the service account
3. Click **DELETE** at the top
4. Confirm deletion

The service account will be permanently deleted (you can create a new one if needed later).

## Additional Resources

- [Google Chat API Documentation](https://developers.google.com/chat/api)
- [Service Account Authentication](https://developers.google.com/identity/protocols/oauth2/service-account)
- [Google Cloud Console](https://console.cloud.google.com/)

## Summary

You now have:
✅ Google Chat account with service account authentication
✅ Bot added to your Google Chat space
✅ Account configured in Webhook Router
✅ Ready to send webhooks to Google Chat!
