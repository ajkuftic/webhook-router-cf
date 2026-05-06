export type Platform = 'slack' | 'discord' | 'telegram' | 'google_chat' | 'custom_api';
export type WebhookStatus = 'sent' | 'failed' | 'no_match';

export function platformBadge(platform: Platform): string {
  const labels: Record<Platform, string> = {
    slack: 'Slack',
    discord: 'Discord',
    telegram: 'Telegram',
    google_chat: 'Google Chat',
    custom_api: 'Custom API'
  };

  return `<span class="badge badge-${platform}">${labels[platform]}</span>`;
}

export function statusBadge(status: WebhookStatus): string {
  const labels: Record<WebhookStatus, string> = {
    sent: 'Sent',
    failed: 'Failed',
    no_match: 'No Match'
  };

  return `<span class="badge badge-${status}">${labels[status]}</span>`;
}

export function platformOptions(): Array<{ value: Platform; label: string }> {
  return [
    { value: 'slack', label: 'Slack' },
    { value: 'discord', label: 'Discord' },
    { value: 'telegram', label: 'Telegram' },
    { value: 'google_chat', label: 'Google Chat' },
    { value: 'custom_api', label: 'Custom API' }
  ];
}

export function platformDescription(platform: Platform): string {
  const descriptions: Record<Platform, string> = {
    slack: 'JSON: {"webhook_url": "https://hooks.slack.com/..."}',
    discord: 'JSON: {"webhook_url": "https://discord.com/api/webhooks/..."}',
    telegram: 'JSON: {"bot_token": "...", "chat_id": "..."}',
    google_chat: 'JSON: {"webhook_url": "https://chat.googleapis.com/v1/spaces/..."}',
    custom_api: 'JSON: {"endpoint": "https://...", "auth_header": "Bearer ..."}'
  };

  return descriptions[platform];
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.substring(0, length) + '...';
}

export function generateWebhookUrl(baseUrl: string, secret: string): string {
  return `${baseUrl}/webhook/${secret}`;
}
