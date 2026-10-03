import { useCallback, useEffect, useState } from 'react';
import { anomalyService } from '../services/anomalyService';
import AnomalyCard from '../components/anomaly/AnomalyCard';
import AppLayout from '../components/layout/AppLayout';
import { useAuth } from '../context/AuthContext';
import '../components/anomaly/anomaly.css';

const PAGE_SIZE = 10;

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanMsg, setScanMsg] = useState('');

  const load = useCallback(async () => {
    if (!hasAccess) return;

    setLoading(true);
    setError('');
    try {
      setData(await anomalyService.list({
        severity,
        reviewed,
        page,
        pageSize: PAGE_SIZE,
      }));
    } catch (e) {
      setError(e.response?.data?.error?.message || 'Could not load anomalies');
    } finally {
      setLoading(false);
    }
  }, [severity, reviewed, page, hasAccess]);

  useEffect(() => {
    if (!hasAccess) return undefined;

    let active = true;
    anomalyService.list({
      severity,
      reviewed,
      page,
      pageSize: PAGE_SIZE,
    }).then((result) => {
      if (active) {
        setData(result);
        setError('');
      }
    }).catch((e) => {
      if (active) {
        setError(e.response?.data?.error?.message || 'Could not load anomalies');
      }
    }).finally(() => {
      if (active) setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [severity, reviewed, page, hasAccess]);

  const onFilter = (setter) => (event) => {
    setLoading(true);
    setter(event.target.value);
    setPage(1);
  };

  const runScan = async () => {
    setScanning(true);
    setScanMsg('');
    try {
      const { newAnomaliesSaved } = await anomalyService.scan(90);
      setScanMsg(`Scan complete: ${newAnomaliesSaved} new anomalies saved`);
      if (page !== 1) {
        setLoading(true);
        setPage(1);
      }
      else await load();
    } catch (e) {
      setScanMsg(
        e.response?.data?.error?.message
          || 'Scan failed. Is the AI service running?'
      );
    } finally {
      setScanning(false);
    }
  };

  if (!hasAccess) {
    return (
      <AppLayout>
        <p>You do not have access to this page.</p>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <main className="anomaly-page">
        <h1>Anomalies</h1>
        <p className="anomaly-subheading">
          Review transactions flagged as unusual by the anomaly model.
        </p>

        <div className="anomaly-toolbar">
          <select
            aria-label="Filter by severity"
            value={severity}
            onChange={onFilter(setSeverity)}
          >
            <option value="">All severities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
          <select
            aria-label="Filter by review status"
            value={reviewed}
            onChange={onFilter(setReviewed)}
          >
            <option value="">All statuses</option>
            <option value="false">Open</option>
            <option value="true">Reviewed</option>
          </select>
          <button type="button" onClick={runScan} disabled={scanning}>
            {scanning ? 'Scanning…' : 'Run scan'}
          </button>
          {scanMsg && (
            <span className="anomaly-scan-message" role="status">
              {scanMsg}
            </span>
          )}
        </div>

        {loading && <p className="anomaly-message">Loading…</p>}
        {!loading && error && <p className="anomaly-error" role="alert">{error}</p>}
        {!loading && !error && data.items.length === 0 && (
          <p className="anomaly-message">No anomalies found.</p>
        )}

        {!loading && !error && data.items.map((anomaly) => (
          <AnomalyCard key={anomaly.id} anomaly={anomaly} />
        ))}

        {data.totalPages > 1 && (
          <div className="anomaly-pager">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => {
                setLoading(true);
                setPage((currentPage) => currentPage - 1);
              }}
            >
              Previous
            </button>
            <span>Page {data.page} of {data.totalPages}</span>
            <button
              type="button"
              disabled={page >= data.totalPages}
              onClick={() => {
                setLoading(true);
                setPage((currentPage) => currentPage + 1);
              }}
            >
              Next
            </button>
          </div>
        )}
      </main>
    </AppLayout>
  );
}