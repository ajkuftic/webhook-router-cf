import { Hono, Context } from 'hono';
import { hash, compare } from 'bcryptjs';
import { DatabaseClient } from '../db';
import { createSession, destroySession, AppContext } from '../middleware/auth';
import { LoginPage, SetPasswordPage } from '../templates/pages/auth';

const router = new Hono<AppContext>();

// Helper to parse form data
async function getFormData(c: Context<AppContext>): Promise<Record<string, string>> {
  const formData = await c.req.formData();
  const data: Record<string, string> = {};
  for (const [key, value] of formData) {
    data[key] = String(value);
  }
  return data;
}

// Helper to render JSX safely
function renderPage(component: any): string {
  return component?.toString() || '<html><body>Error rendering page</body></html>';
}

// Determine if password is set
async function isPasswordSet(db: DatabaseClient): Promise<boolean> {
  const config = await db.getConfig('admin_password');
  return !!config;
}

// GET /auth/login - Show login form
router.get('/login', async (c: Context<AppContext>) => {
  const db = new DatabaseClient(c.env.DB);
  const passwordSet = await isPasswordSet(db);

  if (!passwordSet) {
    return c.redirect('/auth/set-password');
  }

  const error = c.req.query('error') || undefined;
  return c.html(renderPage(LoginPage({ error })));
});

// POST /auth/login - Process login
router.post('/login', async (c: Context<AppContext>) => {
  const db = new DatabaseClient(c.env.DB);
  const passwordSet = await isPasswordSet(db);

  if (!passwordSet) {
    return c.redirect('/auth/set-password');
  }

  const body = await getFormData(c);
  const password = body.password || '';

  if (!password) {
    return c.html(renderPage(LoginPage({ error: 'Password is required' })));
  }

  try {
    const storedHash = await db.getConfig('admin_password');

    if (!storedHash) {
      return c.html(renderPage(LoginPage({ error: 'Admin password not configured' })));
    }

    const passwordValid = await compare(password, storedHash);

    if (!passwordValid) {
      return c.html(renderPage(LoginPage({ error: 'Invalid password' })));
    }

    // Password is correct, create session
    await createSession(c, true);
    return c.redirect('/');
  } catch (err) {
    console.error('Login error:', err);
    return c.html(LoginPage({ error: 'An error occurred during login' }));
  }
});

// GET /auth/set-password - Show password setup form
router.get('/set-password', async (c: Context<AppContext>) => {
  const db = new DatabaseClient(c.env.DB);
  const passwordSet = await isPasswordSet(db);

  if (passwordSet) {
    return c.redirect('/auth/login');
  }

  const error = c.req.query('error') || undefined;
  return c.html(SetPasswordPage({ error }));
});

// POST /auth/set-password - Create initial admin password
router.post('/set-password', async (c: Context<AppContext>) => {
  const db = new DatabaseClient(c.env.DB);
  const passwordSet = await isPasswordSet(db);

  if (passwordSet) {
    return c.redirect('/auth/login');
  }

  const body = await getFormData(c);
  const password = body.password || '';
  const confirm = body.confirm || '';

  // Validation
  if (!password) {
    return c.html(SetPasswordPage({ error: 'Password is required' }));
  }

  if (password.length < 8) {
    return c.html(SetPasswordPage({ error: 'Password must be at least 8 characters' }));
  }

  if (password !== confirm) {
    return c.html(SetPasswordPage({ error: 'Passwords do not match' }));
  }

  try {
    // Hash password with bcryptjs
    const passwordHash = await hash(password, 10);

    // Store in config table
    await db.setConfig('admin_password', passwordHash);

    // Create session
    await createSession(c, true);

    // Redirect to dashboard
    return c.redirect('/');
  } catch (err) {
    console.error('Password setup error:', err);
    return c.html(SetPasswordPage({ error: 'An error occurred during password setup' }));
  }
});

// GET /auth/logout - Logout
router.get('/logout', async (c: Context<AppContext>) => {
  destroySession(c);
  return c.redirect('/auth/login');
});

export default router;
