import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import {
  CATEGORY_OPTIONS,
  getTransactions,
  updateTransactionCategory,
} from '../services/transactionService';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';

const PAGE_SIZE = 20;

function getConfidenceClass(confidence) {
  if (confidence >= 0.85) return 'high';
  if (confidence >= 0.6) return 'medium';
  return 'low';
}

function CategoryCell({ transaction, onUpdated }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async (category) => {
    if (!category || category === transaction.category) {
      setEditing(false);
      return;
    }

    setSaving(true);
    setError('');

    try {
      const updated = await updateTransactionCategory(transaction.id, category);
      onUpdated(updated);
      setEditing(false);
    } catch (requestError) {
      setError(
        requestError.response?.data?.error?.message || 'Could not update this category.',
      );
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <div>
        <select
          className="inline-select"
          aria-label={`Set category for ${transaction.description || 'transaction'}`}
          value={transaction.category ?? ''}
          disabled={saving}
          onChange={(event) => handleSave(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') setEditing(false);
          }}
          autoFocus
        >
          <option value="" disabled>Select category</option>
          {CATEGORY_OPTIONS.map((category) => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
        {error && <p className="category-edit-error" role="alert">{error}</p>}
        <button className="category-cancel" type="button" onClick={() => setEditing(false)} disabled={saving}>
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      className="category-edit-button"
      type="button"
      aria-label={`Change category for ${transaction.description || 'transaction'}`}
      onClick={() => setEditing(true)}
    >
      {transaction.category ? (
        <span className="category-pill">
          {transaction.category}
          {transaction.overriddenByUser && <small> · edited</small>}
        </span>
      ) : (
        <span className="category-unset">Set category</span>
      )}
    </button>
  );
}

function TransactionsPage() {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function fetchTransactions() {
      try {
        const result = await getTransactions({ page, pageSize: PAGE_SIZE });
        if (!cancelled) {
          setData(result);
          setError('');
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError.response?.data?.error?.message || 'Could not load transactions.',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchTransactions();
    return () => {
      cancelled = true;
    };
  }, [page, reloadKey]);

  const refresh = () => {
    setLoading(true);
    setError('');
    setReloadKey((current) => current + 1);
  };

  const from = data ? (data.page - 1) * data.pageSize + 1 : 0;
  const to = data ? Math.min(data.page * data.pageSize, data.totalItems) : 0;

  const updateTransaction = (updated) => {
    setData((current) => {
      if (!current) return current;
      return {
        ...current,
        items: current.items.map((item) => item.id === updated.id
          ? {
              ...item,
              category: updated.category,
              categoryConfidence: updated.categoryConfidence,
              overriddenByUser: updated.overriddenByUser,
            }
          : item),
      };
    });
  };

  return (
    <AppLayout>
      <header className="page-header">
        <div>
          <h1>Transactions</h1>
          <p>Review invoice-derived transactions, category suggestions, and model confidence.</p>
        </div>
        <div className="page-header-actions">
          <button className="button-secondary" type="button" onClick={refresh} disabled={loading}>
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </header>

      {error && (
        <div className="page-error" role="alert">
          <span>{error}</span>
          <button className="button-secondary" type="button" onClick={refresh} disabled={loading}>
            Try again
          </button>
        </div>
      )}

      <section className="surface-card" aria-label="Transaction list">
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Description</th>
                <th scope="col">Category</th>
                <th scope="col">Model confidence</th>
                <th scope="col" className="cell-numeric">Amount</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={5} role="status">Loading transactions…</td></tr>}
              {!loading && !error && data?.items?.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-state">
                      <h2>No transactions yet</h2>
                      <p>Transactions appear here after an invoice has been uploaded and processed.</p>
                      <Link className="button" to="/invoices">Go to invoices</Link>
                    </div>
                  </td>
                </tr>
              )}
              {!loading && !error && data?.items?.map((transaction) => {
                const confidence = transaction.categoryConfidence;
                const confidencePercent = confidence == null
                  ? null
                  : Math.min(100, Math.max(0, Math.round(Number(confidence) * 100)));

                return (
                  <tr key={transaction.id}>
                    <td>{formatDate(transaction.transactionDate)}</td>
                    <td className="cell-primary">{transaction.description || '—'}</td>
                    <td>
                      <CategoryCell transaction={transaction} onUpdated={updateTransaction} />
                    </td>
                    <td>
                      {confidencePercent == null ? (
                        <span className="text-muted">Not available</span>
                      ) : (
                        <span className={`confidence-pill confidence-pill--${getConfidenceClass(Number(confidence))}`}>
                          {confidencePercent}%
                        </span>
                      )}
                    </td>
                    <td className="cell-numeric">
                      {formatCurrency(transaction.amount, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {data && !error && (
          <div className="table-footer">
            <span>
              Showing {data.totalItems === 0 ? 0 : from}–{to} of {data.totalItems} transactions
            </span>
            <div className="pager-actions">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => {
                  setLoading(true);
                  setPage((current) => current - 1);
                }}
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= data.totalPages || loading}
                onClick={() => {
                  setLoading(true);
                  setPage((current) => current + 1);
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>
    </AppLayout>
  );
}

export default TransactionsPage;
