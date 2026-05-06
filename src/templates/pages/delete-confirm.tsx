import { createElement, Fragment } from 'hono/jsx';
import { Layout } from '../layout';

export type DeleteItemType = 'account' | 'rule';

interface DeleteConfirmPageProps {
  itemType: DeleteItemType;
  itemId: string;
  itemName: string;
  nav?: string;
  warning?: string;
}

export function DeleteConfirmPage(props: DeleteConfirmPageProps) {
  const { itemType, itemId, itemName, nav = 'accounts', warning } = props;
  const deleteUrl = itemType === 'account' ? `/accounts/${itemId}/delete` : `/rules/${itemId}/delete`;
  const backUrl = itemType === 'account' ? '/accounts' : '/rules';
  const typeLabel = itemType === 'account' ? 'Account' : 'Rule';

  return (
    <Layout title={`Delete ${typeLabel} - Webhook Router`} nav={nav as any}>
      <div style="max-width: 500px; margin: 4rem auto;">
        <div class="card" style="border-left: 4px solid #e74c3c;">
          <h2 style="color: #e74c3c;">Delete {typeLabel}</h2>

          <div class="error" style="margin: 1.5rem 0;">
            <strong>Are you sure?</strong> This action cannot be undone.
          </div>

          <p style="margin-bottom: 1rem;">
            You are about to delete the {typeLabel.toLowerCase()} <strong>"{itemName}"</strong>.
          </p>

          {warning && (
            <div class="info">
              {warning}
            </div>
          )}

          <form method="POST" action={deleteUrl} style="margin-top: 2rem;">
            <div style="display: flex; gap: 1rem;">
              <button type="submit" class="danger">Yes, Delete</button>
              <a href={backUrl} class="action-link secondary">Cancel</a>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
