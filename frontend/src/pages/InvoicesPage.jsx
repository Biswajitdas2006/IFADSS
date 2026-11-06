import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import UploadInvoiceModal from '../components/invoice/UploadInvoiceModal';
import { getInvoices } from '../services/invoiceService';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';

const PAGE_SIZE = 20;

function getStatusClass(status) {
  if (status === 'Processed') return 'status-pill--success';
  if (status === 'Pending') return 'status-pill--warning';
  if (status === 'Failed') return 'status-pill--danger';
  return '';
}

function InvoicesPage() {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function fetchInvoices() {
      try {
        const result = await getInvoices(undefined, page, PAGE_SIZE);
        if (!cancelled) {
          setData(result);
          setError('');
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError.response?.data?.error?.message || 'Could not load invoices.',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchInvoices();
    return () => {
      cancelled = true;
    };
  }, [page, reloadKey]);

  const refresh = () => {
    setLoading(true);
    setError('');
    setReloadKey((current) => current + 1);
  };

  const handleUploaded = () => {
    setShowModal(false);
    if (page === 1) {
      refresh();
    } else {
      setLoading(true);
      setError('');
      setPage(1);
    }
  };

  const from = data ? (data.page - 1) * data.pageSize + 1 : 0;
  const to = data ? Math.min(data.page * data.pageSize, data.totalItems) : 0;

  return (
    <AppLayout>
      <header className="page-header">
        <div>
          <h1>Invoices</h1>
          <p>Upload invoices and follow their extraction status and transaction details.</p>
        </div>
        <div className="page-header-actions">
          <button
            className="button-secondary"
            type="button"
            onClick={refresh}
            disabled={loading}
          >
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
          <button className="button" type="button" onClick={() => setShowModal(true)}>
            Upload invoice
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

      <section className="surface-card" aria-label="Invoice list">
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Vendor</th>
                <th scope="col">Uploaded</th>
                <th scope="col" className="cell-numeric">Amount</th>
                <th scope="col">Status</th>
                <th scope="col" className="cell-numeric">Details</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={5} role="status">Loading invoices…</td></tr>
              )}
              {!loading && !error && data?.items?.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-state">
                      <h2>No invoices yet</h2>
                      <p>Upload a PDF, JPG, or PNG invoice to start extracting invoice details.</p>
                      <button className="button" type="button" onClick={() => setShowModal(true)}>
                        Upload invoice
                      </button>
                    </div>
                  </td>
                </tr>
              )}
              {!loading && !error && data?.items?.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="cell-primary">{invoice.vendorName || 'Processing invoice'}</td>
                  <td>{formatDate(invoice.uploadedAt)}</td>
                  <td className="cell-numeric">
                    {invoice.totalAmount == null
                      ? '—'
                      : formatCurrency(invoice.totalAmount, { minimumFractionDigits: 2 })}
                  </td>
                  <td>
                    <span className={`status-pill ${getStatusClass(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="cell-numeric">
                    <Link className="table-action" to={`/invoices/${invoice.id}`}>
                      {invoice.status === 'Failed' ? 'Review' : 'View'}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data && !error && (
          <div className="table-footer">
            <span>
              Showing {data.totalItems === 0 ? 0 : from}–{to} of {data.totalItems} invoices
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

      {showModal && (
        <UploadInvoiceModal
          onClose={() => setShowModal(false)}
          onUploaded={handleUploaded}
        />
      )}
    </AppLayout>
  );
}

export default InvoicesPage;
