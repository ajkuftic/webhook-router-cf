import axios from 'axios';

export async function sendCustomAPI(
  url: string,
  method: string = 'POST',
  headers: Record<string, string> = {},
  body: Record<string, unknown> = {}
): Promise<boolean> {
  if (!url) throw new Error('Custom API URL is required');

  const config = {
    method: method.toUpperCase(),
    url: url,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };

  if (method.toUpperCase() !== 'GET') {
    (config as Record<string, unknown>).data = body;
  }

  const response = await axios(config);

  return response.status >= 200 && response.status < 300;
}
