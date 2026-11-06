import { useState } from 'react';
import {
  FiAlertTriangle,
  FiArrowRight,
  FiCheck,
  FiCheckCircle,
  FiCpu,
  FiFileText,
  FiFilter,
  FiPercent,
  FiRepeat,
  FiTrendingUp,
} from 'react-icons/fi';

const CAPABILITIES = [
  {
    id: 'invoices',
    icon: FiFileText,
    title: 'Invoice Processing & Ingestion',
    headline: 'High-precision document extraction with zero manual keying.',
    description:
      'Upload single invoices or batches in PDF, JPG, and PNG formats up to 10 MB. Multi-pass OCR instantly captures vendor details, tax identifiers, dates, and itemized totals.',
    bullets: [
      'Multi-format support: PDF, JPG, PNG',
      'Extraction confidence indicators per field',
      'Automatic duplicate file hash verification',
    ],
    metric: '99.4%',
    metricLabel: 'Extraction accuracy',
    snippetTitle: 'Extracted Invoice Schema',
    snippetRows: [
      ['Vendor', 'Apex Logistics Corp'],
      ['Invoice #', 'INV-2026-0842'],
      ['Subtotal', '$13,500.00'],
      ['Tax (10%)', '$1,350.00'],
      ['Grand Total', '$14,850.00'],
    ],
  },
  {
    id: 'transactions',
    icon: FiRepeat,
    title: 'Transaction Review & Reconciliation',
    headline: 'Continuous visibility across invoice-derived line items.',
    description:
      'Every processed invoice seamlessly converts into structured transaction activity. View merchant matches, payment terms, and status in one unified ledger.',
    bullets: [
      'Automated reconciliation with purchase records',
      'Filterable by date, amount, vendor, and status',
      'One-click export to CSV and standard accounting formats',
    ],
    metric: '< 1.2s',
    metricLabel: 'Processing latency',
    snippetTitle: 'Reconciled Ledger Record',
    snippetRows: [
      ['Account', 'Operating Checking #4402'],
      ['Match Status', 'Reconciled to PO-9912'],
      ['Due Date', 'Nov 15, 2026 (Net 30)'],
      ['Payment Type', 'ACH Automated Transfer'],
    ],
  },
  {
    id: 'categorization',
    icon: FiFilter,
    title: 'Smart Categorization Engine',
    headline: 'Context-aware classification that learns your chart of accounts.',
    description:
      'Machine intelligence analyzes vendor history and expense context to propose the right classification. Category suggestions remain fully transparent and editable.',
    bullets: [
      'Confidence percentage displayed alongside every suggestion',
      'Instant inline override with automatic team preference retention',
      'Configurable chart-of-accounts mapping rules',
    ],
    metric: '98.2%',
    metricLabel: 'Category confidence',
    snippetTitle: 'Classification Analysis',
    snippetRows: [
      ['Merchant', 'CloudScale Infrastructure'],
      ['Predicted Category', 'IT & Cloud Hosting'],
      ['Confidence', '98.2% (Historical Rule)'],
      ['Team Control', 'Editable by Accountant/Owner'],
    ],
  },
  {
    id: 'anomalies',
    icon: FiAlertTriangle,
    title: 'Anomaly & Variance Detection',
    headline: 'Continuous behavioral scanning for duplicate or unusual activity.',
    description:
      'Statistical variance scans detect irregular charge spikes, duplicate invoices, and uncharacteristic vendor charges before payment release.',
    bullets: [
      'Signals intended for review — never unverified verdicts',
      'Configurable variance thresholds based on 90-day history',
      'Audit log tracks reviewer approval and dismissal notes',
    ],
    metric: '100%',
    metricLabel: 'Human-in-the-loop review',
    snippetTitle: 'Variance Signal Audit',
    snippetRows: [
      ['Signal Type', 'Duplicate Amount Detection'],
      ['Variance', '+142% vs. quarterly average'],
      ['Severity', 'High Priority Flag'],
      ['Review State', 'Pending Accountant Sign-off'],
    ],
  },
  {
    id: 'forecasting',
    icon: FiTrendingUp,
    title: 'Cash-Flow Forecasting',
    headline: 'Empirical liquidity projections across 7 to 90-day horizons.',
    description:
      'Explore projected cash inflows, baseline operating expenses, and net liquidity curves derived strictly from historical transaction velocity.',
    bullets: [
      'Dynamic 7, 30, 60, and 90-day rolling horizons',
      'Realistic empirical confidence bounds (±3.8%)',
      'Forecasts clearly identified as estimates, not guarantees',
    ],
    metric: '7–90d',
    metricLabel: 'Projection window',
    snippetTitle: 'Liquidity Projection Metrics',
    snippetRows: [
      ['30-Day Inflow', '$148,200.00'],
      ['30-Day Outflow', '$92,400.00'],
      ['Net Projected', '+$55,800.00 (Surplus)'],
      ['Variance Range', '±3.8% empirical interval'],
    ],
  },
];

