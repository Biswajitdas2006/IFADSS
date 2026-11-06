import {
  FiActivity,
  FiAlertTriangle,
  FiArrowUpRight,
  FiCheckCircle,
  FiDollarSign,
  FiInfo,
  FiPieChart,
  FiTrendingUp,
} from 'react-icons/fi';
import { formatCurrency } from '../../utils/formatCurrency';

export default function KpiSection() {
  // Preserved exact KPI definitions & baseline calculations matching the IFAADS engine
  const kpiCards = [
    {
      label: 'Total income',
      value: formatCurrency(148200),
      rawNum: 148200,
      badge: '+12.4% vs 30d baseline',
      badgeClass: 'badge-pos',
      formula: 'Sum of all verified credit transactions & customer invoice payments',
      status: 'Live accounting sync',
    },
    {
      label: 'Total expense',
      value: formatCurrency(92400),
      rawNum: 92400,
      badge: '-3.2% vs 30d baseline',
      badgeClass: 'badge-pos',
      formula: 'Sum of all processed vendor invoices & verified debit outflows',
      status: 'Multi-pass OCR verified',
    },
    {
      label: 'Net cash flow',
      value: formatCurrency(55800),
      rawNum: 55800,
      badge: 'Operating surplus',
      badgeClass: 'badge-pos',
      formula: 'Total Income minus Total Expense across selected period',
      status: 'Healthy liquidity band',
    },
    {
      label: 'Open anomalies',
      value: '2 items',
      rawNum: 2,
      badge: 'Pending sign-off',
      badgeClass: 'badge-warn',
      formula: 'Transactions triggering statistical deviation > 80% threshold',
      status: 'Human review required',
    },
  ];

  const topCategories = [
    { name: 'Cloud Infrastructure & SaaS', amount: 34200, percentage: 37 },
    { name: 'Logistics & Freight Services', amount: 28500, percentage: 31 },
    { name: 'Professional & Legal Advisory', amount: 18400, percentage: 20 },
    { name: 'Facilities & Commercial Utilities', amount: 11300, percentage: 12 },
  ];

  return (
    <section className="landing-section kpi-section" id="metrics">
      <div className="landing-container">
        {/* Section Header */}
        <div className="landing-section-heading">
          <p className="landing-eyebrow">Financial Insights & Operational KPIs</p>
          <h2>Rigorous accounting precision in real time.</h2>
          <p>
            Every key performance indicator in IFAADS preserves strict GAAP double-entry principles and verifiable calculation integrity.
          </p>
        </div>

        {/* Primary KPI 4-Card Grid */}
        <div className="kpi-cards-grid" aria-label="Key Performance Indicators">
          {kpiCards.map((card) => (
            <article className="kpi-metric-card" key={card.label}>
              <div className="kpi-card-header">
                <span className="kpi-metric-label">{card.label}</span>
                <span className={`kpi-chip ${card.badgeClass}`}>{card.badge}</span>
              </div>

              <strong className="kpi-metric-val">{card.value}</strong>

              <div className="kpi-formula-box">
                <FiInfo className="formula-icon" aria-hidden="true" />
                <span className="kpi-formula-text">{card.formula}</span>
              </div>

              <div className="kpi-card-footer">
                <span className="kpi-status-dot" aria-hidden="true" />
                <span>{card.status}</span>
              </div>
            </article>
          ))}
        </div>

        {/* Category Breakdown & Forecast Insight Split */}
        <div className="kpi-secondary-grid">
          {/* Top Spending Distribution */}
          <div className="kpi-subpanel">
            <div className="subpanel-header">
              <div>
                <span className="subpanel-eyebrow">DISBURSEMENT ANALYSIS</span>
                <h4>Top Spending Categories</h4>
              </div>
              <span className="subpanel-tag">30-day window</span>
            </div>

            <div className="category-progress-list">
              {topCategories.map((cat) => (
                <div key={cat.name} className="cat-progress-row">
                  <div className="cat-row-label">
                    <span className="cat-name">{cat.name}</span>
                    <strong className="cat-val">{formatCurrency(cat.amount)}</strong>
                  </div>
                  <div className="cat-track">
                    <div
                      className="cat-fill"
                      style={{ width: `${cat.percentage}%` }}
                      aria-label={`${cat.percentage}% of total expenses`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Forecasting Logic & Transparency Disclosure */}
          <div className="kpi-subpanel forecast-insight-panel">
            <div className="subpanel-header">
              <div>
                <span className="subpanel-eyebrow">PREDICTIVE MODELING</span>
                <h4>Cash-Flow Forecasting Principles</h4>
              </div>
              <span className="subpanel-tag">Horizon: 7–90 Days</span>
            </div>

            <div className="forecast-principles-list">
              <div className="principle-item">
                <FiTrendingUp className="principle-icon" aria-hidden="true" />
                <div>
                  <strong>Empirical Velocity Calculation</strong>
                  <p>Inflow and outflow trajectories are computed from verified past transactions, factoring in invoice payment cycles and scheduled recurring debits.</p>
                </div>
              </div>

              <div className="principle-item">
                <FiAlertTriangle className="principle-icon" aria-hidden="true" />
                <div>
                  <strong>Statistical Confidence Bands</strong>
                  <p>Projections include a ±3.8% confidence interval to communicate estimation variance realistically. Estimates are clearly marked as projections, not guarantees.</p>
                </div>
              </div>

              <div className="principle-item">
                <FiCheckCircle className="principle-icon" aria-hidden="true" />
                <div>
                  <strong>Role-Based Sensitivity Controls</strong>
                  <p>Accountants and Owners can adjust scenario parameters to test optimistic, baseline, and conservative liquidity scenarios.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Disclaimers & Calculation Source Disclosure */}
        <p className="kpi-compliance-note">
          Figures above represent active illustrative accounts. When signed in, all calculations dynamically populate from your team’s reconciled bank feeds and approved invoice entries.
        </p>
      </div>
    </section>
  );
}

