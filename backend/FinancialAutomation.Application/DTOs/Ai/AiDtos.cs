namespace FinancialAutomation.Application.DTOs.Ai;

// ---- Classify ----
public record ClassifyRequest(string Description, decimal Amount);
public record ShapFeatureDto(string Feature, double Contribution);
public record ShapExplanationDto(List<ShapFeatureDto> TopFeatures);
public record ClassifyResult(
    string Category,
    double? Confidence,              // nullable hai schema mein
    ShapExplanationDto ShapExplanation,
    string? OverriddenBy,
    string? OriginalMlCategory,
    double? OriginalMlConfidence,
    bool NeedsReview);

// ---- OCR ----
public record OcrLineItem(string Description, decimal Amount);
public record OcrResult(
    string? VendorName,
    string? InvoiceDate,             // string aata hai, parse tum karoge
    decimal? TotalAmount,
    decimal? TaxAmount,
    List<OcrLineItem> LineItems);

// ---- Anomaly ----
public record AiTransaction(string Id, string Description, decimal Amount, string TransactionDate);
public record AnomalyScanRequest(List<AiTransaction> Transactions);
public record AnomalyResult(string TransactionId, double AnomalyScore, string Reason, string Severity);
public record AnomalyScanResponse(List<AnomalyResult> Anomalies);

// ---- Forecast ----
public record ForecastRequest(string MetricType, int HorizonDays = 30);
public record ForecastPointResult(string Date, decimal Predicted, decimal LowerBound, decimal UpperBound);
public record ForecastResponse(List<ForecastPointResult> Forecast);