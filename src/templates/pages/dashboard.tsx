import { createElement, Fragment } from 'hono/jsx';
import { Layout } from '../layout';
import { statusBadge, formatDate, truncate, platformBadge } from '../index';

interface WebhookLog {
  id: string;
  account_id: string;
  account_name: string;
  platform: string;
  status: 'sent' | 'failed' | 'no_match';
  error?: string;
  created_at: string;
}

interface DashboardPageProps {
  accountCount: number;
  ruleCount: number;
  webhooksTodayCount: number;
  failedTodayCount: number;
  recentLogs: WebhookLog[];
}

export function DashboardPage(props: DashboardPageProps) {
  const { accountCount, ruleCount, webhooksTodayCount, failedTodayCount, recentLogs } = props;
  return (
    <Layout title="Dashboard - Webhook Router" nav="dashboard">
      <h2>Dashboard</h2>

      <div class="stats">
        <div class="stat">
          <div class="stat-label">Total Accounts</div>
          <div class="stat-value">{accountCount}</div>
        </div>
        <div class="stat">
          <div class="stat-label">Total Rules</div>
          <div class="stat-value">{ruleCount}</div>
        </div>
        <div class="stat">
          <div class="stat-label">Today's Webhooks</div>
          <div class="stat-value">{webhooksTodayCount}</div>
        </div>
        <div class="stat">
          <div class="stat-label">Failed Today</div>
          <div class="stat-value" style="color: #e74c3c;">{failedTodayCount}</div>
        </div>
      </div>

      <div class="card">
        <h3>Recent Webhook Activity</h3>
        {recentLogs.length === 0 ? (
          <p class="text-muted">No webhook activity yet. Set up an account and send a webhook to get started.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Account</th>
                <th>Platform</th>
                <th>Status</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {recentLogs.map((log) => (
                <tr key={log.id}>
                  <td>{formatDate(log.created_at)}</td>
                  <td>{log.account_name}</td>
                  <td>{platformBadge(log.platform as any)}</td>
                  <td>{statusBadge(log.status)}</td>
                  <td>
                    {log.status === 'failed' && log.error ? (
                      <span title={log.error} class="text-muted">{truncate(log.error, 40)}</span>
                    ) : (
                      <span class="text-muted">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div class="card" style="margin-top: 2rem;">
        <h3>Quick Actions</h3>
        <div class="btn-group">
          <a href="/accounts/add" class="action-link">➕ Add Account</a>
          <a href="/accounts" class="action-link">📋 Manage Accounts</a>
          <a href="/rules/add" class="action-link">➕ Add Rule</a>
          <a href="/rules" class="action-link">📋 Manage Rules</a>
        </div>
      </div>
    </Layout>
  );
}
