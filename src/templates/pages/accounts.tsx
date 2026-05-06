import { createElement, Fragment } from 'hono/jsx';
import { Layout } from '../layout';
import { platformBadge } from '../index';

interface Account {
  id: string;
  name: string;
  platform: string;
  enabled: boolean;
  ruleCount: number;
}

interface AccountsListPageProps {
  accounts: Account[];
}

export function AccountsListPage(props: AccountsListPageProps) {
  const { accounts } = props;
  return (
    <Layout title="Accounts - Webhook Router" nav="accounts">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
        <h2>Notification Accounts</h2>
        <a href="/accounts/add" class="action-link">➕ Add Account</a>
      </div>

      {accounts.length === 0 ? (
        <div class="card">
          <p class="text-muted">No accounts yet. <a href="/accounts/add">Create your first account</a> to get started.</p>
        </div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Account Name</th>
              <th>Platform</th>
              <th>Status</th>
              <th>Rules</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((account) => (
              <tr key={account.id}>
                <td><strong>{account.name}</strong></td>
                <td>{platformBadge(account.platform as any)}</td>
                <td>
                  <span class={`badge ${account.enabled ? 'badge-sent' : 'badge-no_match'}`}>
                    {account.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </td>
                <td>{account.ruleCount}</td>
                <td>
                  <div class="actions">
                    <a href={`/accounts/${account.id}`} class="action-link">View</a>
                    <a href={`/accounts/${account.id}/edit`} class="action-link">Edit</a>
                    <a href={`/accounts/${account.id}/delete`} class="action-link danger">Delete</a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Layout>
  );
}

interface AccountDetailPageProps {
  account: {
    id: string;
    name: string;
    platform: string;
    webhook_secret: string;
  };
  webhookUrl: string;
  rules: Array<{ id: string; match_key: string; match_value: string }>;
  recentLogs: Array<{ id: string; status: string; created_at: string }>;
}

export function AccountDetailPage(props: AccountDetailPageProps) {
  const { account, webhookUrl, rules, recentLogs } = props;
  return (
    <Layout title={`${account.name} - Webhook Router`} nav="accounts">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
        <h2>{account.name}</h2>
        <div class="btn-group">
          <a href={`/accounts/${account.id}/edit`} class="action-link">Edit</a>
          <a href={`/accounts/${account.id}/delete`} class="action-link danger">Delete</a>
        </div>
      </div>

      <div class="card">
        <h3>Account Details</h3>
        <table>
          <tbody>
            <tr>
              <td><strong>Platform</strong></td>
              <td>{platformBadge(account.platform as any)}</td>
            </tr>
            <tr>
              <td><strong>Webhook Secret</strong></td>
              <td>
                <code>{account.webhook_secret}</code>
              </td>
            </tr>
            <tr>
              <td><strong>Webhook URL</strong></td>
              <td>
                <code>{webhookUrl}</code>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="card">
        <h3>Associated Rules ({rules.length})</h3>
        {rules.length === 0 ? (
          <p class="text-muted">No rules yet. <a href={`/rules/add?account=${account.id}`}>Create a rule</a> to route webhooks.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Match Key</th>
                <th>Match Value</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule.id}>
                  <td><code>{rule.match_key}</code></td>
                  <td><code>{rule.match_value}</code></td>
                  <td>
                    <div class="actions">
                      <a href={`/rules/${rule.id}/edit`} class="action-link">Edit</a>
                      <form method="POST" action={`/rules/${rule.id}/delete`} style="display: inline;">
                        <button type="submit" class="action-link danger" onclick="return confirm('Delete this rule?')">Delete</button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div class="card">
        <h3>Recent Activity ({recentLogs.length})</h3>
        {recentLogs.length === 0 ? (
          <p class="text-muted">No webhook activity yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Status</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {recentLogs.slice(0, 10).map((log) => (
                <tr key={log.id}>
                  <td>{log.status}</td>
                  <td>{new Date(log.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}
