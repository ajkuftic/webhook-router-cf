import { createElement, Fragment } from 'hono/jsx';
import { Layout } from '../layout';
import { platformOptions, platformDescription } from '../index';

// Helper to extract credentials for display in the form
function extractCredentialsForDisplay(platform: string, credentials: Record<string, string>): string {
  if (platform === 'google_chat_app' && typeof credentials === 'object' && 'deployment_url' in credentials) {
    return credentials.deployment_url as string;
  }
  return JSON.stringify(credentials);
}

interface AccountFormPageProps {
  isEdit?: boolean;
  accountId?: string;
  account?: {
    name: string;
    platform: string;
    credentials: string | Record<string, string>;
  };
  error?: string;
}

export function AccountFormPage(props: AccountFormPageProps) {
  const { isEdit = false, accountId, account, error } = props;
  const title = isEdit ? `Edit Account - Webhook Router` : `Add Account - Webhook Router`;
  const submitUrl = isEdit ? `/accounts/${accountId}/edit` : `/accounts/add`;
  const pageTitle = isEdit ? `Edit ${account?.name}` : `Add New Account`;

  return (
    <Layout title={title} nav="accounts" error={error}>
      <div style="max-width: 600px; margin: 2rem auto;">
        <h2>{pageTitle}</h2>

        <form method="POST" action={submitUrl}>
          <div class="form-group">
            <label for="name">Account Name</label>
            <input
              type="text"
              id="name"
              name="name"
              placeholder="e.g., 'Production Alerts'"
              value={account?.name || ''}
              required
            />
          </div>

          <div class="form-group">
            <label for="platform">Notification Platform</label>
            <select
              id="platform"
              name="platform"
              value={account?.platform || ''}
              required
              onchange="updateCredentialsHint()"
            >
              <option value="">-- Select a platform --</option>
              {platformOptions().map((opt) => (
                <option key={opt.value} value={opt.value} selected={account?.platform === opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <small id="hint">
              {account?.platform
                ? platformDescription(account.platform as any)
                : 'Select a platform to see credentials format'}
            </small>
          </div>

          <div class="form-group">
            <label for="credentials" id="credentials-label">Credentials (JSON)</label>
            <textarea
              id="credentials"
              name="credentials"
              placeholder='{"webhook_url": "https://..."}'
              required
            >{account?.credentials ? (typeof account.credentials === 'string' ? account.credentials : extractCredentialsForDisplay(account.platform as string, account.credentials)) : ''}</textarea>
            <small id="credentials-help">
              Paste your platform webhook URL or API credentials as JSON
            </small>
          </div>

          <div class="form-group">
            <button type="submit">{isEdit ? 'Update Account' : 'Create Account'}</button>
            <a href="/accounts" class="action-link secondary" style="margin-left: 0.5rem;">Cancel</a>
          </div>
        </form>
      </div>

      <script>
        {`
          const platformHints = {
            slack: 'JSON: {"webhook_url": "https://hooks.slack.com/..."}',
            discord: 'JSON: {"webhook_url": "https://discord.com/api/webhooks/..."}',
            telegram: 'JSON: {"bot_token": "...", "chat_id": "..."}',
            google_chat: 'JSON: {"service_account_email": "...", "service_account_key": "...", "space_id": "..."}',
            google_chat_app: 'Paste your Apps Script deployment URL (https://script.google.com/...)',
            custom_api: 'JSON: {"endpoint": "https://...", "auth_header": "Bearer ..."}'
          };

          const platformLabels = {
            slack: 'Credentials (JSON)',
            discord: 'Credentials (JSON)',
            telegram: 'Credentials (JSON)',
            google_chat: 'Credentials (JSON)',
            google_chat_app: 'Deployment URL',
            custom_api: 'Credentials (JSON)'
          };

          const platformHelp = {
            slack: 'Paste your platform webhook URL or API credentials as JSON',
            discord: 'Paste your platform webhook URL or API credentials as JSON',
            telegram: 'Paste your platform webhook URL or API credentials as JSON',
            google_chat: 'Paste your platform webhook URL or API credentials as JSON',
            google_chat_app: 'Paste the Apps Script deployment URL from your deployed web app',
            custom_api: 'Paste your platform webhook URL or API credentials as JSON'
          };

          function updateCredentialsHint() {
            const platform = document.getElementById('platform').value;
            const hint = document.getElementById('hint');
            const label = document.getElementById('credentials-label');
            const help = document.getElementById('credentials-help');
            hint.textContent = platformHints[platform] || 'Select a platform to see credentials format';
            if (label) label.textContent = platformLabels[platform] || 'Credentials (JSON)';
            if (help) help.textContent = platformHelp[platform] || 'Enter your credentials';
          }
        `}
      </script>
    </Layout>
  );
}
