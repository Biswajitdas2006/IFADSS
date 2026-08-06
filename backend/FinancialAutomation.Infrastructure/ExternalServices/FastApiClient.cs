using System.Net.Http.Json;
using FinancialAutomation.Application.Interfaces;

namespace FinancialAutomation.Infrastructure.ExternalServices;

public class FastApiClient : IFastApiClient
{
    public IOcrClient Ocr { get; }

    public FastApiClient(HttpClient httpClient)
    {
        Ocr = new OcrClient(httpClient);
    }
}

internal class OcrClient : IOcrClient
{
    private readonly HttpClient _httpClient;

    public OcrClient(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<OcrExtractResult> ExtractAsync(string filePath, CancellationToken cancellationToken = default)
    {
        const int maxAttempts = 2; // initial attempt + 1 retry, per Document 1 Section 22.4
        Exception? lastException = null;

        for (var attempt = 1; attempt <= maxAttempts; attempt++)
        {
            try
            {
                var response = await _httpClient.PostAsJsonAsync(
                    "/internal/ocr/extract",
                    new { filePath },
                    cancellationToken);

                response.EnsureSuccessStatusCode();

                var result = await response.Content.ReadFromJsonAsync<OcrExtractResult>(cancellationToken: cancellationToken);
                return result ?? new OcrExtractResult();
            }
            catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
            {
                lastException = ex;
                if (attempt == maxAttempts)
                    break;
            }
        }

        // Graceful degradation, per Document 1 Section 22.4:
        // caller (InvoiceService) decides how to handle this — invoice stays Pending, not a hard failure.
        throw new InvalidOperationException("AI service unreachable after retry.", lastException);
    }
}