import axios from 'axios';
import jwt from 'jsonwebtoken';

export async function sendGoogleChatMessage(
  serviceAccountEmail: string,
  serviceAccountKey: string,
  spaceId: string,
  message: string,
  payload: Record<string, unknown> = {}
): Promise<boolean> {
  if (!serviceAccountEmail || !serviceAccountKey || !spaceId) {
    throw new Error('Service account email, key, and space ID are required');
  }

  // Generate JWT token
  const now = Math.floor(Date.now() / 1000);
  const token = jwt.sign(
    {
      iss: serviceAccountEmail,
      sub: serviceAccountEmail,
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600, // Token valid for 1 hour
    },
    serviceAccountKey,
    { algorithm: 'RS256' }
  );

  // Build message body
  const body = {
    text: message,
    cards: [
      {
        sections: [
          {
            widgets: [
              {
                textParagraph: {
                  text: `<b>Webhook Payload:</b><br><pre>${JSON.stringify(payload, null, 2).slice(0, 2000)}</pre>`
                }
              }
            ]
          }
        ]
      }
    ]
  };

  // Post to Google Chat API
  const url = `https://chat.googleapis.com/v1/spaces/${spaceId}/messages`;
  const response = await axios.post(url, body, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  return response.status === 200;
}
