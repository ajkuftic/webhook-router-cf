import { createElement, Fragment } from 'hono/jsx';
import { Layout } from '../layout';

interface Rule {
  id: string;
  account_id: string;
  account_name: string;
  match_key: string;
  match_value: string;
  enabled: boolean | number;
}

interface RulesListPageProps {
  rules: Array<Omit<Rule, 'enabled'> & {enabled: boolean | number}>;
  accounts: Array<{ id: string; name: string }>;
}

export function RulesListPage(props: RulesListPageProps) {
  const { rules } = props;
  return (
    <Layout title="Rules - Webhook Router" nav="rules">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
        <h2>Routing Rules</h2>
        <a href="/rules/add" class="action-link">➕ Add Rule</a>
      </div>

      {rules.length === 0 ? (
        <div class="card">
          <p class="text-muted">
            No rules yet. <a href="/rules/add">Create a rule</a> to route webhooks based on JSON key-value matching.
          </p>
        </div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Account</th>
              <th>Match Key</th>
              <th>Match Value</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((rule) => (
              <tr key={rule.id}>
                <td><strong>{rule.account_name}</strong></td>
                <td><code>{rule.match_key}</code></td>
                <td><code>{rule.match_value}</code></td>
                <td>
                  <span class={`badge ${rule.enabled ? 'badge-sent' : 'badge-no_match'}`}>
                    {rule.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </td>
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
    </Layout>
  );
}

interface RuleFormPageProps {
  isEdit?: boolean;
  ruleId?: string;
  rule?: {
    account_id: string;
    match_key: string;
    match_value: string;
    enabled: boolean | number;
  };
  accounts: Array<{ id: string; name: string }>;
  error?: string;
}

export function RuleFormPage(props: RuleFormPageProps) {
  const { isEdit = false, ruleId, rule, accounts, error } = props;
  const title = isEdit ? `Edit Rule - Webhook Router` : `Add Rule - Webhook Router`;
  const submitUrl = isEdit ? `/rules/${ruleId}/edit` : `/rules/add`;
  const pageTitle = isEdit ? `Edit Rule` : `Add New Rule`;

  return (
    <Layout title={title} nav="rules" error={error}>
      <div style="max-width: 600px; margin: 2rem auto;">
        <h2>{pageTitle}</h2>

        <form method="POST" action={submitUrl}>
          <div class="form-group">
            <label for="account_id">Account</label>
            <select
              id="account_id"
              name="account_id"
              value={rule?.account_id || ''}
              required
            >
              <option value="">-- Select an account --</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id} selected={rule?.account_id === account.id}>
                  {account.name}
                </option>
              ))}
            </select>
            <small>
              Choose which account this rule belongs to
            </small>
          </div>

          <div class="form-group">
            <label for="match_key">JSON Key</label>
            <input
              type="text"
              id="match_key"
              name="match_key"
              placeholder="e.g., 'alert_type' or 'severity'"
              value={rule?.match_key || ''}
              required
            />
            <small>
              The JSON field to match on in incoming webhooks
            </small>
          </div>

          <div class="form-group">
            <label for="match_value">Expected Value</label>
            <input
              type="text"
              id="match_value"
              name="match_value"
              placeholder="e.g., 'critical' or 'high'"
              value={rule?.match_value || ''}
              required
            />
            <small>
              The value to match (webhooks will be sent only if this value matches)
            </small>
          </div>

          <div class="form-group">
            <label for="enabled">
              <input
                type="checkbox"
                id="enabled"
                name="enabled"
                value="true"
                checked={rule?.enabled !== false}
                style="width: auto; margin-right: 0.5rem;"
              />
              Enabled
            </label>
          </div>

          <div class="form-group">
            <button type="submit">{isEdit ? 'Update Rule' : 'Create Rule'}</button>
            <a href="/rules" class="action-link secondary" style="margin-left: 0.5rem;">Cancel</a>
          </div>
        </form>

        <div class="card" style="margin-top: 2rem;">
          <h3>Example</h3>
          <p style="margin-bottom: 1rem;">
            If you configure a rule with Key: <code>alert_type</code> and Value: <code>critical</code>,
            it will match webhooks like:
          </p>
          <code style="display: block; background: #f5f5f5; padding: 1rem; border-radius: 4px; overflow-x: auto;">
            {`{
  "alert_type": "critical",
  "message": "Server down",
  "timestamp": "2026-05-05T18:32:00Z"
}`}
          </code>
        </div>
      </div>
    </Layout>
  );
}
