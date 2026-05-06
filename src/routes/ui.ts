import { Hono, Context } from 'hono';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseClient } from '../db';
import { requireAuth, AppContext } from '../middleware/auth';
import { DashboardPage } from '../templates/pages/dashboard';
import { AccountsListPage, AccountDetailPage } from '../templates/pages/accounts';
import { AccountFormPage } from '../templates/pages/account-form';
import { RulesListPage, RuleFormPage } from '../templates/pages/rules';
import { DeleteConfirmPage } from '../templates/pages/delete-confirm';

const router = new Hono<AppContext>();

// Apply auth middleware to all routes
router.use(requireAuth);

// Helper to parse form data
async function getFormData(c: Context<AppContext>): Promise<Record<string, string>> {
  const formData = await c.req.formData();
  const data: Record<string, string> = {};
  for (const [key, value] of formData) {
    data[key] = String(value);
  }
  return data;
}

// GET / - Dashboard
router.get('/', async (c: Context<AppContext>) => {
  const db = new DatabaseClient(c.env.DB);

  try {
    const accounts = await db.getNotificationAccounts();
    const rules = await db.getNotificationRules();
    const logs = await db.getWebhookLogs(undefined, 10);

    const accountCount = accounts.length;
    const ruleCount = rules.length;

    // Count today's webhooks
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const webhooksTodayCount = logs.filter((log) => new Date(log.created_at) >= today).length;
    const failedTodayCount = logs.filter(
      (log) => new Date(log.created_at) >= today && log.status === 'failed'
    ).length;

    // Format logs for display
    const formattedLogs = logs.map((log) => ({
      id: log.id,
      account_id: log.account_id || '',
      account_name: accounts.find((a) => a.id === log.account_id)?.name || 'Unknown',
      platform: accounts.find((a) => a.id === log.account_id)?.platform || 'unknown',
      status: log.status as 'sent' | 'failed' | 'no_match',
      error: log.error,
      created_at: log.created_at
    }));

    return c.html(DashboardPage({
      accountCount,
      ruleCount,
      webhooksTodayCount,
      failedTodayCount,
      recentLogs: formattedLogs
    }));
  } catch (err) {
    console.error('Dashboard error:', err);
    return c.text('Error loading dashboard', 500);
  }
});

// GET /accounts - List accounts
router.get('/accounts', async (c) => {
  const db = new DatabaseClient(c.env.DB);

  try {
    const accounts = await db.getNotificationAccounts();
    const rules = await db.getNotificationRules();

    const accountsWithRuleCount = accounts.map((account) => ({
      id: account.id,
      name: account.name,
      platform: account.platform,
      enabled: !!(account.enabled || account.enabled === 0 ? account.enabled : 1),
      ruleCount: rules.filter((r) => r.account_id === account.id).length
    })) as Array<{id: string; name: string; platform: any; enabled: boolean; ruleCount: number}>;

    const page = await AccountsListPage({ accounts: accountsWithRuleCount });
    return c.html(page.toString());
  } catch (err) {
    console.error('Accounts error:', err);
    return c.text('Error loading accounts', 500);
  }
});

// GET /accounts/add - Show account form
router.get('/accounts/add', async (c) => {
  const page = await AccountFormPage({ isEdit: false });
  return c.html(page.toString());
});

// POST /accounts/add - Create account
router.post('/accounts/add', async (c) => {
  const db = new DatabaseClient(c.env.DB);

  try {
    const body = await getFormData(c);
    const name = body.name || '';
    const platform = body.platform || '';
    const credentials = body.credentials || '';

    // Validate
    if (!name) {
      const page = await AccountFormPage({ isEdit: false, error: 'Account name is required' });
      return c.html(page.toString());
    }

    if (!platform) {
      const page = await AccountFormPage({ isEdit: false, error: 'Platform is required' });
      return c.html(page.toString());
    }

    if (!credentials) {
      const page = await AccountFormPage({ isEdit: false, error: 'Credentials are required' });
      return c.html(page.toString());
    }

    // Try to parse credentials as JSON
    try {
      JSON.parse(credentials);
    } catch {
      const page = await AccountFormPage({
        isEdit: false,
        error: 'Credentials must be valid JSON'
      });
      return c.html(page.toString());
    }

    // Create account
    const accountId = uuidv4();
    const webhookSecret = uuidv4();

    await db.upsertNotificationAccount(accountId, {
      name,
      platform: platform as any,
      credentials: JSON.parse(credentials),
      webhook_secret: webhookSecret,
      enabled: 1
    });

    return c.redirect(`/accounts/${accountId}`);
  } catch (err) {
    console.error('Create account error:', err);
    const page = await AccountFormPage({
      isEdit: false,
      error: 'Error creating account'
    });
    return c.html(page.toString());
  }
});

