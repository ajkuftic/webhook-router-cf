import axios from 'axios';

export async function sendSlackMessage(webhookUrl: string, message: string, payload: Record<string, unknown> = {}): Promise<boolean> {
  if (!webhookUrl) throw new Error('Slack webhook URL is required');

  const body = {
    text: message,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: message
        }
      },
      {
        type: 'divider'
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '```' + JSON.stringify(payload, null, 2).slice(0, 1000) + '```'
        }
      }
    ]
  };

  const response = await axios.post(webhookUrl, body, {
    headers: { 'Content-Type': 'application/json' }
  });

  return response.status === 200;
}
