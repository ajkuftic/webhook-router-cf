import axios from 'axios';

export async function sendGoogleChatAppMessage(
  deploymentUrl: string,
  message: string,
  payload: Record<string, unknown> = {}
): Promise<boolean> {
  if (!deploymentUrl) throw new Error('Google Chat App deployment URL is required');

  const body = {
    message,
    ...payload
  };

  const response = await axios.post(deploymentUrl, body, {
    headers: { 'Content-Type': 'application/json' },
    timeout: 10000
  });

  // Apps Script returns 200 on success
  return response.status === 200;
}
