using FinancialAutomation.Domain.Entities;

namespace FinancialAutomation.Application.Interfaces;

public interface IPredictionRepository : IRepository<Prediction>
{
    Task<List<Prediction>> GetLatestByMetricAsync(Guid userId, string metricType, DateOnly fromDate);
    Task UpsertForecastBatchAsync(IEnumerable<Prediction> points);
}