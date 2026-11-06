import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import { useAuth } from '../hooks/useAuth';
import { anomalyService } from '../services/anomalyService';
import { getInvoice } from '../services/invoiceService';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import './invoice-detail.css';

function getStatusClass(status) {
  if (status === 'Processed') return 'status-pill--success';
  if (status === 'Pending') return 'status-pill--warning';
  if (status === 'Failed') return 'status-pill--danger';
  return '';
}

function InvoiceDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const canScan = ['Owner', 'Accountant'].includes(user?.role);
  const [invoiceState, setInvoiceState] = useState({
    id: null,
    invoice: null,
    loading: true,
    error: '',
  });
  const [scanError, setScanError] = useState('');
  const scannedInvoiceId = useRef(null);
  const invoice = invoiceState.id === id ? invoiceState.invoice : null;
  const loading = invoiceState.id !== id || invoiceState.loading;
  const error = invoiceState.id === id ? invoiceState.error : '';

  useEffect(() => {
    let cancelled = false;
    let timer;

    async function load() {
      try {
        const result = await getInvoice(id);
        if (cancelled) return;
        setInvoiceState({
          id,
          invoice: result,
          loading: false,
          error: '',
        });

        if (result.status === 'Pending') {
          timer = setTimeout(load, 3000);
        }
      } catch (requestError) {
        if (!cancelled) {
          setInvoiceState({
            id,
            invoice: null,
            loading: false,
            error: requestError.response?.data?.error?.message || 'Could not load this invoice.',
          });
        }
      }
    }

    load();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [id]);

  useEffect(() => {
    if (
      invoice?.status !== 'Processed' ||
      !canScan ||
      scannedInvoiceId.current === id
    ) return undefined;
    scannedInvoiceId.current = id;
    let cancelled = false;

    anomalyService.scan(90).catch((requestError) => {
      if (!cancelled) {
        setScanError({
          id,
          message: requestError.response?.data?.error?.message ||
            'The anomaly scan could not be completed.',
        });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [invoice?.status, canScan, id]);

  return (
    <AppLayout>
      <div className="invoice-detail">
        <Link className="invoice-back-link" to="/invoices">← Invoices</Link>

        {loading && <p className="invoice-loading" role="status">Loading invoice…</p>}

        {!loading && error && (
          <div className="page-error" role="alert">
            <span>{error}</span>
            <Link className="inline-link" to="/invoices">Return to invoices</Link>
          </div>
        )}

        {!loading && !error && invoice && (
          <>
            <header className="page-header invoice-header">
              <div>
                <h1>{invoice.vendorName || 'Invoice processing'}</h1>
                <p>Invoice details and extracted transaction line items.</p>
              </div>
              <span className={`status-pill ${getStatusClass(invoice.status)}`}>
                {invoice.status}
              </span>
            </header>

            {invoice.status === 'Failed' && (
              <div className="page-error" role="status">
                <span>
                  <strong>Processing failed. </strong>
                  {invoice.failureReason || 'The invoice could not be processed.'}
                </span>
              </div>
            )}

            {scanError?.id === id && (
              <div className="page-notice" role="status">
                <span>{scanError.message} You can run a scan from Anomalies.</span>
                <Link className="inline-link" to="/anomalies">Open anomalies</Link>
              </div>
            )}

            <section className="invoice-facts" aria-label="Invoice information">
              <div className="surface-card invoice-fact">
                <span>Vendor</span>
                <strong>{invoice.vendorName || '—'}</strong>
              </div>
              <div className="surface-card invoice-fact">
                <span>Invoice date</span>
                <strong>{formatDate(invoice.invoiceDate)}</strong>
              </div>
              <div className="surface-card invoice-fact">
                <span>Total amount</span>
                <strong className="invoice-amount">
                  {invoice.totalAmount == null
                    ? '—'
                    : formatCurrency(invoice.totalAmount, { minimumFractionDigits: 2 })}
                </strong>
              </div>
            </section>

            <section className="invoice-line-items">
              <div className="invoice-section-heading">
                <h2>Line items</h2>
                <span>{invoice.transactions?.length ?? 0} items</span>
              </div>
              <div className="surface-card table-scroll">
                {invoice.transactions?.length ? (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th scope="col">Description</th>
                        <th scope="col">Category</th>
                        <th scope="col" className="cell-numeric">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.transactions.map((transaction) => (
                        <tr key={transaction.id}>
                          <td className="cell-primary">{transaction.description || '—'}</td>
                          <td>
                            {transaction.category
                              ? <span className="category-pill">{transaction.category}</span>
                              : <span className="text-muted">Uncategorized</span>}
                          </td>
                          <td className="cell-numeric">
                            {formatCurrency(transaction.amount, { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="empty-state">
                    <h2>{invoice.status === 'Processed' ? 'No line items extracted' : 'Processing invoice'}</h2>
                    <p>
                      {invoice.status === 'Processed'
                        ? 'No transaction line items were returned for this invoice.'
                        : 'Extracted line items will appear here when processing is complete.'}
                    </p>
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </AppLayout>
  );
}

export default InvoiceDetailPage;
