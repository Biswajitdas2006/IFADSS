import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getInvoice } from '../services/invoiceService';
import AppLayout from '../components/layout/AppLayout';
import { theme } from '../styles/theme';

const STATUS_STYLES = {
  Processed: { bg: '#E5F5EF', text: theme.colors.success },
  Pending: { bg: '#FEF3E2', text: theme.colors.warning },
  Failed: { bg: '#FDECEC', text: theme.colors.error },
};

function InvoiceDetailPage() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const result = await getInvoice(id);
        if (!cancelled) setInvoice(result);
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.error?.message || 'Could not load invoice.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    // Poll every 3s while still Pending, per Document 1 Section 9's documented flow
    const interval = setInterval(() => {
      if (invoice?.status === 'Pending') load();
    }, 3000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [id, invoice?.status]);

  if (loading) {
    return (
      <AppLayout>
        <p style={styles.loadingText}>Loading invoice…</p>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div style={styles.errorBox}>{error}</div>
        <Link to="/invoices" style={styles.backLink}>← Back to Invoices</Link>
      </AppLayout>
    );
  }

  const statusStyle = STATUS_STYLES[invoice.status] || {};

  return (
    <AppLayout>
      <Link to="/invoices" style={styles.backLink}>← Back to Invoices</Link>

      <div style={styles.headerRow}>
        <h1 style={styles.heading}>{invoice.vendorName ?? 'Processing invoice…'}</h1>
        <span style={{ ...styles.badge, backgroundColor: statusStyle.bg, color: statusStyle.text }}>
          {invoice.status}
        </span>
      </div>

      {invoice.status === 'Failed' && (
      <div style={styles.failedBox}>
        <strong>Processing failed.</strong> {invoice.failureReason || 'The AI service could not process this invoice.'}
      </div>
      )}

      <div style={styles.grid}>
        <InfoCard label="Vendor" value={invoice.vendorName ?? '—'} />
        <InfoCard label="Invoice Date" value={invoice.invoiceDate ?? '—'} />
        <InfoCard label="Total Amount" value={invoice.totalAmount != null ? `$${invoice.totalAmount.toFixed(2)}` : '—'} mono />
      </div>

      <h2 style={styles.subheading}>Line Items</h2>
      <div style={styles.tableCard}>
        {invoice.transactions.length === 0 ? (
          <div style={styles.emptyCell}>
            {invoice.status === 'Processed'
              ? 'No line items were extracted from this invoice.'
              : 'Line items will appear here once processing completes.'}
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Description</th>
                <th style={styles.th}>Category</th>
                <th style={styles.thRight}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.transactions.map((t) => (
                <tr key={t.id} style={styles.row}>
                  <td style={styles.td}>{t.description}</td>
                  <td style={styles.td}>
                    {t.category ? (
                      <span style={styles.categoryBadge}>{t.category}</span>
                    ) : (
                      <span style={styles.uncategorized}>Uncategorized</span>
                    )}
                  </td>
                  <td style={styles.tdRight}>${t.amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AppLayout>
  );
}

function InfoCard({ label, value, mono }) {
  return (
    <div style={styles.infoCard}>
      <div style={styles.infoLabel}>{label}</div>
      <div style={{ ...styles.infoValue, fontFamily: mono ? theme.fonts.mono : theme.fonts.body }}>
        {value}
      </div>
    </div>
  );
}

const styles = {
  loadingText: { color: theme.colors.textMuted, fontFamily: theme.fonts.body },
  backLink: {
    display: 'inline-block', marginBottom: '16px', color: theme.colors.primaryEmerald,
    textDecoration: 'none', fontSize: '13px', fontWeight: 600,
  },
  headerRow: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' },
  heading: { color: theme.colors.inkBase, fontFamily: theme.fonts.display, fontSize: '22px', margin: 0 },
  badge: { padding: '4px 12px', borderRadius: theme.radius.sm, fontSize: '12px', fontWeight: 600 },
  pendingBox: {
    backgroundColor: '#FEF3E2', color: '#92660B', padding: '12px 16px',
    borderRadius: theme.radius.sm, fontSize: '13px', marginBottom: '20px',
  },
  errorBox: {
    backgroundColor: '#FDECEC', color: theme.colors.error, padding: '12px 16px',
    borderRadius: theme.radius.sm, fontSize: '13px', marginBottom: '16px',
  },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' },
  infoCard: {
    backgroundColor: theme.colors.white, border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.md, padding: '16px',
  },
  infoLabel: { fontSize: '12px', color: theme.colors.textMuted, marginBottom: '6px' },
  infoValue: { fontSize: '16px', color: theme.colors.inkBase, fontWeight: 600 },
  subheading: { color: theme.colors.inkBase, fontFamily: theme.fonts.display, fontSize: '16px', marginBottom: '12px' },
  tableCard: {
    backgroundColor: theme.colors.white, border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.md, overflow: 'hidden',
  },
  table: { width: '100%', borderCollapse: 'collapse', fontFamily: theme.fonts.body },
  th: { textAlign: 'left', padding: '12px 20px', fontSize: '11px', color: theme.colors.textMuted, borderBottom: `1px solid ${theme.colors.border}` },
  thRight: { textAlign: 'right', padding: '12px 20px', fontSize: '11px', color: theme.colors.textMuted, borderBottom: `1px solid ${theme.colors.border}` },
  row: { borderBottom: `1px solid ${theme.colors.border}` },
  td: { padding: '14px 20px', fontSize: '14px', color: theme.colors.inkBase },
  tdRight: { padding: '14px 20px', fontSize: '14px', color: theme.colors.inkBase, textAlign: 'right', fontFamily: theme.fonts.mono },
  categoryBadge: {
    backgroundColor: theme.colors.surfaceWash, color: theme.colors.primaryEmerald,
    padding: '3px 10px', borderRadius: theme.radius.sm, fontSize: '12px', fontWeight: 600,
  },
  uncategorized: { fontSize: '13px', color: theme.colors.textMuted, fontStyle: 'italic' },
  emptyCell: { padding: '40px', textAlign: 'center', color: theme.colors.textMuted, fontSize: '14px' },
  failedBox: {
  backgroundColor: '#FDECEC', color: theme.colors.error, padding: '12px 16px',
  borderRadius: theme.radius.sm, fontSize: '13px', marginBottom: '20px',
  },
};

export default InvoiceDetailPage;