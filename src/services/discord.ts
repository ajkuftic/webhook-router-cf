import axios from 'axios';

export async function sendDiscordMessage(webhookUrl: string, message: string, payload: Record<string, unknown> = {}): Promise<boolean> {
  if (!webhookUrl) throw new Error('Discord webhook URL is required');

  const body = {
    content: message,
    embeds: [
      {
        description: JSON.stringify(payload, null, 2).slice(0, 2000),
        color: 3447003
      }
    ]
  };

  const response = await axios.post(webhookUrl, body, {
    headers: { 'Content-Type': 'application/json' }
  });

  return response.status === 204 || response.status === 200;
}
