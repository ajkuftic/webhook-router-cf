import { Hono, Context } from 'hono';
import { DatabaseClient } from '../db';
import { routeWebhook } from '../services/router';

const router = new Hono();

router.post('/:secret', async (c: Context<{ Bindings: { DB: D1Database } }>) => {
  try {
    const db = new DatabaseClient(c.env.DB);
    const secret = c.req.param('secret');

    if (!secret) {
      return c.json({ success: false, error: 'Missing secret' }, 400);
    }

    const account = await db.getNotificationAccountBySecret(secret);
    if (!account) {
      return c.json({ success: false, error: 'Account not found' }, 404);
    }

    const payload = await c.req.json();
    const result = await routeWebhook(db, account.id, payload as Record<string, unknown>);

    return c.json(result, 200);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Webhook error:', errorMsg);
    return c.json({ success: false, error: errorMsg }, 500);
  }
});

export default router;
