using FinancialAutomation.Domain.Common;
using FinancialAutomation.Domain.Enums;

namespace FinancialAutomation.Domain.Entities;

public class Anomaly : BaseEntity
{
    public Guid TransactionId { get; private set; }
    public Transaction? Transaction { get; private set; }

    public decimal AnomalyScore { get; private set; }
    public string Reason { get; private set; } = string.Empty;
    public AnomalySeverity Severity { get; private set; }
    public bool Reviewed { get; private set; }
    public DateTime? ReviewedAt { get; private set; }
    public DateTime DetectedAt { get; private set; } = DateTime.UtcNow;

    private Anomaly() { } // Required by EF Core

    public Anomaly(Guid transactionId, decimal anomalyScore, string reason, AnomalySeverity severity)
    {
        if (transactionId == Guid.Empty)
            throw new ArgumentException("TransactionId cannot be empty.", nameof(transactionId));
        if (anomalyScore < 0 || anomalyScore > 1)
            throw new ArgumentOutOfRangeException(nameof(anomalyScore), "AnomalyScore must be between 0 and 1.");
        if (string.IsNullOrWhiteSpace(reason))
            throw new ArgumentException("Reason cannot be empty.", nameof(reason));

        TransactionId = transactionId;
        AnomalyScore = anomalyScore;
        Reason = reason;
        Severity = severity;
    }

    public void MarkReviewed()
    {
        Reviewed = true;
        ReviewedAt = DateTime.UtcNow;
    }
}