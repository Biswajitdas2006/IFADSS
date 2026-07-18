using FinancialAutomation.Domain.Common;
using FinancialAutomation.Domain.Enums;

namespace FinancialAutomation.Domain.Entities;

public class Prediction : BaseEntity
{
    public Guid UserId { get; private set; }
    public User? User { get; private set; }

    public MetricType MetricType { get; private set; }
    public DateOnly ForecastDate { get; private set; }
    public decimal PredictedValue { get; private set; }
    public decimal? LowerBound { get; private set; }
    public decimal? UpperBound { get; private set; }
    public DateTime GeneratedAt { get; private set; } = DateTime.UtcNow;

    private Prediction() { } // Required by EF Core

    public Prediction(Guid userId, MetricType metricType, DateOnly forecastDate,
        decimal predictedValue, decimal? lowerBound = null, decimal? upperBound = null)
    {
        if (userId == Guid.Empty)
            throw new ArgumentException("UserId cannot be empty.", nameof(userId));
        if (lowerBound.HasValue && upperBound.HasValue && lowerBound > upperBound)
            throw new ArgumentException("LowerBound cannot be greater than UpperBound.");

        UserId = userId;
        MetricType = metricType;
        ForecastDate = forecastDate;
        PredictedValue = predictedValue;
        LowerBound = lowerBound;
        UpperBound = upperBound;
    }
}