# Google Chat Apps Script Webhook Receiver

A Google Apps Script that receives webhooks and sends messages to Google Chat spaces. Works with personal Google accounts!

## Setup (5 minutes)

### Step 1: Open Google Apps Script

1. Go to [script.google.com](https://script.google.com)
2. Click **+ New project**
3. Name it `Webhook to Google Chat` (or anything you like)

### Step 2: Copy the Script

Replace all the code in `Code.gs` with:

```javascript
// Configuration
const SPACE_ID = 'AAAABBBBCCCC'; // Replace with your space ID
const SPACE_NAME = 'Webhook Router'; // Display name for messages

/**
 * Receives webhook POST requests and sends to Google Chat
 */
function doPost(e) {
  try {
    // Parse incoming webhook payload
    const payload = JSON.parse(e.postData.contents);
    
    // Extract message and metadata
    const message = payload.message || 'Webhook received';
    const timestamp = new Date().toLocaleString();
    
    // Build Google Chat card message
    const cardMessage = {
      text: message,
      cards: [
        {
          header: {
            title: SPACE_NAME,
            subtitle: timestamp
          },
          sections: [
            {
              widgets: [
                {
                  textParagraph: {
                    text: '<b>Webhook Payload:</b><br><pre>' + 
                          JSON.stringify(payload, null, 2).substring(0, 2000) + 
                          '</pre>'
                  }
                }
              ]
            }
          ]
        }
      ]
    };
    
    // Send to Google Chat
    const response = Chat.Spaces.Messages.create({
      parent: 'spaces/' + SPACE_ID,
      resource: cardMessage
    });
    
    // Return success response
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      messageId: response.name,
      timestamp: timestamp
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    // Return error response
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Test the webhook locally (run from the IDE)
 */
function testWebhook() {
  const testPayload = {
    alert_type: 'critical',
    message: 'Test webhook from Apps Script',
    timestamp: new Date().toISOString()
  };
  
  const mockEvent = {
    postData: {
      contents: JSON.stringify(testPayload)
    }
  };
  
  const response = doPost(mockEvent);
  console.log('Test response:', response);
}
```

### Step 3: Configure Your Space ID

1. **Find your Google Chat Space ID:**
   - Open Google Chat in your browser
   - Click the space where you want messages
   - Look at the URL: `https://mail.google.com/chat/u/0/#chat/space/AAAABBBBCCCC`
   - Copy `AAAABBBBCCCC`

2. **Update the script:**
   - In the script, find line 2: `const SPACE_ID = 'AAAABBBBCCCC';`
   - Replace `AAAABBBBCCCC` with your actual space ID
   - Leave the quotes

### Step 4: Enable Google Chat API

1. In Apps Script, click **Services** (left sidebar, looks like a wrench)
2. Scroll down to find **Google Chat API**
3. Click it to enable it (toggle should turn blue)
4. Click **Add**

### Step 5: Deploy as Web App

1. Click **Deploy** (top right, blue button)
2. Click **New deployment** → **Select type** → **Web app**
3. Fill in:
   - **Execute as:** Your Google account
   - **Who has access:** Anyone
4. Click **Deploy**
5. Copy the **Deployment URL** (looks like `https://script.google.com/macros/d/...`)
6. Save this URL - you'll need it in the next step

### Step 6: Test the Script (Optional)

1. Back in the script editor, click **Run** (top, next to Debug)
2. Authorize the app when prompted
3. Check your Google Chat space - you should see a test message

### Step 7: Add to Webhook Router

1. Open your Webhook Router admin dashboard
2. Click **Accounts** → **Add New Account**
3. Fill in:
   - **Account Name:** "Google Chat" (or any name)
   - **Platform:** "Google Chat App"
   - **Credentials:** Paste the deployment URL from Step 5
4. Click **Create Account**

### Step 8: Create Rules

1. Click **Rules** → **Add New Rule**
2. Select your Google Chat account
3. Set a matching condition (e.g., `alert_type = "critical"`)
4. Click **Create Rule**

Done! Your webhooks are now routed to Google Chat! 🎉

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

You should see a formatted message appear in your Google Chat space within seconds.

## Customizing the Message Format

Edit the `cardMessage` in the script to change how messages are formatted:

- Change `SPACE_NAME` at the top to customize the header title
- Modify the `textParagraph` section to change the card layout
- Add more `sections` or `widgets` for different layouts

See [Google Chat Card Format documentation](https://developers.google.com/chat/api/guides/message-formats/cards) for advanced formatting.

## Troubleshooting

### "No space found with ID"

- Verify the space ID is correct
- Copy from the URL bar when viewing the space in Google Chat
- Should be format: `AAAABBBBCCCC` (alphanumeric)

### "Permission denied" or "Google Chat API not enabled"

- Make sure you enabled the Google Chat API in Services (Step 4)
- Go back to the script, click Services, find Google Chat API, toggle it on
- Re-deploy the app (Deploy → New deployment)

### Message not appearing

- Check the deployment URL is correct in the Webhook Router
- Check the space ID in the script matches the actual space
- Look at the Webhook Router logs to see if the POST succeeded
- In Apps Script editor, click **Executions** to see if there were errors

### "403 Unauthorized" in webhook router logs

- The deployment URL might be wrong or expired
- Try re-deploying the app (Deploy → New deployment)
- Copy the new deployment URL and update it in the Webhook Router

## Advanced: Multiple Spaces

To send to multiple spaces from the same Apps Script:

1. Modify the script to accept `space_id` as a POST parameter:

```javascript
function doPost(e) {
  // Allow space_id to be overridden via query parameter
  const spaceId = e.parameter.space_id || SPACE_ID;
  
  // ... rest of code, using spaceId instead of SPACE_ID
}
```

2. Create multiple accounts in Webhook Router, each pointing to the Apps Script URL with different space IDs:
   - `https://script.google.com/macros/d/.../exec?space_id=AAAABBBBCCCC`
   - `https://script.google.com/macros/d/.../exec?space_id=DDDDEEEEFFFFF`

## Security Notes

⚠️ The deployed web app is publicly accessible (Step 5: "Who has access: Anyone")

This means:
- Anyone with the deployment URL can POST to it
- They could send spam messages to your space
- Add rate limiting or validation if concerned

**To secure it:**

1. Change "Who has access" to "Only myself" (Step 5)
   - But then you'd need to authenticate from the webhook router
   - More complicated setup

2. Add a secret token to the script:

```javascript
const SECRET_TOKEN = 'your-secret-key-here';

function doPost(e) {
  if (e.parameter.token !== SECRET_TOKEN) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Unauthorized'
    })).setMimeType(ContentService.MimeType.JSON);
  }
  // ... rest of code
}
```

Then use webhook URL: `https://script.google.com/macros/d/.../exec?token=your-secret-key-here`

## Support

- [Google Apps Script Docs](https://developers.google.com/apps-script)
- [Google Chat API Docs](https://developers.google.com/chat/api)
- [Google Chat Card Format](https://developers.google.com/chat/api/guides/message-formats/cards)

## Summary

You now have:
✅ A custom Google Chat webhook receiver
✅ Deployed as a web app with a public URL
✅ Connected to Webhook Router
✅ Sending webhooks to Google Chat spaces
✅ Works with personal Google accounts (no Workspace needed!)
