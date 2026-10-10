using System.Collections.Concurrent;
using FinancialAutomation.Application.DTOs.Prediction;
using FinancialAutomation.Application.Interfaces;
using FinancialAutomation.Domain.Entities;
using FinancialAutomation.Domain.Exceptions;
using Microsoft.Extensions.Logging;

namespace FinancialAutomation.Application.Services;

public class PredictionService : IPredictionService
{
    private static readonly string[] ValidMetrics = { "Revenue", "Expense", "CashFlow" };
    private const int MaxHorizonDays = 90;
    private const int HistoryLookbackDays = 365;
    private const int MinActiveDays = 3;
    private static readonly TimeSpan MaxAge = TimeSpan.FromHours(24);

    private static readonly ConcurrentDictionary<string, SemaphoreSlim> Gates = new();

    private readonly IPredictionRepository _predictions;
    private readonly ITransactionRepository _transactions;
    private readonly IPredictionApiClient _aiClient;
    private readonly ILogger<PredictionService> _logger;

    public PredictionService(
        IPredictionRepository predictions,
        ITransactionRepository transactions,
        IPredictionApiClient aiClient,
        ILogger<PredictionService> logger)
    {
        _predictions = predictions;
        _transactions = transactions;
        _aiClient = aiClient;
        _logger = logger;
    }

    public async Task<ForecastResponse> GetForecastAsync(Guid userId, string metricType, int horizonDays)
    {
        if (!ValidMetrics.Contains(metricType))
            throw new ValidationException("metricType", "metricType must be Revenue, Expense or CashFlow");

        if (horizonDays is < 1 or > MaxHorizonDays)
            throw new ValidationException("horizonDays", $"horizonDays must be between 1 and {MaxHorizonDays}");

        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var stored = await _predictions.GetLatestByMetricAsync(userId, metricType, today);
        if (!IsStale(stored, horizonDays))
        {
            _logger.LogInformation("Forecast served from cache: user={User} metric={Metric}", userId, metricType);
            return ToResponse(metricType, stored, horizonDays);
        }

        var gate = Gates.GetOrAdd($"{userId}:{metricType}", _ => new SemaphoreSlim(1, 1));
        await gate.WaitAsync();
        try
        {
            stored = await _predictions.GetLatestByMetricAsync(userId, metricType, today);
            if (IsStale(stored, horizonDays))
            {
                await RefreshAsync(userId, metricType, horizonDays, today);
                stored = await _predictions.GetLatestByMetricAsync(userId, metricType, today);
            }
        }
        finally
        {
            gate.Release();
        }

        return ToResponse(metricType, stored, horizonDays);
    }

    private static bool IsStale(List<Prediction> stored, int horizonDays)
        => stored.Count < horizonDays ||
           stored.Count == 0 ||
           DateTime.UtcNow - stored.Max(p => p.GeneratedAt) > MaxAge;

    private async Task RefreshAsync(Guid userId, string metricType, int horizonDays, DateOnly today)
    {
        var from = today.AddDays(-HistoryLookbackDays);
        var rows = await _transactions.GetAmountsByDateAsync(userId, from, today);
        var history = BuildDailySeries(rows, metricType, today);

        if (history.Count(p => p.Value != 0) < MinActiveDays)
            throw new InsufficientDataException(
                $"Not enough history to forecast {metricType}: at least {MinActiveDays} days with activity are needed.");

        var response = await _aiClient.ForecastAsync(
            new PredictionForecastRequest(userId, metricType, horizonDays, history));

        var now = DateTime.UtcNow;
        var metric = Enum.Parse<FinancialAutomation.Domain.Enums.MetricType>(metricType);

        var points = response.Forecast
            .Where(p => DateOnly.FromDateTime(p.Date) >= today)
            .GroupBy(p => DateOnly.FromDateTime(p.Date))
            .Select(g => g.First())
            .OrderBy(p => p.Date)
            .Take(horizonDays)
            .Select(p => new Prediction(
                userId,
                metric,
                DateOnly.FromDateTime(p.Date),
                Math.Round(p.Predicted, 2),
                p.LowerBound is null ? null : Math.Round(p.LowerBound.Value, 2),
                p.UpperBound is null ? null : Math.Round(p.UpperBound.Value, 2)))
            .ToList();

        foreach (var p in points)
        {
            p.SetGeneratedAt(now);
        }

        if (points.Count == 0)
            throw new AiServiceException(502, "AI service returned an empty forecast");

        await _predictions.UpsertForecastBatchAsync(points);

        _logger.LogInformation(
            "Forecast refreshed: user={User} metric={Metric} history={History} points={Points}",
            userId,
            metricType,
            history.Count,
            points.Count);
    }

    private static List<PredictionHistoryPoint> BuildDailySeries(
        IEnumerable<TransactionAmountRow> rows,
        string metricType,
        DateOnly today)
    {
        var byDate = rows
            .GroupBy(r => r.Date)
            .ToDictionary(g => g.Key, g => MetricValue(metricType, g.Select(x => x.Amount)));

        if (byDate.Count == 0)
            return new List<PredictionHistoryPoint>();

        var series = new List<PredictionHistoryPoint>();
        var start = byDate.Keys.Min();
        for (var d = start; d <= today; d = d.AddDays(1))
        {
            series.Add(new PredictionHistoryPoint(d, byDate.TryGetValue(d, out var v) ? v : 0m));
        }

        return series;
    }

    private static decimal MetricValue(string metricType, IEnumerable<decimal> amounts)
    {
        var list = amounts.ToList();
        return metricType switch
        {
            "Revenue" => list.Where(a => a > 0).Sum(),
            "Expense" => -list.Where(a => a < 0).Sum(),
            _ => list.Sum()
        };
    }

    private static ForecastResponse ToResponse(string metricType, List<Prediction> stored, int horizonDays)
        => new()
        {
            MetricType = metricType,
            GeneratedAt = stored.Max(p => p.GeneratedAt),
            Forecast = stored
                .OrderBy(p => p.ForecastDate)
                .Take(horizonDays)
                .Select(p => new ForecastPointDto
                {
                    Date = p.ForecastDate,
                    Predicted = p.PredictedValue,
                    LowerBound = p.LowerBound,
                    UpperBound = p.UpperBound
                })
                .ToList()
        };
}