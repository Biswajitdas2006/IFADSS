using System.Text.Json.Serialization;

namespace FinancialAutomation.Application.DTOs.Prediction;

public record PredictionHistoryPoint(
    [property: JsonPropertyName("date")] DateOnly Date,
    [property: JsonPropertyName("value")] decimal Value);

public record PredictionForecastRequest(
    [property: JsonPropertyName("userId")] Guid UserId,
    [property: JsonPropertyName("metricType")] string MetricType,
    [property: JsonPropertyName("horizonDays")] int HorizonDays,
    [property: JsonPropertyName("history")] List<PredictionHistoryPoint> History);

public class AiForecastPoint
{
    [JsonPropertyName("date")]
    public DateTime Date { get; set; }

    [JsonPropertyName("predicted")]
    public decimal Predicted { get; set; }

    [JsonPropertyName("lowerBound")]
    public decimal? LowerBound { get; set; }

    [JsonPropertyName("upperBound")]
    public decimal? UpperBound { get; set; }
}

public class PredictionForecastResponse
{
    [JsonPropertyName("forecast")]
    public List<AiForecastPoint> Forecast { get; set; } = new();
}