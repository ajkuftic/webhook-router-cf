import { createElement, Fragment } from 'hono/jsx';
import { Layout } from '../layout';
import { platformOptions, platformDescription } from '../index';

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
            <label for="credentials">Credentials (JSON)</label>
            <textarea
              id="credentials"
              name="credentials"
              placeholder='{"webhook_url": "https://..."}'
              required
            >{account?.credentials ? (typeof account.credentials === 'string' ? account.credentials : JSON.stringify(account.credentials)) : ''}</textarea>
            <small>
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
            google_chat: 'JSON: {"webhook_url": "https://chat.googleapis.com/v1/spaces/..."}',
            custom_api: 'JSON: {"endpoint": "https://...", "auth_header": "Bearer ..."}'
          };

          function updateCredentialsHint() {
            const platform = document.getElementById('platform').value;
            const hint = document.getElementById('hint');
            hint.textContent = platformHints[platform] || 'Select a platform to see credentials format';
          }
        `}
      </script>
    </Layout>
  );
}
