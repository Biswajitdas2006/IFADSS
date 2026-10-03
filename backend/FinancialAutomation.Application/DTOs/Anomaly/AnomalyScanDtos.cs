namespace FinancialAutomation.Application.DTOs.Anomaly;
public record AnomalyScanRequest(Guid UserId, int WindowDays);

public class AnomalyScanItem
{
    public Guid TransactionId { get; set; }
    public decimal AnomalyScore { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string Severity { get; set; } = string.Empty;
}

public class AnomalyScanResponse
{
    public List<AnomalyScanItem> Anomalies { get; set; } = new();
}