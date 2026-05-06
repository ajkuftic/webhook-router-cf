-- Notification accounts
CREATE TABLE IF NOT EXISTS notification_accounts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  platform TEXT NOT NULL CHECK(platform IN ('slack', 'discord', 'telegram', 'google_chat', 'custom_api')),
  credentials TEXT NOT NULL,
  webhook_secret TEXT NOT NULL UNIQUE,
  message_format TEXT,
  enabled INTEGER DEFAULT 1,
  created_at TEXT NOT NULL
);

-- Notification rules
CREATE TABLE IF NOT EXISTS notification_rules (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  match_key TEXT NOT NULL,
  match_value TEXT NOT NULL,
  enabled INTEGER DEFAULT 1,
  created_at TEXT NOT NULL,
  FOREIGN KEY (account_id) REFERENCES notification_accounts(id) ON DELETE CASCADE
);

-- Webhook logs
CREATE TABLE IF NOT EXISTS webhook_logs (
  id TEXT PRIMARY KEY,
  account_id TEXT,
  rule_id TEXT,
  status TEXT NOT NULL CHECK(status IN ('sent', 'failed', 'no_match')),
  error TEXT,
  payload_preview TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (account_id) REFERENCES notification_accounts(id) ON DELETE SET NULL,
  FOREIGN KEY (rule_id) REFERENCES notification_rules(id) ON DELETE SET NULL
);

-- Sessions
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

-- Config
CREATE TABLE IF NOT EXISTS config (
  key TEXT PRIMARY KEY,
  value TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_rules_account ON notification_rules(account_id);
CREATE INDEX IF NOT EXISTS idx_logs_account ON webhook_logs(account_id);
CREATE INDEX IF NOT EXISTS idx_logs_created ON webhook_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_accounts_secret ON notification_accounts(webhook_secret);
