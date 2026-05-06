import axios from 'axios';

export async function sendGoogleChatMessage(webhookUrl: string, message: string, payload: Record<string, unknown> = {}): Promise<boolean> {
  if (!webhookUrl) throw new Error('Google Chat webhook URL is required');

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

  const response = await axios.post(webhookUrl, body, {
    headers: { 'Content-Type': 'application/json' }
  });

  return response.status === 200;
}
