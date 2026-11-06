import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiArrowRight,
  FiCheck,
  FiClock,
  FiFileText,
  FiFilter,
  FiLayers,
  FiPieChart,
  FiRepeat,
  FiSearch,
  FiTrendingUp,
} from 'react-icons/fi';

export default function ProductShowcase() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <section className="landing-section product-overview-section" id="product">
      <div className="landing-container">
        {/* Section Header */}
        <div className="landing-section-heading">
          <p className="landing-eyebrow">One connected workspace</p>
          <h2>From source documents to a clearer picture.</h2>
          <p>
            Keep invoice processing, transaction review and planning context close together, with account activity where it belongs.
          </p>
        </div>

        {/* Interactive Workspace Window */}
        <div className="showcase-window" aria-label="Interactive IFADSS Workspace Simulator">
          {/* Simulated App Sidebar */}
          <aside className="showcase-sidebar">
            <div className="showcase-sidebar-brand">
              <span className="brand-dot" aria-hidden="true" />
              <strong>IFADSS</strong>
            </div>

            <div className="showcase-nav-section">
              <span className="showcase-nav-title">CORE MODULES</span>
              <button
                type="button"
                className={`showcase-nav-btn ${activeTab === 'overview' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                <FiPieChart aria-hidden="true" />
                <span>Overview</span>
              </button>
              <button
                type="button"
                className={`showcase-nav-btn ${activeTab === 'invoices' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('invoices')}
              >
                <FiFileText aria-hidden="true" />
                <span>Invoices</span>
                <span className="showcase-nav-badge">3</span>
              </button>
              <button
                type="button"
                className={`showcase-nav-btn ${activeTab === 'transactions' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('transactions')}
              >
                <FiRepeat aria-hidden="true" />
                <span>Transactions</span>
              </button>
              <button
                type="button"
                className={`showcase-nav-btn ${activeTab === 'predictions' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('predictions')}
              >
                <FiTrendingUp aria-hidden="true" />
                <span>Predictions</span>
              </button>
            </div>

            <div className="showcase-sidebar-footer">
              <span className="sidebar-role-badge">Accountant Role</span>
            </div>
          </aside>

          {/* Simulated App Main Area */}
          <main className="showcase-main">
            {/* Topbar */}
            <header className="showcase-topbar">
              <div className="showcase-breadcrumbs">
                <span>Workspace</span>
                <span className="crumb-slash">/</span>
                <strong className="crumb-active">
                  {activeTab === 'overview' && 'Financial Overview'}
                  {activeTab === 'invoices' && 'Invoice Management'}
                  {activeTab === 'transactions' && 'Transaction Categorization'}
                  {activeTab === 'predictions' && 'Predictive Cash-Flow'}
                </strong>
              </div>
              <div className="showcase-topbar-actions">
                <span className="showcase-pill-date">Past 30 Days (Oct 1 – Oct 31, 2026)</span>
                <Link to="/register" className="showcase-topbar-cta">
                  Open live workspace <FiArrowRight aria-hidden="true" />
                </Link>
              </div>
            </header>

            {/* Dynamic Tab Body */}
            <div className="showcase-body">
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="tab-pane tab-overview">
                  <div className="overview-kpi-grid">
                    <div className="overview-kpi-card">
                      <span className="kpi-label">Total income</span>
                      <strong className="kpi-value text-positive">$148,200.00</strong>
                      <span className="kpi-subtext">+12.4% vs previous 30d</span>
                    </div>
                    <div className="overview-kpi-card">
                      <span className="kpi-label">Total expense</span>
                      <strong className="kpi-value text-negative">$92,400.00</strong>
                      <span className="kpi-subtext">-3.2% vs previous 30d</span>
                    </div>
                    <div className="overview-kpi-card">
                      <span className="kpi-label">Net cash flow</span>
                      <strong className="kpi-value text-positive">+$55,800.00</strong>
                      <span className="kpi-subtext">Operating surplus</span>
                    </div>
                    <div className="overview-kpi-card">
                      <span className="kpi-label">Open anomalies</span>
                      <strong className="kpi-value text-warning">2 flags</strong>
                      <span className="kpi-subtext">Requires team sign-off</span>
                    </div>
                  </div>

                  <div className="overview-split-grid">
                    {/* Top categories breakdown */}
                    <div className="overview-panel">
                      <div className="panel-header">
                        <h4>Top spending categories</h4>
                        <span className="panel-badge">30-day aggregate</span>
                      </div>
                      <ul className="category-bars">
                        <li>
                          <div className="cat-info">
                            <span>Cloud & Software</span>
                            <strong>$34,200.00</strong>
                          </div>
                          <div className="bar-track"><div className="bar-fill" style={{ width: '85%' }} /></div>
                        </li>
                        <li>
                          <div className="cat-info">
                            <span>Logistics & Freight</span>
                            <strong>$28,500.00</strong>
                          </div>
                          <div className="bar-track"><div className="bar-fill" style={{ width: '68%' }} /></div>
                        </li>
                        <li>
                          <div className="cat-info">
                            <span>Professional Services</span>
                            <strong>$18,400.00</strong>
                          </div>
                          <div className="bar-track"><div className="bar-fill" style={{ width: '44%' }} /></div>
                        </li>
                      </ul>
                    </div>

                    {/* Recent invoice activity */}
                    <div className="overview-panel">
                      <div className="panel-header">
                        <h4>Recent activity</h4>
                        <button type="button" className="panel-text-btn" onClick={() => setActiveTab('invoices')}>
                          View all invoices
                        </button>
                      </div>
                      <ul className="activity-mini-list">
                        <li>
                          <span className="activity-icon-dot text-positive"><FiCheck aria-hidden="true" /></span>
                          <div className="activity-details">
                            <strong>INV-2026-0842 · Apex Logistics</strong>
                            <span>Extracted · $14,850.00</span>
                          </div>
                          <span className="activity-time">2h ago</span>
                        </li>
                        <li>
                          <span className="activity-icon-dot text-info"><FiRepeat aria-hidden="true" /></span>
                          <div className="activity-details">
                            <strong>CloudScale Infrastructure Ltd</strong>
                            <span>Categorized · $2,420.00</span>
                          </div>
                          <span className="activity-time">4h ago</span>
                        </li>
                        <li>
                          <span className="activity-icon-dot text-warning"><FiClock aria-hidden="true" /></span>
                          <div className="activity-details">
                            <strong>Acme Industrial Supply</strong>
                            <span>Anomaly Flag · $8,750.00</span>
                          </div>
                          <span className="activity-time">Yesterday</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: INVOICES */}
              {activeTab === 'invoices' && (
                <div className="tab-pane tab-invoices">
                  <div className="table-controls-bar">
                    <div className="table-search">
                      <FiSearch aria-hidden="true" />
                      <input type="text" readOnly value="Filter invoices by vendor or number…" />
                    </div>
                    <div className="table-actions">
                      <span className="table-pill"><FiFilter aria-hidden="true" /> Filter by status</span>
                    </div>
                  </div>

                  <table className="showcase-table">
                    <thead>
                      <tr>
                        <th>Invoice #</th>
                        <th>Vendor</th>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>OCR Accuracy</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>INV-2026-0842</strong></td>
                        <td>Apex Logistics & Freight</td>
                        <td>Oct 24, 2026</td>
                        <td><strong>$14,850.00</strong></td>
                        <td><span className="conf-pill">99.4%</span></td>
                        <td><span className="status-pill status-ready">Extracted</span></td>
                      </tr>
                      <tr>
                        <td><strong>INV-2026-0839</strong></td>
                        <td>Global Office Solutions</td>
                        <td>Oct 22, 2026</td>
                        <td><strong>$3,120.00</strong></td>
                        <td><span className="conf-pill">98.9%</span></td>
                        <td><span className="status-pill status-ready">Reconciled</span></td>
                      </tr>
                      <tr>
                        <td><strong>INV-2026-0835</strong></td>
                        <td>Acme Industrial Supply</td>
                        <td>Oct 20, 2026</td>
                        <td><strong>$8,750.00</strong></td>
                        <td><span className="conf-pill">97.5%</span></td>
                        <td><span className="status-pill status-flagged">Review Flag</span></td>
                      </tr>
                      <tr>
                        <td><strong>INV-2026-0831</strong></td>
                        <td>Nordic Legal Partners</td>
                        <td>Oct 18, 2026</td>
                        <td><strong>$6,400.00</strong></td>
                        <td><span className="conf-pill">99.1%</span></td>
                        <td><span className="status-pill status-ready">Approved</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 3: TRANSACTIONS */}
              {activeTab === 'transactions' && (
                <div className="tab-pane tab-transactions">
                  <table className="showcase-table">
                    <thead>
                      <tr>
                        <th>Transaction ID</th>
                        <th>Merchant</th>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Category Suggestion</th>
                        <th>Control</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><code>TXN-9021</code></td>
                        <td>CloudScale Infrastructure Ltd</td>
                        <td>Oct 25, 2026</td>
                        <td><strong>$2,420.00</strong></td>
                        <td><span className="cat-tag">IT & Cloud (98%)</span></td>
                        <td><span className="control-link">Edit category</span></td>
                      </tr>
                      <tr>
                        <td><code>TXN-9019</code></td>
                        <td>Metropolitan Gas & Power</td>
                        <td>Oct 23, 2026</td>
                        <td><strong>$1,180.00</strong></td>
                        <td><span className="cat-tag">Utilities (99%)</span></td>
                        <td><span className="control-link">Edit category</span></td>
                      </tr>
                      <tr>
                        <td><code>TXN-9017</code></td>
                        <td>Delta Freight Systems</td>
                        <td>Oct 21, 2026</td>
                        <td><strong>$7,850.00</strong></td>
                        <td><span className="cat-tag">Logistics (96%)</span></td>
                        <td><span className="control-link">Edit category</span></td>
                      </tr>
                      <tr>
                        <td><code>TXN-9014</code></td>
                        <td>Stripe Payment Processing</td>
                        <td>Oct 20, 2026</td>
                        <td><strong>$42,100.00</strong></td>
                        <td><span className="cat-tag tag-income">Operating Revenue</span></td>
                        <td><span className="control-link">Verified</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 4: PREDICTIONS */}
              {activeTab === 'predictions' && (
                <div className="tab-pane tab-predictions">
                  <div className="prediction-header-metrics">
                    <div>
                      <span className="kpi-label">30-Day Projected Net Cash Flow</span>
                      <strong className="kpi-value text-positive">+$55,800.00</strong>
                    </div>
                    <div className="horizon-pills">
                      <span className="horizon-pill is-active">30 Days</span>
                      <span className="horizon-pill">60 Days</span>
                      <span className="horizon-pill">90 Days</span>
                    </div>
                  </div>

                  {/* SVG Forecast Graph Simulation */}
                  <div className="prediction-chart-container">
                    <svg viewBox="0 0 600 160" className="prediction-svg" aria-label="30-day cash flow projection chart">
                      <defs>
                        <linearGradient id="chart-area-grad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      {/* Grid lines */}
                      <line x1="0" y1="40" x2="600" y2="40" stroke="#edf2ef" strokeWidth="1" strokeDasharray="4 4" />
                      <line x1="0" y1="80" x2="600" y2="80" stroke="#edf2ef" strokeWidth="1" strokeDasharray="4 4" />
                      <line x1="0" y1="120" x2="600" y2="120" stroke="#edf2ef" strokeWidth="1" strokeDasharray="4 4" />

                      {/* Upper & lower confidence bounds */}
                      <polygon
                        points="0,110 80,105 160,95 240,90 320,70 400,60 480,50 600,35 600,65 480,85 400,95 320,105 240,115 160,120 80,125 0,130"
                        fill="rgba(169, 207, 193, 0.2)"
                      />

                      {/* Filled trend gradient */}
                      <polygon
                        points="0,120 80,112 160,105 240,98 320,84 400,75 480,62 600,48 600,160 0,160"
                        fill="url(#chart-area-grad)"
                      />

                      {/* Main projection curve */}
                      <path
                        d="M 0 120 Q 120 110, 240 98 T 480 62 T 600 48"
                        fill="none"
                        stroke="#075b48"
                        strokeWidth="2.5"
                      />

                      {/* Key forecast projection points */}
                      <circle cx="240" cy="98" r="4" fill="#075b48" stroke="#fff" strokeWidth="2" />
                      <circle cx="480" cy="62" r="4" fill="#075b48" stroke="#fff" strokeWidth="2" />
                      <circle cx="600" cy="48" r="5" fill="#10b981" stroke="#fff" strokeWidth="2" />
                    </svg>

                    <div className="chart-legend">
                      <span><span className="legend-dot dot-trend" /> Projected Cash Balance</span>
                      <span><span className="legend-dot dot-bounds" /> ±3.8% Empirical Confidence Interval</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <footer className="showcase-caption-footer">
              <span>Interactive workspace simulator · Live figures calculate automatically from your accounts</span>
            </footer>
          </main>
        </div>
      </div>
    </section>
  );
}