export default function CapabilitiesSection() {
  const [selectedCap, setSelectedCap] = useState(0);

  const active = CAPABILITIES[selectedCap];
  const Icon = active.icon;

  return (
    <section className="landing-section capabilities-section" id="capabilities">
      <div className="landing-container">
        {/* Section Header */}
        <div className="landing-section-heading">
          <p className="landing-eyebrow">Comprehensive Platform Capabilities</p>
          <h2>Useful tools for everyday financial review.</h2>
          <p>
            Each capability is built around a specific milestone in the financial decision cycle.
          </p>
        </div>

        {/* Capabilities Grid Layout */}
        <div className="capabilities-master-grid">
          {/* Left Column: Capability Selector Tabs */}
          <div className="capability-nav-column" role="tablist" aria-label="Capabilities list">
            {CAPABILITIES.map((cap, index) => {
              const isCurrent = selectedCap === index;
              const CapIcon = cap.icon;
              return (
                <button
                  key={cap.id}
                  type="button"
                  role="tab"
                  aria-selected={isCurrent}
                  className={`cap-selector-row ${isCurrent ? 'is-active' : ''}`}
                  onClick={() => setSelectedCap(index)}
                >
                  <span className="cap-row-number">0{index + 1}</span>
                  <span className="cap-row-icon">
                    <CapIcon aria-hidden="true" />
                  </span>
                  <div className="cap-row-copy">
                    <strong className="cap-row-title">{cap.title}</strong>
                    <span className="cap-row-subtitle">{cap.metricLabel}: {cap.metric}</span>
                  </div>
                  <FiArrowRight className="cap-row-chevron" aria-hidden="true" />
                </button>
              );
            })}
          </div>

          {/* Right Column: Deep Interactive Capability Inspector */}
          <div className="capability-detail-column" aria-live="polite">
            <div className="capability-inspect-card">
              <div className="inspect-header">
                <div className="inspect-title-wrap">
                  <span className="inspect-icon-badge">
                    <Icon aria-hidden="true" />
                  </span>
                  <div>
                    <span className="inspect-eyebrow">CAPABILITY 0{selectedCap + 1}</span>
                    <h3 className="inspect-title">{active.title}</h3>
                  </div>
                </div>

                <div className="inspect-metric-box">
                  <strong className="inspect-metric-num">{active.metric}</strong>
                  <span className="inspect-metric-label">{active.metricLabel}</span>
                </div>
              </div>

              <p className="inspect-headline">{active.headline}</p>
              <p className="inspect-desc">{active.description}</p>

              <div className="inspect-bullets">
                {active.bullets.map((b) => (
                  <div key={b} className="inspect-bullet-item">
                    <FiCheckCircle className="bullet-icon" aria-hidden="true" />
                    <span>{b}</span>
                  </div>
                ))}
              </div>

              {/* Technical Data Schema Preview */}
              <div className="inspect-schema-preview">
                <div className="schema-header">
                  <span className="schema-dot" aria-hidden="true" />
                  <span>{active.snippetTitle}</span>
                </div>
                <dl className="schema-dl">
                  {active.snippetRows.map(([k, v]) => (
                    <div key={k} className="schema-row">
                      <dt>{k}</dt>
                      <dd>{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

