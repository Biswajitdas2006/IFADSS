using FinancialAutomation.Application.DTOs.Anomaly;
using FinancialAutomation.Application.DTOs.Common;

namespace FinancialAutomation.Application.Interfaces;

public interface IAnomalyService
{
    Task<PagedResult<AnomalyDto>> GetAnomaliesAsync(
        Guid userId, string? severity, bool? reviewed, int page, int pageSize);

    Task<AnomalyReviewResponse> MarkReviewedAsync(Guid anomalyId, Guid userId);

    Task<int> ScanAsync(Guid userId, int windowDays);
}