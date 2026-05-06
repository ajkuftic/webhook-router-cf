import { createElement, Fragment } from 'hono/jsx';

const CSS = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    background-color: #f5f5f5;
    color: #333;
    line-height: 1.6;
  }

  header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 1.5rem 2rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }

  header h1 {
    font-size: 1.8rem;
    font-weight: 600;
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }

  nav {
    background: #fff;
    padding: 1rem 0;
    margin-bottom: 2rem;
    border-bottom: 1px solid #eee;
  }

  nav ul {
    list-style: none;
    display: flex;
    gap: 2rem;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
  }

  nav a {
    text-decoration: none;
    color: #667eea;
    font-weight: 500;
    padding: 0.5rem 0;
    border-bottom: 2px solid transparent;
    transition: all 0.2s;
  }

  nav a:hover, nav a.active {
    color: #764ba2;
    border-bottom-color: #764ba2;
  }

  .card {
    background: white;
    border-radius: 8px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }

  .card h2 {
    font-size: 1.3rem;
    margin-bottom: 1rem;
    color: #333;
  }

  .card h3 {
    font-size: 1.1rem;
    margin-bottom: 1rem;
    color: #333;
  }

  .stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .stat {
    background: white;
    padding: 1.5rem;
    border-radius: 8px;
    text-align: center;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }

  .stat-value {
    font-size: 2.5rem;
    font-weight: bold;
    color: #667eea;
    margin: 0.5rem 0;
  }

  .stat-label {
    color: #666;
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    background: white;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }

  thead {
    background: #f8f9fa;
    border-bottom: 2px solid #eee;
  }

  th {
    padding: 1rem;
    text-align: left;
    font-weight: 600;
    color: #333;
  }

  td {
    padding: 1rem;
    border-bottom: 1px solid #eee;
  }

  tr:hover {
    background: #f8f9fa;
  }

  .badge {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.85rem;
    font-weight: 500;
  }

  .badge-slack { background: #36c5f0; color: white; }
  .badge-discord { background: #7289da; color: white; }
  .badge-telegram { background: #0088cc; color: white; }
  .badge-google_chat { background: #ea4335; color: white; }
  .badge-custom_api { background: #f39c12; color: white; }
  .badge-sent { background: #27ae60; color: white; }
  .badge-failed { background: #e74c3c; color: white; }
  .badge-no_match { background: #95a5a6; color: white; }

  form {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    max-width: 600px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }

  .form-group {
    margin-bottom: 1.5rem;
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #333;
  }

  input, textarea, select {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
    font-family: inherit;
    transition: border-color 0.2s;
  }

  input:focus, textarea:focus, select:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }

  textarea {
    resize: vertical;
    min-height: 120px;
  }

  button {
    background: #667eea;
    color: white;
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;
  }

  button:hover {
    background: #764ba2;
  }

  button.secondary {
    background: #666;
    margin-left: 0.5rem;
  }

  button.secondary:hover {
    background: #555;
  }

  button.danger {
    background: #e74c3c;
  }

  button.danger:hover {
    background: #c0392b;
  }

  .btn-group {
    display: flex;
    gap: 0.5rem;
  }

  .error {
    color: #e74c3c;
    padding: 1rem;
    background: #fadbd8;
    border-left: 4px solid #e74c3c;
    border-radius: 4px;
    margin-bottom: 1rem;
  }

  .success {
    color: #27ae60;
    padding: 1rem;
    background: #d5f4e6;
    border-left: 4px solid #27ae60;
    border-radius: 4px;
    margin-bottom: 1rem;
  }

  .info {
    color: #2980b9;
    padding: 1rem;
    background: #d6eaf8;
    border-left: 4px solid #2980b9;
    border-radius: 4px;
    margin-bottom: 1rem;
  }

  .actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .action-link {
    display: inline-block;
    padding: 0.5rem 1rem;
    background: #f0f0f0;
    border-radius: 4px;
    text-decoration: none;
    color: #667eea;
    font-size: 0.9rem;
    transition: background 0.2s;
  }

  .action-link:hover {
    background: #e0e0e0;
  }

  .action-link.danger {
    color: #e74c3c;
  }

  code {
    background: #f5f5f5;
    padding: 0.25rem 0.5rem;
    border-radius: 3px;
    font-family: monospace;
  }

  footer {
    text-align: center;
    padding: 2rem;
    color: #666;
    font-size: 0.9rem;
    margin-top: 3rem;
    border-top: 1px solid #eee;
  }

  .mb-1 { margin-bottom: 1rem; }
  .mb-2 { margin-bottom: 2rem; }
  .mt-1 { margin-top: 1rem; }
  .mt-2 { margin-top: 2rem; }

  .text-center { text-align: center; }
  .text-muted { color: #666; }
  small { color: #999; display: block; margin-top: 0.5rem; }
`;

interface LayoutProps {
  title: string;
  children?: any;
  nav?: string;
  error?: string;
  success?: string;
}

export function Layout(props: LayoutProps) {
  const { title, children, nav, error, success } = props;
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
        <style>{CSS}</style>
      </head>
      <body>
        <header>
          <h1>Webhook Router</h1>
        </header>

        {nav && (
          <nav>
            <ul>
              <li><a href="/" class={nav === 'dashboard' ? 'active' : ''}>Dashboard</a></li>
              <li><a href="/accounts" class={nav === 'accounts' ? 'active' : ''}>Accounts</a></li>
              <li><a href="/rules" class={nav === 'rules' ? 'active' : ''}>Rules</a></li>
              <li style="margin-left: auto;"><a href="/auth/logout">Logout</a></li>
            </ul>
          </nav>
        )}

        <div class="container">
          {error && <div class="error">{error}</div>}
          {success && <div class="success">{success}</div>}
          {children}
        </div>

        <footer>
          <p>Webhook Router © 2026 - Serverless webhook routing</p>
        </footer>
      </body>
    </html>
  );
}
