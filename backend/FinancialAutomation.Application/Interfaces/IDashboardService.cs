using FinancialAutomation.Application.DTOs.Dashboard;

namespace FinancialAutomation.Application.Interfaces;

public interface IDashboardService
{
    Task<DashboardSummaryDto> GetSummaryAsync(Guid userId, string? from, string? to, bool includeAnomalies);
}
