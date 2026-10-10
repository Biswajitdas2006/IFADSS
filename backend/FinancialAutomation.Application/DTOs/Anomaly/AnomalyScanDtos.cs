using System.Text.Json.Serialization;

namespace FinancialAutomation.Application.DTOs.Anomaly;

public class AnomalyScanTransaction
{
    [JsonPropertyName("id")]
    public Guid Id { get; set; }

    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    [JsonPropertyName("amount")]
    public decimal Amount { get; set; }

    [JsonPropertyName("transactionDate")]
    public DateOnly TransactionDate { get; set; }
}

public class AnomalyScanRequest
{
    [JsonPropertyName("transactions")]
    public List<AnomalyScanTransaction> Transactions { get; set; } = new();
}

public class AnomalyScanItem
{
    [JsonPropertyName("transactionId")]
    public Guid TransactionId { get; set; }

    [JsonPropertyName("anomalyScore")]
    public decimal AnomalyScore { get; set; }

    [JsonPropertyName("reason")]
    public string Reason { get; set; } = string.Empty;

    [JsonPropertyName("severity")]
    public string Severity { get; set; } = string.Empty;
}

public class AnomalyScanResponse
{
    [JsonPropertyName("anomalies")]
    public List<AnomalyScanItem> Anomalies { get; set; } = new();
}