// GET /accounts/:id - Show account detail
router.get('/accounts/:id', async (c) => {
  const db = new DatabaseClient(c.env.DB);
  const accountId = c.req.param('id');

  try {
    const account = await db.getNotificationAccount(accountId);

    if (!account) {
      return c.text('Account not found', 404);
    }

    const rules = await db.getNotificationRules(accountId);
    const logs = await db.getWebhookLogs(accountId, 10);

    const webhookUrl = `${new URL(c.req.url).origin}/webhook/${account.webhook_secret}`;

    const page = await AccountDetailPage({
      account,
      webhookUrl,
      rules,
      recentLogs: logs
    });

    return c.html(page.toString());
  } catch (err) {
    console.error('Account detail error:', err);
    return c.text('Error loading account', 500);
  }
});

// GET /accounts/:id/edit - Show edit form
router.get('/accounts/:id/edit', async (c) => {
  const db = new DatabaseClient(c.env.DB);
  const accountId = c.req.param('id');

  try {
    const account = await db.getNotificationAccount(accountId);

    if (!account) {
      return c.text('Account not found', 404);
    }

    const page = await AccountFormPage({
      isEdit: true,
      accountId,
      account: {
        name: account.name,
        platform: account.platform,
        credentials: typeof account.credentials === 'string' ? account.credentials : JSON.stringify(account.credentials)
      }
    });

    return c.html(page.toString());
  } catch (err) {
    console.error('Edit account error:', err);
    return c.text('Error loading account', 500);
  }
});

// POST /accounts/:id/edit - Update account
router.post('/accounts/:id/edit', async (c) => {
  const db = new DatabaseClient(c.env.DB);
  const accountId = c.req.param('id');

  try {
    const account = await db.getNotificationAccount(accountId);

    if (!account) {
      return c.text('Account not found', 404);
    }

    const body = await getFormData(c);
    const name = body.name || '';
    const platform = body.platform || '';
    const credentials = body.credentials || '';

    // Validate
    if (!name || !platform || !credentials) {
      const page = await AccountFormPage({
        isEdit: true,
        accountId,
        account: {
          name: account.name,
          platform: account.platform,
          credentials: typeof account.credentials === 'string' ? account.credentials : JSON.stringify(account.credentials)
        },
        error: 'All fields are required'
      });
      return c.html(page.toString());
    }

    // Validate JSON
    try {
      JSON.parse(credentials);
    } catch {
      const page = await AccountFormPage({
        isEdit: true,
        accountId,
        account: {
          name: account.name,
          platform: account.platform,
          credentials: typeof account.credentials === 'string' ? account.credentials : JSON.stringify(account.credentials)
        },
        error: 'Credentials must be valid JSON'
      });
      return c.html(page.toString());
    }

    // Update account
    await db.upsertNotificationAccount(accountId, {
      name,
      platform: platform as any,
      credentials: JSON.parse(credentials),
      webhook_secret: account.webhook_secret,
      enabled: account.enabled
    });

    return c.redirect(`/accounts/${accountId}`);
  } catch (err) {
    console.error('Update account error:', err);
    return c.text('Error updating account', 500);
  }
});

// GET /accounts/:id/delete - Show delete confirmation
router.get('/accounts/:id/delete', async (c) => {
  const db = new DatabaseClient(c.env.DB);
  const accountId = c.req.param('id');

  try {
    const account = await db.getNotificationAccount(accountId);

    if (!account) {
      return c.text('Account not found', 404);
    }

    const rules = await db.getNotificationRules(accountId);

    const warning =
      rules.length > 0
        ? `This account has ${rules.length} associated rule(s) that will also be deleted.`
        : undefined;

    const page = await DeleteConfirmPage({
      itemType: 'account',
      itemId: accountId,
      itemName: account.name,
      warning
    });

    return c.html(page.toString());
  } catch (err) {
    console.error('Delete account error:', err);
    return c.text('Error loading account', 500);
  }
});

// POST /accounts/:id/delete - Delete account
router.post('/accounts/:id/delete', async (c) => {
  const db = new DatabaseClient(c.env.DB);
  const accountId = c.req.param('id');

  try {
    // Delete all rules for this account
    const rules = await db.getNotificationRules(accountId);
    for (const rule of rules) {
      await db.deleteNotificationRule(rule.id);
    }

    // Delete account
    await db.deleteNotificationAccount(accountId);

    return c.redirect('/accounts');
  } catch (err) {
    console.error('Delete account error:', err);
    return c.text('Error deleting account', 500);
  }
});

