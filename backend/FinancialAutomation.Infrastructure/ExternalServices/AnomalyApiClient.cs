using System.Net.Http.Json;
using FinancialAutomation.Application.DTOs.Anomaly;
using FinancialAutomation.Application.Interfaces;

namespace FinancialAutomation.Infrastructure.ExternalServices;

public class AnomalyApiClient : IAnomalyApiClient
{
    private readonly HttpClient _http;
    public AnomalyApiClient(HttpClient http) => _http = http;

    public async Task<AnomalyScanResponse> ScanAsync(
        AnomalyScanRequest request, CancellationToken ct = default)
    {
        for (var attempt = 1; ; attempt++)
        {
            try
            {
                using var response = await _http.PostAsJsonAsync("/internal/anomaly/scan", request, ct);

                if (response.IsSuccessStatusCode)
                    return await response.Content.ReadFromJsonAsync<AnomalyScanResponse>(cancellationToken: ct)
                           ?? new AnomalyScanResponse();

                var body = await response.Content.ReadAsStringAsync(ct);
                if ((int)response.StatusCode >= 500 && attempt == 1) continue;   // sirf 5xx par retry
                throw new AiServiceException((int)response.StatusCode, body);
            }
            catch (HttpRequestException ex)
            {
                if (attempt == 1) continue;
                throw new AiServiceException(503, ex.Message);
            }
            catch (TaskCanceledException) when (!ct.IsCancellationRequested)
            {
                if (attempt == 1) continue;
                throw new AiServiceException(504, "AI service timed out");
            }
        }
    }
}