import SeverityBadge from './SeverityBadge';

export default function AnomalyCard({ anomaly }) {
  const { severity, anomalyScore, reason, transactionId, reviewed } = anomaly;

  return (
    <article className={`anomaly-card ${reviewed ? 'is-reviewed' : ''}`}>
      <div className="anomaly-head">
        <SeverityBadge severity={severity} />
        <span className="anomaly-score">
          Score {(anomalyScore * 100).toFixed(0)}%
        </span>
        <span className={`anomaly-status ${reviewed ? 'done' : 'open'}`}>
          {reviewed ? 'Reviewed' : 'Open'}
        </span>
      </div>
      <p className="anomaly-reason">{reason}</p>
      <small className="anomaly-tx">
        Transaction: {transactionId.slice(0, 8)}…
      </small>
    </article>
  );
}