// GET /rules - List all rules
router.get('/rules', async (c) => {
  const db = new DatabaseClient(c.env.DB);

  try {
    const rules = await db.getNotificationRules();
    const accounts = await db.getNotificationAccounts();

    const rulesWithAccountName = rules.map((rule) => ({
      ...rule,
      account_name: accounts.find((a) => a.id === rule.account_id)?.name || 'Unknown'
    }));

    const page = await RulesListPage({
      rules: rulesWithAccountName,
      accounts
    });

    return c.html(page.toString());
  } catch (err) {
    console.error('Rules error:', err);
    return c.text('Error loading rules', 500);
  }
});

// GET /rules/add - Show rule form
router.get('/rules/add', async (c) => {
  const db = new DatabaseClient(c.env.DB);

  try {
    const accounts = await db.getNotificationAccounts();

    const page = await RuleFormPage({
      isEdit: false,
      accounts: accounts.map((a) => ({ id: a.id, name: a.name }))
    });

    return c.html(page.toString());
  } catch (err) {
    console.error('Rule form error:', err);
    return c.text('Error loading form', 500);
  }
});

// POST /rules/add - Create rule
router.post('/rules/add', async (c) => {
  const db = new DatabaseClient(c.env.DB);

  try {
    const body = await getFormData(c);
    const accountId = body.account_id || '';
    const matchKey = body.match_key || '';
    const matchValue = body.match_value || '';

    // Validate
    if (!accountId || !matchKey || !matchValue) {
      const accounts = await db.getNotificationAccounts();
      const page = await RuleFormPage({
        isEdit: false,
        accounts: accounts.map((a) => ({ id: a.id, name: a.name })),
        error: 'All fields are required'
      });
      return c.html(page.toString());
    }

    // Verify account exists
    const account = await db.getNotificationAccount(accountId);
    if (!account) {
      const accounts = await db.getNotificationAccounts();
      const page = await RuleFormPage({
        isEdit: false,
        accounts: accounts.map((a) => ({ id: a.id, name: a.name })),
        error: 'Account not found'
      });
      return c.html(page.toString());
    }

    // Create rule
    const ruleId = uuidv4();
    await db.upsertNotificationRule(ruleId, {
      account_id: accountId,
      match_key: matchKey,
      match_value: matchValue,
      enabled: 1
    });

    return c.redirect('/rules');
  } catch (err) {
    console.error('Create rule error:', err);
    const accounts = await db.getNotificationAccounts();
    const page = await RuleFormPage({
      isEdit: false,
      accounts: accounts.map((a) => ({ id: a.id, name: a.name })),
      error: 'Error creating rule'
    });
    return c.html(page.toString());
  }
});

// GET /rules/:id/edit - Show edit form
router.get('/rules/:id/edit', async (c) => {
  const db = new DatabaseClient(c.env.DB);
  const ruleId = c.req.param('id');

  try {
    const rule = await db.getNotificationRule(ruleId);

    if (!rule) {
      return c.text('Rule not found', 404);
    }

    const accounts = await db.getNotificationAccounts();

    const page = await RuleFormPage({
      isEdit: true,
      ruleId,
      rule,
      accounts: accounts.map((a) => ({ id: a.id, name: a.name }))
    });

    return c.html(page.toString());
  } catch (err) {
    console.error('Edit rule error:', err);
    return c.text('Error loading rule', 500);
  }
});

// POST /rules/:id/edit - Update rule
router.post('/rules/:id/edit', async (c) => {
  const db = new DatabaseClient(c.env.DB);
  const ruleId = c.req.param('id');

  try {
    const rule = await db.getNotificationRule(ruleId);

    if (!rule) {
      return c.text('Rule not found', 404);
    }

    const body = await getFormData(c);
    const accountId = body.account_id || '';
    const matchKey = body.match_key || '';
    const matchValue = body.match_value || '';

    // Validate
    if (!accountId || !matchKey || !matchValue) {
      const accounts = await db.getNotificationAccounts();
      const page = await RuleFormPage({
        isEdit: true,
        ruleId,
        rule,
        accounts: accounts.map((a) => ({ id: a.id, name: a.name })),
        error: 'All fields are required'
      });
      return c.html(page.toString());
    }

    // Update rule
    await db.upsertNotificationRule(ruleId, {
      account_id: rule.account_id,
      match_key: matchKey,
      match_value: matchValue,
      enabled: rule.enabled
    });

    return c.redirect('/rules');
  } catch (err) {
    console.error('Update rule error:', err);
    return c.text('Error updating rule', 500);
  }
});

// POST /rules/:id/delete - Delete rule
router.post('/rules/:id/delete', async (c) => {
  const db = new DatabaseClient(c.env.DB);
  const ruleId = c.req.param('id');

  try {
    await db.deleteNotificationRule(ruleId);
    return c.redirect('/rules');
  } catch (err) {
    console.error('Delete rule error:', err);
    return c.text('Error deleting rule', 500);
  }
});

export default router;
