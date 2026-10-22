import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { anomalyService } from '../services/anomalyService';
import AnomalyCard from '../components/anomaly/AnomalyCard';
import AppLayout from '../components/layout/AppLayout';
import { useAuth } from '../context/AuthContext';
import '../components/anomaly/anomaly.css';

const PAGE_SIZE = 10;

const SCAN_WINDOWS = [
  { value: 30, label: 'Last 30 days' },
  { value: 60, label: 'Last 60 days' },
  { value: 90, label: 'Last 90 days' },
  { value: 180, label: 'Last 6 months' },
  { value: 365, label: 'Last year' },
];

export default function AnomaliesPage() {
  const { user } = useAuth();

  const hasAccess = ['Owner', 'Accountant'].includes(user?.role);

  const [data, setData] = useState({
    items: [],
    page: 1,
    totalPages: 0,
    totalItems: 0,
  });

  const [severity, setSeverity] = useState('');
  const [reviewed, setReviewed] = useState('');
  const [page, setPage] = useState(1);

  const [scanWindow, setScanWindow] = useState(90);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [scanning, setScanning] = useState(false);
  const [scanMsg, setScanMsg] = useState('');
  const [scanResult, setScanResult] = useState(null);

  const autoScanned = useRef(false);

  const load = useCallback(async () => {
    if (!hasAccess) return;

    setLoading(true);
    setError('');

    try {
      const result = await anomalyService.list({
        severity,
        reviewed,
        page,
        pageSize: PAGE_SIZE,
      });

      setData(result);
    } catch (e) {
      setError(
        e.response?.data?.error?.message ||
        'Could not load anomalies'
      );
    } finally {
      setLoading(false);
    }
  }, [severity, reviewed, page, hasAccess]);

  useEffect(() => {
    load();
  }, [load]);

  // Auto-scan once when the page opens (backend skips already-flagged transactions)
  useEffect(() => {
    if (!hasAccess || autoScanned.current) return;
    autoScanned.current = true;

    anomalyService
      .scan(scanWindow)
      .then(() => load())
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAccess]);

  const runScan = async () => {
    setScanning(true);
    setScanMsg('');
    setScanResult(null);
    setError('');

    try {
      const result = await anomalyService.scan(scanWindow);

      const newAnomaliesSaved = result?.newAnomaliesSaved ?? 0;

      setScanResult({
        count: newAnomaliesSaved,
        window: scanWindow,
      });

      if (newAnomaliesSaved > 0) {
        setScanMsg(
          `${newAnomaliesSaved} new anomal${newAnomaliesSaved === 1 ? 'y' : 'ies'} detected`
        );
      } else {
        setScanMsg('Scan completed — no new anomalies detected');
      }

      setPage(1);

      const refreshed = await anomalyService.list({
        severity,
        reviewed,
        page: 1,
        pageSize: PAGE_SIZE,
      });

      setData(refreshed);
    } catch (e) {
      setError(
        e.response?.data?.error?.message ||
        'Scan failed. Is the AI service running?'
      );
    } finally {
      setScanning(false);
    }
  };

  const handleReview = async (id) => {
    try {
      await anomalyService.markReviewed(id);

      if (reviewed === 'false') {
        await load();
        return;
      }

      setData((prev) => ({
        ...prev,
        items: prev.items.map((anomaly) =>
          anomaly.id === id ? { ...anomaly, reviewed: true } : anomaly
        ),
      }));
    } catch (e) {
      setError(
        e.response?.data?.error?.message ||
        'Could not mark as reviewed'
      );
    }
  };

  const statistics = useMemo(() => {
    const items = data.items || [];

    return {
      high: items.filter((item) => item.severity === 'High').length,
      medium: items.filter((item) => item.severity === 'Medium').length,
      low: items.filter((item) => item.severity === 'Low').length,
      open: items.filter((item) => !item.reviewed).length,
      reviewed: items.filter((item) => item.reviewed).length,
    };
  }, [data.items]);

  const handleFilter = (setter) => (event) => {
    setter(event.target.value);
    setPage(1);
  };

  const clearFilters = () => {
    setSeverity('');
    setReviewed('');
    setPage(1);
  };

  const hasActiveFilters = Boolean(severity || reviewed);

  if (!hasAccess) {
    return (
      <AppLayout>
        <main className="anomaly-page">
          <section className="anomaly-access-denied">
            <div className="access-icon">!</div>
            <h2>Access restricted</h2>
            <p>You do not have permission to access anomaly detection.</p>
          </section>
        </main>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <main className="anomaly-page">
        <section className="anomaly-page-header">
          <div>
            <div className="anomaly-eyebrow">
              <span className="eyebrow-dot" />
              AI FINANCIAL MONITORING
            </div>

            <h1>Anomaly Detection</h1>

            <p className="anomaly-subheading">
              Identify unusual financial transactions using behavioral
              machine learning. Review risk signals, investigate flagged activity,
              and record each decision.
            </p>
          </div>

          <div className="model-status">
            <span className="model-status-dot" />
            <div>
              <strong>AI model ready</strong>
              <span>Isolation Forest</span>
            </div>
          </div>
        </section>

        <section className="anomaly-scan-panel">
          <div className="scan-panel-info">
            <div className="scan-icon">AI</div>

            <div>
              <h2>Run anomaly analysis</h2>
              <p>
                Analyze transactions within the selected time window
                and detect unusual spending behavior.
              </p>
            </div>
          </div>

          <div className="scan-controls">
            <div className="scan-window-control">
              <label htmlFor="scan-window">Analysis period</label>

              <select
                id="scan-window"
                value={scanWindow}
                onChange={(event) => setScanWindow(Number(event.target.value))}
                disabled={scanning}
              >
                {SCAN_WINDOWS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              className="run-scan-button"
              onClick={runScan}
              disabled={scanning}
            >
              {scanning ? (
                <>
                  <span className="button-spinner" />
                  Analyzing…
                </>
              ) : (
                <>
                  Run AI scan
                  <span className="button-arrow">→</span>
                </>
              )}
            </button>
          </div>
        </section>

        {scanMsg && (
          <section
            className={`scan-result-banner ${
              scanResult?.count > 0 ? 'has-anomalies' : 'no-anomalies'
            }`}
            role="status"
          >
            <div className="scan-result-icon">
              {scanResult?.count > 0 ? '!' : '✓'}
            </div>

            <div>
              <strong>{scanMsg}</strong>

              <span>
                {scanResult?.count > 0
                  ? `The model found unusual transactions in the last ${scanResult.window} days.`
                  : `The model analyzed the last ${scanResult?.window || scanWindow} days and found no new transactions requiring an anomaly flag.`}
              </span>
            </div>
          </section>
        )}

        <section className="anomaly-summary" aria-label="Anomaly summary">
          <div className="summary-card summary-total">
            <span className="summary-label">Flagged transactions</span>
            <strong>{data.totalItems}</strong>
            <span className="summary-description">Matching current filters</span>
          </div>

          <div className="summary-card">
            <span className="summary-label">High severity</span>
            <strong className="summary-high">{statistics.high}</strong>
            <span className="summary-description">On this page · review first</span>
          </div>

          <div className="summary-card">
            <span className="summary-label">Medium severity</span>
            <strong className="summary-medium">{statistics.medium}</strong>
            <span className="summary-description">On this page · review recommended</span>
          </div>

          <div className="summary-card">
            <span className="summary-label">Low severity</span>
            <strong className="summary-low">{statistics.low}</strong>
            <span className="summary-description">On this page · monitor</span>
          </div>

          <div className="summary-card">
            <span className="summary-label">Open reviews</span>
            <strong>{statistics.open}</strong>
            <span className="summary-description">Awaiting review on this page</span>
          </div>
        </section>

        <section className="anomaly-list-header">
          <div>
            <h2>Detected anomalies</h2>
            <p>
              {data.totalItems} {data.totalItems === 1 ? 'transaction' : 'transactions'}
              {' '}match your filters. Severity and review counts show this page only.
            </p>
          </div>

          <div className="anomaly-filters">
            <div className="filter-group">
              <label htmlFor="severity-filter">Severity</label>

              <select
                id="severity-filter"
                value={severity}
                onChange={handleFilter(setSeverity)}
              >
                <option value="">All severities</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="status-filter">Status</label>

              <select
                id="status-filter"
                value={reviewed}
                onChange={handleFilter(setReviewed)}
              >
                <option value="">All statuses</option>
                <option value="false">Open</option>
                <option value="true">Reviewed</option>
              </select>
            </div>

            <div className="filter-actions">
              <button
                type="button"
                className="anomaly-secondary-button"
                onClick={load}
                disabled={loading}
              >
                {loading ? 'Refreshing…' : 'Refresh'}
              </button>
              {hasActiveFilters && (
                <button
                  type="button"
                  className="anomaly-text-button"
                  onClick={clearFilters}
                  disabled={loading}
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="anomaly-results">
          {loading && (
            <div className="anomaly-loading">
              <span className="loading-spinner" />
              <p>Loading anomaly analysis…</p>
            </div>
          )}

          {!loading && error && (
            <div className="anomaly-error" role="alert">
              <div className="error-icon">!</div>

              <div>
                <strong>Unable to load anomalies</strong>
                <p>{error}</p>
                <button
                  type="button"
                  className="anomaly-secondary-button error-retry-button"
                  onClick={load}
                  disabled={loading}
                >
                  Try again
                </button>
              </div>
            </div>
          )}

          {!loading && !error && data.items.length === 0 && (
            <div className="anomaly-empty">
              <div className="empty-icon">✓</div>

              <h2>{hasActiveFilters ? 'No matching anomalies' : 'No anomalies found'}</h2>

              <p>
                {hasActiveFilters
                  ? 'There are no flagged transactions for the selected severity and review status. Clear the filters to see all results.'
                  : 'No transactions have been flagged by the anomaly model yet. Run a scan to analyze recent activity.'}
              </p>

              {hasActiveFilters ? (
                <button
                  type="button"
                  className="empty-scan-button"
                  onClick={clearFilters}
                >
                  Clear filters
                </button>
              ) : (
                <button
                  type="button"
                  className="empty-scan-button"
                  onClick={runScan}
                  disabled={scanning}
                >
                  {scanning ? 'Analyzing…' : 'Run AI scan'}
                </button>
              )}
            </div>
          )}

          {!loading && !error && data.items.length > 0 && (
            <div className="anomaly-list">
              {data.items.map((anomaly) => (
                <AnomalyCard
                  key={anomaly.id}
                  anomaly={anomaly}
                  onReview={handleReview}
                />
              ))}
            </div>
          )}
        </section>

        {!loading && !error && data.totalPages > 1 && (
          <div className="anomaly-pager">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((current) => current - 1)}
            >
              ← Previous
            </button>

            <span>
              Page <strong>{data.page}</strong> of{' '}
              <strong>{data.totalPages}</strong>
            </span>

            <button
              type="button"
              disabled={page >= data.totalPages}
              onClick={() => setPage((current) => current + 1)}
            >
              Next →
            </button>
          </div>
        )}
      </main>
    </AppLayout>
  );
}