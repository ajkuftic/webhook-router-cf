import { DatabaseClient } from '../db';
import { sendSlackMessage } from './slack';
import { sendDiscordMessage } from './discord';
import { sendTelegramMessage } from './telegram';
import { sendGoogleChatMessage } from './google-chat';
import { sendGoogleChatAppMessage } from './google-chat-app';
import { sendCustomAPI } from './custom-api';

export interface RouteResult {
  success: boolean;
  matched: boolean;
  ruleCount: number;
  results?: Array<{ ruleId: string; success: boolean; error?: string }>;
}

export async function routeWebhook(db: DatabaseClient, accountId: string, payload: Record<string, unknown>): Promise<RouteResult> {
  const account = await db.getNotificationAccount(accountId);
  if (!account) throw new Error('Account not found');
  if (!account.enabled) throw new Error('Account is disabled');

  const rules = await db.getNotificationRules(accountId);
  const matchedRules = rules.filter((rule) => rule.enabled && ruleMatches(rule, payload));

  if (matchedRules.length === 0) {
    await db.logWebhook(accountId, null, 'no_match', undefined, JSON.stringify(payload).slice(0, 500));
    return { success: false, matched: false, ruleCount: 0 };
  }

  const results: Array<{ ruleId: string; success: boolean; error?: string }> = [];
  for (const rule of matchedRules) {
    try {
      const message = formatMessage(account.message_format, rule, payload);
      await dispatchNotification(account, message, payload);
      await db.logWebhook(accountId, rule.id, 'sent', undefined, JSON.stringify(payload).slice(0, 500));
      results.push({ ruleId: rule.id, success: true });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      await db.logWebhook(accountId, rule.id, 'failed', errorMsg, JSON.stringify(payload).slice(0, 500));
      results.push({ ruleId: rule.id, success: false, error: errorMsg });
    }
  }

  return { success: results.every((r) => r.success), matched: true, ruleCount: results.length, results };
}

function ruleMatches(rule: { match_key: string; match_value: string }, payload: Record<string, unknown>): boolean {
  const value = payload[rule.match_key];
  if (value === undefined) return false;
  return String(value) === String(rule.match_value);
}

function formatMessage(
  template: string | null | undefined,
  rule: { match_key: string; match_value: string },
  payload: Record<string, unknown>
): string {
  if (!template) {
    return `Webhook received: ${rule.match_key}=${rule.match_value}`;
  }

  return template
    .replace(/{timestamp}/g, new Date().toISOString())
    .replace(/{match_key}/g, rule.match_key)
    .replace(/{match_value}/g, rule.match_value)
    .replace(/{json}/g, JSON.stringify(payload, null, 2));
}

async function dispatchNotification(account: { platform: string; credentials: Record<string, string> }, message: string, payload: Record<string, unknown>) {
  const { platform, credentials } = account;

  switch (platform) {
    case 'slack':
      return sendSlackMessage(credentials.webhook_url, message, payload);

    case 'discord':
      return sendDiscordMessage(credentials.webhook_url, message, payload);

    case 'telegram':
      return sendTelegramMessage(credentials.bot_token, credentials.chat_id, message, payload);

    case 'google_chat':
      return sendGoogleChatMessage(
        credentials.service_account_email,
        credentials.service_account_key,
        credentials.space_id,
        message,
        payload
      );

    case 'google_chat_app':
      return sendGoogleChatAppMessage(credentials.deployment_url, message, payload);

    case 'custom_api':
      return sendCustomAPI(credentials.url, credentials.method || 'POST', JSON.parse(credentials.headers || '{}'), { message, payload });

    default:
      throw new Error(`Unknown platform: ${platform}`);
  }
}
