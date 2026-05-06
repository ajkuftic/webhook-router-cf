import { createElement, Fragment } from 'hono/jsx';
import { Layout } from '../layout';

interface LoginPageProps {
  error?: string;
}

export function LoginPage(props: LoginPageProps) {
  const { error } = props;
  return (
    <Layout title="Login - Webhook Router" error={error}>
      <div style="max-width: 400px; margin: 4rem auto;">
        <div class="card">
          <h2>Admin Login</h2>
          <form method="POST" action="/auth/login">
            <div class="form-group">
              <label for="password">Admin Password</label>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="Enter admin password"
                required
              />
            </div>
            <div class="form-group">
              <button type="submit">Login</button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}

interface SetPasswordPageProps {
  error?: string;
}

export function SetPasswordPage(props: SetPasswordPageProps) {
  const { error } = props;
  return (
    <Layout title="Setup Password - Webhook Router" error={error}>
      <div style="max-width: 400px; margin: 4rem auto;">
        <div class="card">
          <h2>Setup Admin Password</h2>
          <p style="color: #666; margin-bottom: 1.5rem;">
            Welcome! Create a password to secure your webhook router dashboard.
          </p>
          <form method="POST" action="/auth/set-password">
            <div class="form-group">
              <label for="password">Admin Password</label>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="Create a strong password"
                required
                minlength="8"
              />
              <small>Minimum 8 characters</small>
            </div>
            <div class="form-group">
              <label for="confirm">Confirm Password</label>
              <input
                type="password"
                id="confirm"
                name="confirm"
                placeholder="Confirm password"
                required
              />
            </div>
            <div class="form-group">
              <button type="submit">Setup Password</button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
