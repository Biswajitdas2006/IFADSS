import { theme } from '../../styles/theme';
import { formatCurrency } from '../../utils/formatCurrency';

export default function SummarySection({ data, loading, error }) {
  if (error) return <p className="dashboard-message dashboard-error">{error}</p>;

  const cards = [
    {
      label: 'Total income',
      value: loading ? 'Loading…' : formatCurrency(data?.totalIncome),
      color: theme.colors.success,
    },
    {
      label: 'Total expense',
      value: loading ? 'Loading…' : formatCurrency(data?.totalExpense),
      color: theme.colors.error,
    },
    {
      label: 'Net cash flow',
      value: loading ? 'Loading…' : formatCurrency(data?.netCashFlow),
      color: (data?.netCashFlow ?? 0) >= 0 ? theme.colors.success : theme.colors.error,
    },
  ];

  if (data?.openAnomalies !== null && data?.openAnomalies !== undefined) {
    cards.push({
      label: 'Open anomalies',
      value: data.openAnomalies,
      color: data.openAnomalies > 0 ? theme.colors.warning : theme.colors.inkBase,
    });
  }

  return (
    <section className="dashboard-kpis" aria-label="Financial summary">
      {cards.map((card) => (
        <article className="dashboard-card dashboard-kpi" key={card.label}>
          <span className="dashboard-kpi-label">{card.label}</span>
          <strong className="dashboard-kpi-value" style={{ color: card.color }}>
            {card.value}
          </strong>
        </article>
      ))}
    </section>
  );
}
