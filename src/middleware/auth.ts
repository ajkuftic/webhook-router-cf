import { Context, Next, HonoRequest } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { DatabaseClient } from '../db';
import { initializeDatabase } from '../db-init';
import { v4 as uuidv4 } from 'uuid';

type Bindings = { DB: D1Database };

export type AppContext = {
  Variables: {
    session?: {
      authenticated: boolean;
      createdAt: string;
    };
    db: DatabaseClient;
  };
  Bindings: Bindings;
};

let dbInitialized = false;

export async function sessionMiddleware(c: Context<AppContext>, next: Next) {
  // Initialize database on first request
  if (!dbInitialized) {
    try {
      await initializeDatabase(c.env.DB);
      dbInitialized = true;
    } catch (err) {
      console.error('Failed to initialize database:', err);
    }
  }

  const db = new DatabaseClient(c.env.DB);
  const sessionId = getCookie(c, 'session_id');

  let session: Record<string, unknown> | null = null;
  if (sessionId) {
    session = await db.getSession(sessionId);
  }

  // Store in context
  if (session && typeof session === 'object' && 'authenticated' in session) {
    c.set('session', {
      authenticated: Boolean(session.authenticated),
      createdAt: String(session.createdAt || '')
    });
  }
  c.set('db', db);

  await next();
}

export async function requireAuth(c: Context<AppContext>, next: Next) {
  const session = c.get('session');

  if (!session?.authenticated) {
    return c.redirect('/auth/login');
  }

  await next();
}

export async function createSession(c: Context<AppContext>, authenticated: boolean = false) {
  const db = new DatabaseClient(c.env.DB);
  const sessionId = uuidv4();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  const sessionData = {
    authenticated,
    createdAt: new Date().toISOString()
  };

  await db.setSession(sessionId, sessionData, expiresAt);

  setCookie(c, 'session_id', sessionId, {
    maxAge: 7 * 24 * 60 * 60, // 7 days
    httpOnly: true,
    secure: true,
    sameSite: 'Lax'
  });

  c.set('session', sessionData);
}

export function destroySession(c: Context<AppContext>) {
  deleteCookie(c, 'session_id');
  c.set('session', {} as any);
}
