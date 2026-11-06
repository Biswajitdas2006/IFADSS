import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useForecast } from '../../hooks/useForecast';
import CashFlowChart from './CashFlowChart';
import { formatCurrency } from '../../utils/formatCurrency';
import './forecast.css';

const METRICS = [
  { value: 'CashFlow', label: 'Cash flow' },
  { value: 'Revenue', label: 'Revenue' },
  { value: 'Expense', label: 'Expense' },
];

const HORIZONS = [7, 30, 60, 90];

export default function ForecastWidget({ actualTransactions = [] }) {
  const { user } = useAuth();
  const isStaff = user?.role === 'Staff';
  const [metric, setMetric] = useState('CashFlow');
  const [horizon, setHorizon] = useState(30);
  const { data, loading, error, insufficient } = useForecast(metric, horizon, !isStaff);

  if (isStaff) {
    return (
      <section className="forecast-widget dashboard-card forecast-unavailable">
        <h2>Forecasts are not available for this role</h2>
        <p className="forecast-msg">Contact your account administrator if you need access to financial forecasts.</p>
      </section>
    );
  }

  const label = METRICS.find((item) => item.value === metric)?.label ?? metric;
  const points = data?.forecast ?? [];
  const total = points.reduce((sum, p) => sum + Number(p.predicted ?? 0), 0);
  const low = points.reduce((sum, p) => sum + Number(p.lowerBound ?? p.predicted ?? 0), 0);
  const high = points.reduce((sum, p) => sum + Number(p.upperBound ?? p.predicted ?? 0), 0);

  return (
    <div className="forecast-widget dashboard-card">
      <div className="forecast-head">
        <h2>Cash flow forecast</h2>

        <div className="forecast-controls">
          <select value={metric} onChange={(e) => setMetric(e.target.value)}>
            {METRICS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>

          <select value={horizon} onChange={(e) => setHorizon(Number(e.target.value))}>
            {HORIZONS.map((value) => (
              <option key={value} value={value}>
                Next {value} days
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && <p className="forecast-msg" role="status">Generating forecast…</p>}

      {insufficient && (
        <p className="forecast-msg">
          Not enough history yet. Transactions on at least 3 different days are needed to forecast{' '}
          {label.toLowerCase()}.
        </p>
      )}

      {error && <p className="forecast-msg forecast-error">{error}</p>}

      {data && !loading && points.length > 0 && (
        <>
          <p className="forecast-summary">
            Projected for the next {horizon} days: <strong>{formatCurrency(total, { maximumFractionDigits: 0 })}</strong>
            <small>{' '}· estimated range {formatCurrency(low, { maximumFractionDigits: 0 })} to {formatCurrency(high, { maximumFractionDigits: 0 })}</small>
          </p>
          <CashFlowChart
            forecast={points}
            actualTransactions={actualTransactions}
            metricType={metric}
            label={`Predicted ${label.toLowerCase()}`}
          />
        </>
      )}
      {!loading && !error && !insufficient && !data && actualTransactions.length > 0 && (
        <CashFlowChart actualTransactions={actualTransactions} metricType={metric} />
      )}
    </div>
  );
}