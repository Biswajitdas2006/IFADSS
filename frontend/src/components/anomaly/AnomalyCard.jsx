import { useState } from 'react';
import SeverityBadge from './SeverityBadge';

function getScoreClass(score) {
  if (score >= 0.75) return 'score-high';
  if (score >= 0.65) return 'score-medium';
  return 'score-low';
}

export default function AnomalyCard({ anomaly, onReview }) {
  const {
    id,
    severity,
    anomalyScore,
    reason,
    transactionId,
    reviewed,
  } = anomaly;

  const [busy, setBusy] = useState(false);

  const score = Math.min(1, Math.max(0, Number(anomalyScore || 0)));
  const scorePercent = Math.round(score * 100);

  const handleReview = async () => {
    setBusy(true);

    try {
      await onReview(id);
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className={`anomaly-card ${reviewed ? 'is-reviewed' : ''}`}>
      <div className="anomaly-card-header">
        <div className="anomaly-card-title">
          <div className="anomaly-indicator" aria-hidden="true" />

          <div>
            <div className="anomaly-title-row">
              <SeverityBadge severity={severity} />

              <span className={`anomaly-status ${reviewed ? 'done' : 'open'}`}>
                <span className="status-dot" />
                {reviewed ? 'Reviewed' : 'Needs review'}
              </span>
            </div>

            <p className="anomaly-transaction-id">
              Transaction ID
              <span>{transactionId.slice(0, 12)}…</span>
            </p>
          </div>
        </div>

        <div className="anomaly-score-block">
          <span className="anomaly-score-label">Anomaly score</span>

          <strong className={getScoreClass(score)}>
            {score.toFixed(2)}
          </strong>

          <span className="anomaly-score-confidence">Model score, not probability</span>
        </div>
      </div>

      <div
        className="anomaly-score-track"
        role="progressbar"
        aria-label="Relative anomaly score"
        aria-valuemin={0}
        aria-valuemax={1}
        aria-valuenow={score}
      >
        <div
          className={`anomaly-score-fill ${getScoreClass(score)}`}
          style={{ width: `${scorePercent}%` }}
        />
      </div>

      <div className="anomaly-reason-section">
        <div className="section-label">
          Why was this flagged?
        </div>

        <p className="anomaly-reason">
          {reason || 'The anomaly model detected an unusual transaction pattern.'}
        </p>
      </div>

      <div className="anomaly-card-footer">
        {!reviewed && onReview ? (
          <button
            type="button"
            className="anomaly-review-button"
            onClick={handleReview}
            disabled={busy}
          >
            {busy ? (
              <>
                <span className="button-spinner" />
                Saving…
              </>
            ) : (
              <>
                ✓ Mark as reviewed
              </>
            )}
          </button>
        ) : (
          <span className="review-complete">
            ✓ Review completed
          </span>
        )}
      </div>
    </article>
  );
}