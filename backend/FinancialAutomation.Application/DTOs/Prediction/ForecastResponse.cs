namespace FinancialAutomation.Application.DTOs.Prediction;

public class ForecastResponse
{
    public string MetricType { get; set; } = string.Empty;
    public DateTime GeneratedAt { get; set; }
    public List<ForecastPointDto> Forecast { get; set; } = new();
}