import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import AppLayout from '../components/layout/AppLayout';
import ForecastWidget from '../components/dashboard/ForecastWidget';
import SummarySection from '../components/dashboard/SummarySection';
import { useDashboardSummary } from '../hooks/useDashboardSummary';
import { getTransactions } from '../services/transactionService';
import { anomalyService } from '../services/anomalyService';
import { formatCurrency } from '../utils/formatCurrency';
import './dashboard.css';

function DashboardPage() {
  const { user } = useAuth();
  const { data: summary, loading: summaryLoading, error: summaryError } = useDashboardSummary();
  const canViewAnomalies = ['Owner', 'Accountant'].includes(user?.role);
  const [transactions, setTransactions] = useState([]);
  const [transactionsError, setTransactionsError] = useState('');
  const [anomalies, setAnomalies] = useState([]);
  const [anomaliesLoading, setAnomaliesLoading] = useState(canViewAnomalies);
  const [anomaliesError, setAnomaliesError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const today = new Date();
    const to = today.toISOString().slice(0, 10);
    const from = new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    getTransactions({ from, to, page: 1, pageSize: 100 })
      .then((result) => {
        if (!cancelled) setTransactions(result.items ?? []);
      })
      .catch((requestError) => {
        if (!cancelled) {
          setTransactionsError(
            requestError.response?.data?.error?.message || 'Could not load recent transactions',
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!canViewAnomalies) return undefined;

    let cancelled = false;
    anomalyService
      .list({ reviewed: false, page: 1, pageSize: 3 })
      .then((result) => {
        if (!cancelled) setAnomalies(result.items ?? []);
      })
      .catch((requestError) => {
        if (!cancelled) {
          setAnomaliesError(
            requestError.response?.data?.error?.message || 'Could not load open anomalies',
          );
        }
      })
      .finally(() => {
        if (!cancelled) setAnomaliesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [canViewAnomalies]);

  return (
    <AppLayout>
      <div className="dashboard-page">
        <header className="dashboard-header page-header">
          <div>
            <h1>Dashboard</h1>
            <p>
              {summary
                ? `${summary.from} – ${summary.to}`
                : 'Your financial overview'}
            </p>
          </div>
          <span className="dashboard-role">{user?.role}</span>
        </header>

        <SummarySection data={summary} loading={summaryLoading} error={summaryError} />

        <section className="dashboard-overview-grid" aria-label="Forecast and spending categories">
          <ForecastWidget actualTransactions={transactions} />

          <article className="dashboard-card dashboard-categories">
            <h2>Top spending categories</h2>
            {summaryLoading ? (
              <p className="dashboard-message">Loading categories…</p>
            ) : summaryError ? (
              <p className="dashboard-message dashboard-error">{summaryError}</p>
            ) : summary?.topCategories?.length ? (
              <ul className="dashboard-category-list">
                {summary.topCategories.map((category) => {
                  const largestAmount = summary.topCategories[0]?.amount || 1;
                  const width = Math.max(4, (category.amount / largestAmount) * 100);

                  return (
                    <li className="dashboard-category" key={category.category}>
                      <div className="dashboard-category-label">
                        <span>{category.category}</span>
                        <strong>{formatCurrency(category.amount)}</strong>
                      </div>
                      <div className="dashboard-category-track">
                        <span style={{ width: `${width}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="dashboard-message">No expense data for this period.</p>
            )}
          </article>
        </section>

        {transactionsError && (
          <p className="dashboard-inline-error" role="status">{transactionsError}</p>
        )}

        {canViewAnomalies && (
          <section className="dashboard-card dashboard-anomalies" aria-label="Open anomalies">
            <div className="dashboard-section-heading">
              <h2>Open anomalies</h2>
              <Link to="/anomalies">View all</Link>
            </div>

            {anomaliesLoading ? (
              <p className="dashboard-message">Loading anomalies…</p>
            ) : anomaliesError ? (
              <p className="dashboard-message dashboard-error">{anomaliesError}</p>
            ) : anomalies.length ? (
              <ul className="dashboard-anomaly-list">
                {anomalies.map((anomaly) => (
                  <li className="dashboard-anomaly" key={anomaly.id}>
                    <span className={`dashboard-severity severity-${(anomaly.severity || 'low').toLowerCase()}`}>
                      {anomaly.severity || 'Other'}
                    </span>
                    <span className="dashboard-anomaly-reason">
                      {anomaly.reason || 'Unusual transaction activity detected'}
                    </span>
                    <span className="dashboard-anomaly-score">
                      Score {Math.round(Number(anomaly.anomalyScore) * 100)}%
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="dashboard-message">No open anomalies.</p>
            )}
          </section>
        )}
      </div>
    </AppLayout>
  );
}

export default DashboardPage;