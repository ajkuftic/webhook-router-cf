import { D1Database } from '@cloudflare/workers-types';

export interface NotificationAccount {
  id: string;
  name: string;
  platform: 'slack' | 'discord' | 'telegram' | 'google_chat' | 'custom_api';
  credentials: Record<string, string>;
  webhook_secret: string;
  message_format?: string;
  enabled: number;
  created_at: string;
}

export interface NotificationRule {
  id: string;
  account_id: string;
  match_key: string;
  match_value: string;
  enabled: number;
  created_at: string;
}

export interface WebhookLog {
  id: string;
  account_id?: string;
  rule_id?: string;
  status: 'sent' | 'failed' | 'no_match';
  error?: string;
  payload_preview?: string;
  created_at: string;
}

export class DatabaseClient {
  constructor(private db: D1Database) {}

  // Config helpers
  async getConfig(key: string): Promise<string | null> {
    const result = await this.db.prepare('SELECT value FROM config WHERE key = ?').bind(key).first<{ value: string }>();
    return result?.value || null;
  }

  async setConfig(key: string, value: string): Promise<void> {
    await this.db.prepare('INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)').bind(key, value).run();
  }

  async getAllConfig(): Promise<Record<string, string>> {
    const results = await this.db.prepare('SELECT key, value FROM config').all<{ key: string; value: string }>();
    const config: Record<string, string> = {};
    results.results?.forEach((row) => {
      config[row.key] = row.value;
    });
    return config;
  }

  // Account helpers
  async getNotificationAccounts(): Promise<NotificationAccount[]> {
    const results = await this.db
      .prepare('SELECT * FROM notification_accounts ORDER BY created_at DESC')
      .all<Omit<NotificationAccount, 'credentials'>>();

    return (results.results || []).map((row) => ({
      ...row,
      credentials: {}
    }));
  }

  async getNotificationAccount(id: string): Promise<NotificationAccount | null> {
    const result = await this.db
      .prepare('SELECT * FROM notification_accounts WHERE id = ?')
      .bind(id)
      .first<Omit<NotificationAccount, 'credentials'> & { credentials: string }>();

    if (!result) return null;

    return {
      ...result,
      credentials: JSON.parse(result.credentials)
    };
  }

  async getNotificationAccountBySecret(secret: string): Promise<NotificationAccount | null> {
    const result = await this.db
      .prepare('SELECT * FROM notification_accounts WHERE webhook_secret = ?')
      .bind(secret)
      .first<Omit<NotificationAccount, 'credentials'> & { credentials: string }>();

    if (!result) return null;

    return {
      ...result,
      credentials: JSON.parse(result.credentials)
    };
  }

