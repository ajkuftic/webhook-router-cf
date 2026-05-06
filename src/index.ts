import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import webhookRouter from './routes/webhook';
import authRouter from './routes/auth';
import uiRouter from './routes/ui';
import { sessionMiddleware } from './middleware/auth';

type Bindings = {
  DB: D1Database;
  ENVIRONMENT?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Middleware
app.use(logger());
app.use(cors());
app.use(sessionMiddleware);

// Public routes
app.route('/webhook', webhookRouter);

// API routes (public)
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth routes (public)
app.route('/auth', authRouter);

// UI routes (protected by requireAuth middleware in the router)
app.route('/', uiRouter);

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Error:', err);
  return c.json({ error: err.message || 'Internal server error' }, 500);
});

export default app;
