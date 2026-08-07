import { useState, useEffect, useCallback } from 'react';
import { getInvoices } from '../services/invoiceService';
import AppLayout from '../components/layout/AppLayout';
import UploadInvoiceModal from '../components/invoice/UploadInvoiceModal';
import { theme } from '../styles/theme';
import { Link } from 'react-router-dom';
const STATUS_STYLES = {
  Processed: { bg: '#E5F5EF', text: theme.colors.success },
  Pending: { bg: '#FEF3E2', text: theme.colors.warning },
  Failed: { bg: '#FDECEC', text: theme.colors.error },
};

function InvoicesPage() {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const pageSize = 20;

  const load = useCallback(async () => {
    setLoading(true);
    const result = await getInvoices(undefined, page, pageSize);
    setData(result);
    setLoading(false);
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const handleUploaded = () => {
    setPage(1);
    load();
  };

  const from = data ? (data.page - 1) * data.pageSize + 1 : 0;
  const to = data ? Math.min(data.page * data.pageSize, data.totalItems) : 0;

  return (
    <AppLayout>
      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.heading}>Invoices</h1>
          <p style={styles.subheading}>Manage and process vendor invoices with AI extraction.</p>
        </div>
        <button style={styles.uploadButton} onClick={() => setShowModal(true)}>
          Upload Invoice
        </button>
      </div>

      <div style={styles.tableCard}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Vendor</th>
              <th style={styles.th}>Uploaded</th>
              <th style={styles.thRight}>Amount</th>
              <th style={styles.th}>Status</th>
              <th style={styles.thRight}>Action</th>
            </tr>
          </thead>
          <tbody>
            {!loading && data?.items.length === 0 && (
              <tr><td colSpan={5} style={styles.emptyCell}>
                No invoices yet — upload your first one to get started.
              </td></tr>
            )}
            {data?.items.map((inv) => (
              <tr key={inv.id} style={styles.row}>
                <td style={styles.td}>
                  <div style={styles.vendorName}>{inv.vendorName ?? 'Processing…'}</div>
                </td>
                <td style={styles.td}>{new Date(inv.uploadedAt).toLocaleDateString()}</td>
                <td style={styles.tdRight}>
                  {inv.totalAmount != null ? `$${inv.totalAmount.toFixed(2)}` : '—'}
                </td>
                <td style={styles.td}>
                  <span style={{
                    ...styles.badge,
                    backgroundColor: STATUS_STYLES[inv.status]?.bg,
                    color: STATUS_STYLES[inv.status]?.text,
                  }}>
                    {inv.status}
                  </span>
                </td>
                <td style={styles.tdRight}>
                  <Link to={`/invoices/${inv.id}`} style={styles.actionLink}>
                    {inv.status === 'Failed' ? 'Review' : 'View'}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {data && (
          <div style={styles.footer}>
            <span style={styles.footerText}>
              Showing {data.totalItems === 0 ? 0 : from} to {to} of {data.totalItems} invoices
            </span>
            <div style={styles.pagerButtons}>
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                style={styles.pagerButton}
              >
                Prev
              </button>
              <button
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
                style={styles.pagerButton}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <UploadInvoiceModal onClose={() => setShowModal(false)} onUploaded={handleUploaded} />
      )}
    </AppLayout>
  );
}

const styles = {
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' },
  heading: { color: theme.colors.inkBase, fontFamily: theme.fonts.display, fontSize: '24px', margin: 0 },
  subheading: { color: theme.colors.textMuted, fontFamily: theme.fonts.body, fontSize: '14px', marginTop: '4px' },
  uploadButton: {
    padding: '10px 18px', borderRadius: theme.radius.sm, border: 'none',
    backgroundColor: theme.colors.primaryEmerald, color: theme.colors.white,
    fontWeight: 600, fontSize: '14px', cursor: 'pointer',
  },
  tableCard: {
    backgroundColor: theme.colors.white, border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.md, overflow: 'hidden',
  },
  table: { width: '100%', borderCollapse: 'collapse', fontFamily: theme.fonts.body },
  th: { textAlign: 'left', padding: '12px 20px', fontSize: '11px', color: theme.colors.textMuted, borderBottom: `1px solid ${theme.colors.border}` },
  thRight: { textAlign: 'right', padding: '12px 20px', fontSize: '11px', color: theme.colors.textMuted, borderBottom: `1px solid ${theme.colors.border}` },
  row: { borderBottom: `1px solid ${theme.colors.border}` },
  td: { padding: '16px 20px', fontSize: '14px', color: theme.colors.inkBase },
  tdRight: { padding: '16px 20px', fontSize: '14px', color: theme.colors.inkBase, textAlign: 'right', fontFamily: theme.fonts.mono },
  vendorName: { fontWeight: 600 },
  badge: { padding: '4px 10px', borderRadius: theme.radius.sm, fontSize: '12px', fontWeight: 600 },
  actionLink: { color: theme.colors.primaryEmerald, fontWeight: 600, textDecoration: 'none', fontSize: '13px' },
  emptyCell: { padding: '40px', textAlign: 'center', color: theme.colors.textMuted, fontSize: '14px' },
  footer: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 20px', backgroundColor: theme.colors.surfaceWash,
  },
  footerText: { fontSize: '13px', color: theme.colors.textMuted },
  pagerButtons: { display: 'flex', gap: '8px' },
  pagerButton: {
    padding: '6px 14px', borderRadius: theme.radius.sm, border: `1px solid ${theme.colors.border}`,
    backgroundColor: theme.colors.white, cursor: 'pointer', fontSize: '13px', color: theme.colors.inkBase,
  },
};

export default InvoicesPage;