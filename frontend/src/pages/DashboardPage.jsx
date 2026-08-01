import { useAuth } from '../context/AuthContext';
import AppLayout from '../components/layout/AppLayout';
import { theme } from '../styles/theme';

function DashboardPage() {
  const { user } = useAuth();

  return (
    <AppLayout>
      <h1 style={styles.heading}>Welcome back, {user?.email}</h1>
      <p style={styles.subheading}>Here's what's happening with your business.</p>

      <div style={styles.kpiGrid}>
        <KpiCard label="Total Income" value="—" />
        <KpiCard label="Total Expenses" value="—" />
        <KpiCard label="Net Cash Flow" value="—" />
        <KpiCard label="Pending Anomalies" value="—" />
      </div>

      <div style={styles.placeholderBox}>
        Cash flow chart, category breakdown, and recent activity widgets
        will be built in Week 9 once Invoices, Transactions, and Predictions are wired up.
      </div>
    </AppLayout>
  );
}

function KpiCard({ label, value }) {
  return (
    <div style={styles.kpiCard}>
      <div style={styles.kpiLabel}>{label}</div>
      <div style={styles.kpiValue}>{value}</div>
    </div>
  );
}

const styles = {
  heading: { color: theme.colors.inkBase, fontFamily: theme.fonts.display, fontSize: '24px', marginBottom: '4px' },
  subheading: { color: theme.colors.textMuted, fontFamily: theme.fonts.body, fontSize: '14px', marginBottom: '24px' },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' },
  kpiCard: {
    backgroundColor: theme.colors.white,
    padding: '20px',
    borderRadius: theme.radius.md,
    boxShadow: theme.shadow.level1,
    border: `1px solid ${theme.colors.border}`,
  },
  kpiLabel: { color: theme.colors.textMuted, fontFamily: theme.fonts.body, fontSize: '13px', marginBottom: '8px' },
  kpiValue: { color: theme.colors.inkBase, fontFamily: theme.fonts.mono, fontSize: '24px', fontWeight: 'bold' },
  placeholderBox: {
    backgroundColor: theme.colors.white,
    border: `1px solid ${theme.colors.border}`,
    padding: '24px',
    borderRadius: theme.radius.md,
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: '13px',
    textAlign: 'center',
  },
};

export default DashboardPage;