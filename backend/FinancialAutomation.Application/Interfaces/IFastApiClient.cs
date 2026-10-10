namespace FinancialAutomation.Application.Interfaces;
using FinancialAutomation.Application.DTOs.Anomaly;
using FinancialAutomation.Application.DTOs.Prediction;
public interface IFastApiClient
{
    IOcrClient Ocr { get; }
    IClassifyClient Classify { get; }
}

public interface IOcrClient
{
    Task<OcrExtractResult> ExtractAsync(
        string filePath,
        CancellationToken cancellationToken = default);
}

public interface IClassifyClient
{
    Task<ClassificationResult> ClassifyAsync(
        string description,
        decimal amount,
        CancellationToken cancellationToken = default);
}

public class OcrExtractResult
{
    public string? Vendor { get; set; }
    public DateOnly? Date { get; set; }
    public decimal? TotalAmount { get; set; }
    public decimal? TaxAmount { get; set; }
    public List<OcrLineItem> LineItems { get; set; } = new();
}

public class OcrLineItem
{
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; }
}

public class ClassificationResult
{
    public string Category { get; set; } = string.Empty;
    public decimal? Confidence { get; set; }
    public ShapExplanation? ShapExplanation { get; set; }
    public bool NeedsReview { get; set; }
    public string? OverriddenBy { get; set; }
    public string? OriginalMlCategory { get; set; }
    public decimal? OriginalMlConfidence { get; set; }
}

public class ShapExplanation
{
    public List<ShapFeature> TopFeatures { get; set; } = new();
}

public class ShapFeature
{
    public string Feature { get; set; } = string.Empty;
    public decimal Contribution { get; set; }
}

/// <summary>
/// AI service ne non-success HTTP status diya (4xx/5xx). Retry se fayda nahi hota.
/// Application layer ise catch kar sakti hai; Infrastructure ise throw karti hai.
/// </summary>
public class AiServiceException : Exception
{
    public int StatusCode { get; }

    public AiServiceException(int statusCode, string body)
        : base($"AI service returned {statusCode}: {body}")
    {
        StatusCode = statusCode;
    }
}
public interface IAnomalyApiClient
{
    Task<AnomalyScanResponse> ScanAsync(AnomalyScanRequest request, CancellationToken ct = default);
}
public interface IPredictionApiClient
{
    Task<PredictionForecastResponse> ForecastAsync(
        PredictionForecastRequest request, CancellationToken ct = default);
}