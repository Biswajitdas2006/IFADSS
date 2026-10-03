namespace FinancialAutomation.Application.DTOs.Anomaly;
public class AnomalyDto
{
    public Guid Id { get; set; }
    public Guid TransactionId { get; set; }
    public decimal AnomalyScore { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string Severity { get; set; } = string.Empty;   // enum -> string
    public bool Reviewed { get; set; }
    public DateTime? ReviewedAt { get; set; }
}