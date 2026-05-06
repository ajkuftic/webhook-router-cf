import axios from 'axios';

export async function sendTelegramMessage(botToken: string, chatId: string, message: string, payload: Record<string, unknown> = {}): Promise<boolean> {
  if (!botToken || !chatId) throw new Error('Telegram bot token and chat ID are required');

  const text = `${message}\n\n\`\`\`\n${JSON.stringify(payload, null, 2).slice(0, 4000)}\n\`\`\``;

  const response = await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    chat_id: chatId,
    text: text,
    parse_mode: 'Markdown'
  });

  return response.data.ok === true;
}
