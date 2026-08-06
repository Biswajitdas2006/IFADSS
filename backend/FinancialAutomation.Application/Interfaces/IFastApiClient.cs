namespace FinancialAutomation.Application.Interfaces;

public interface IFastApiClient
{
    IOcrClient Ocr { get; }
}

public interface IOcrClient
{
    Task<OcrExtractResult> ExtractAsync(string filePath, CancellationToken cancellationToken = default);
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