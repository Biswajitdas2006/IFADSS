import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useForecast } from '../../hooks/useForecast';
import CashFlowChart from './CashFlowChart';
import './forecast.css';

const METRICS = [
  { value: 'CashFlow', label: 'Cash flow' },
  { value: 'Revenue', label: 'Revenue' },
  { value: 'Expense', label: 'Expense' },
];

const HORIZONS = [7, 30, 60, 90];

const fmt = (value) =>
  Number(value ?? 0).toLocaleString('en-IN', {
    maximumFractionDigits: 0,
  });

export default function ForecastWidget() {
  const { user } = useAuth();
  const isStaff = user?.role === 'Staff';
  const [metric, setMetric] = useState('CashFlow');
  const [horizon, setHorizon] = useState(30);
  const { data, loading, error, insufficient } = useForecast(metric, horizon, !isStaff);

  if (isStaff) return null;

  const label = METRICS.find((item) => item.value === metric)?.label ?? metric;
  const points = data?.forecast ?? [];
  const total = points.reduce((sum, p) => sum + Number(p.predicted ?? 0), 0);
  const low = points.reduce((sum, p) => sum + Number(p.lowerBound ?? p.predicted ?? 0), 0);
  const high = points.reduce((sum, p) => sum + Number(p.upperBound ?? p.predicted ?? 0), 0);

  return (
    <div className="forecast-widget">
      <div className="forecast-head">
        <h3>Forecast</h3>

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

      {loading && <p className="forecast-msg">Generating forecast… this may take a few seconds the first time.</p>}

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
            Projected {label.toLowerCase()} (next {horizon} days): <strong>₹{fmt(total)}</strong>
            <small>
              {' '}· range ₹{fmt(low)} to ₹{fmt(high)} · generated{' '}
              {new Date(data.generatedAt).toLocaleString()}
            </small>
          </p>
          <CashFlowChart forecast={points} label={`Predicted ${label.toLowerCase()}`} />
        </>
      )}
    </div>
  );
}