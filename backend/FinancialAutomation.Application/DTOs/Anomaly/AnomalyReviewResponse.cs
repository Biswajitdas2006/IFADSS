namespace FinancialAutomation.Application.DTOs.Anomaly;
public class AnomalyReviewResponse
{
    public Guid Id { get; set; }
    public bool Reviewed { get; set; }
    public DateTime ReviewedAt { get; set; }
}