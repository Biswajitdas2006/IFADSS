using FinancialAutomation.Application.DTOs.Prediction;

namespace FinancialAutomation.Application.Interfaces;

public interface IPredictionService
{
    Task<ForecastResponse> GetForecastAsync(Guid userId, string metricType, int horizonDays);
}