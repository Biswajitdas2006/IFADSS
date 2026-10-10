using FinancialAutomation.Application.Interfaces;
using FinancialAutomation.Domain.Entities;
using FinancialAutomation.Domain.Enums;
using FinancialAutomation.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FinancialAutomation.Infrastructure.Repositories;

public class PredictionRepository : Repository<Prediction>, IPredictionRepository
{
    public PredictionRepository(AppDbContext context) : base(context) { }

    public async Task<List<Prediction>> GetLatestByMetricAsync(Guid userId, string metricType, DateOnly fromDate)
    {
        var metric = Enum.Parse<MetricType>(metricType, ignoreCase: true);

        return await _dbSet
            .AsNoTracking()
            .Where(p => p.UserId == userId && p.MetricType == metric && p.ForecastDate >= fromDate)
            .OrderByDescending(p => p.GeneratedAt)
            .ThenByDescending(p => p.ForecastDate)
            .ToListAsync();
    }

    public async Task UpsertForecastBatchAsync(IEnumerable<Prediction> points)
    {
        var items = points.ToList();
        if (items.Count == 0)
            return;

        foreach (var item in items)
        {
            var existing = await _dbSet.FirstOrDefaultAsync(p =>
                p.UserId == item.UserId &&
                p.MetricType == item.MetricType &&
                p.ForecastDate == item.ForecastDate);

            if (existing is null)
            {
                await _dbSet.AddAsync(item);
                continue;
            }

            _context.Entry(existing).CurrentValues.SetValues(new
            {
                PredictedValue = item.PredictedValue,
                LowerBound = item.LowerBound,
                UpperBound = item.UpperBound,
                GeneratedAt = DateTime.UtcNow,
            });
        }

        await _context.SaveChangesAsync();
    }
}