  async upsertNotificationAccount(
    id: string,
    data: {
      name: string;
      platform: NotificationAccount['platform'];
      credentials: Record<string, string>;
      webhook_secret: string;
      message_format?: string;
      enabled: number;
    }
  ): Promise<void> {
    const credentialsJson = JSON.stringify(data.credentials);
    const createdAt = new Date().toISOString();

    const existing = await this.db
      .prepare('SELECT id FROM notification_accounts WHERE id = ?')
      .bind(id)
      .first();

    if (existing) {
      await this.db
        .prepare(
          'UPDATE notification_accounts SET name = ?, platform = ?, credentials = ?, webhook_secret = ?, message_format = ?, enabled = ? WHERE id = ?'
        )
        .bind(data.name, data.platform, credentialsJson, data.webhook_secret, data.message_format || null, data.enabled, id)
        .run();
    } else {
      await this.db
        .prepare(
          'INSERT INTO notification_accounts (id, name, platform, credentials, webhook_secret, message_format, enabled, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        )
        .bind(id, data.name, data.platform, credentialsJson, data.webhook_secret, data.message_format || null, data.enabled, createdAt)
        .run();
    }
  }

  async deleteNotificationAccount(id: string): Promise<void> {
    await this.db.prepare('DELETE FROM notification_accounts WHERE id = ?').bind(id).run();
  }

  // Rule helpers
  async getNotificationRules(accountId?: string): Promise<NotificationRule[]> {
    let query = 'SELECT * FROM notification_rules';
    let bindings: string[] = [];

    if (accountId) {
      query += ' WHERE account_id = ?';
      bindings = [accountId];
    }

    query += ' ORDER BY created_at DESC';

    const statement = this.db.prepare(query);
    const results = await (bindings.length > 0 ? statement.bind(...bindings).all<NotificationRule>() : statement.all<NotificationRule>());

    return results.results || [];
  }

  async getNotificationRule(id: string): Promise<NotificationRule | null> {
    const result = await this.db
      .prepare('SELECT * FROM notification_rules WHERE id = ?')
      .bind(id)
      .first<NotificationRule>();

    return result || null;
  }

  async upsertNotificationRule(
    id: string,
    data: {
      account_id: string;
      match_key: string;
      match_value: string;
      enabled: number;
    }
  ): Promise<void> {
    const createdAt = new Date().toISOString();
    const existing = await this.db.prepare('SELECT id FROM notification_rules WHERE id = ?').bind(id).first();

    if (existing) {
      await this.db
        .prepare('UPDATE notification_rules SET account_id = ?, match_key = ?, match_value = ?, enabled = ? WHERE id = ?')
        .bind(data.account_id, data.match_key, data.match_value, data.enabled, id)
        .run();
    } else {
      await this.db
        .prepare(
          'INSERT INTO notification_rules (id, account_id, match_key, match_value, enabled, created_at) VALUES (?, ?, ?, ?, ?, ?)'
        )
        .bind(id, data.account_id, data.match_key, data.match_value, data.enabled, createdAt)
        .run();
    }
  }

  async deleteNotificationRule(id: string): Promise<void> {
    await this.db.prepare('DELETE FROM notification_rules WHERE id = ?').bind(id).run();
  }

  // Log helpers
  async logWebhook(
    accountId: string | null,
    ruleId: string | null,
    status: 'sent' | 'failed' | 'no_match',
    error?: string,
    payloadPreview?: string
  ): Promise<void> {
    const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
    const createdAt = new Date().toISOString();

    await this.db
      .prepare(
        'INSERT INTO webhook_logs (id, account_id, rule_id, status, error, payload_preview, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      )
      .bind(id, accountId, ruleId, status, error || null, payloadPreview || null, createdAt)
      .run();
  }

  async getWebhookLogs(accountId?: string, limit = 50): Promise<WebhookLog[]> {
    let query = 'SELECT * FROM webhook_logs';
    let bindings: (string | number)[] = [];

    if (accountId) {
      query += ' WHERE account_id = ?';
      bindings = [accountId];
    }

    query += ' ORDER BY created_at DESC LIMIT ?';
    bindings.push(limit);

    const statement = this.db.prepare(query);
    const results = await statement.bind(...bindings).all<WebhookLog>();

    return results.results || [];
  }

  // Session helpers
  async getSession(id: string): Promise<Record<string, unknown> | null> {
    const result = await this.db
      .prepare('SELECT data FROM sessions WHERE id = ? AND expires_at > ?')
      .bind(id, new Date().toISOString())
      .first<{ data: string }>();

    if (!result) return null;

    try {
      return JSON.parse(result.data);
    } catch {
      return null;
    }
  }

  async setSession(id: string, data: Record<string, unknown>, expiresAt: Date): Promise<void> {
    await this.db
      .prepare('INSERT OR REPLACE INTO sessions (id, data, expires_at) VALUES (?, ?, ?)')
      .bind(id, JSON.stringify(data), expiresAt.toISOString())
      .run();
  }

  async deleteSession(id: string): Promise<void> {
    await this.db.prepare('DELETE FROM sessions WHERE id = ?').bind(id).run();
  }

  async cleanupExpiredSessions(): Promise<void> {
    await this.db
      .prepare('DELETE FROM sessions WHERE expires_at < ?')
      .bind(new Date().toISOString())
      .run();
  }
}

export default DatabaseClient;
