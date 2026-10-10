import { useState } from 'react';
import SeverityBadge from './SeverityBadge';

function getScoreClass(score) {
  if (score >= 0.75) return 'score-high';
  if (score >= 0.65) return 'score-medium';
  return 'score-low';
}

function getScoreLabel(score) {
  if (score >= 0.75) return 'High confidence';
  if (score >= 0.65) return 'Moderate confidence';
  return 'Low confidence';
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

  const score = Number(anomalyScore || 0);
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
      {/* Header */}
      <div className="anomaly-card-header">
        <div className="anomaly-card-title">
          <div className="anomaly-indicator" />

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
          <span className="anomaly-score-label">ML anomaly score</span>

          <strong className={getScoreClass(score)}>
            {scorePercent}%
          </strong>

          <span className="anomaly-score-confidence">
            {getScoreLabel(score)}
          </span>
        </div>
      </div>

      {/* Score bar */}
      <div className="anomaly-score-track" aria-label={`Anomaly score ${scorePercent}%`}>
        <div
          className={`anomaly-score-fill ${getScoreClass(score)}`}
          style={{ width: `${scorePercent}%` }}
        />
      </div>

      {/* Reason */}
      <div className="anomaly-reason-section">
        <div className="section-label">
          <span className="section-icon">AI</span>
          Why was this flagged?
        </div>

        <p className="anomaly-reason">
          {reason || 'The anomaly model detected an unusual transaction pattern.'}
        </p>
      </div>

      {/* Model information */}
      <div className="anomaly-meta-grid">
        <div className="anomaly-meta-item">
          <span>Detection model</span>
          <strong>Isolation Forest</strong>
        </div>

        <div className="anomaly-meta-item">
          <span>Detection type</span>
          <strong>Behavioral anomaly</strong>
        </div>

        <div className="anomaly-meta-item">
          <span>Status</span>
          <strong>{reviewed ? 'Reviewed' : 'Pending review'}</strong>
        </div>
      </div>

      {/* Footer */}
      <div className="anomaly-card-footer">
        <div className="anomaly-footer-id">
          <span>Transaction</span>
          <code>{transactionId.slice(0, 8)}…</code>
        </div>

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