using AutoMapper;

using FinancialAutomation.Application.DTOs.Anomaly;

using FinancialAutomation.Application.DTOs.Common;

using FinancialAutomation.Application.Interfaces;

using FinancialAutomation.Domain.Entities;

using FinancialAutomation.Domain.Enums;

using FinancialAutomation.Domain.Exceptions;

using Microsoft.Extensions.Logging;

namespace FinancialAutomation.Application.Services;

public class AnomalyService : IAnomalyService
{
    private readonly IAnomalyRepository _anomalies;
    private readonly IMapper _mapper;
    private readonly IAnomalyApiClient _aiClient;
    private readonly ILogger<AnomalyService> _logger;

    public AnomalyService(
        IAnomalyRepository anomalies,
        IMapper mapper,
        IAnomalyApiClient aiClient,
        ILogger<AnomalyService> logger)
    {
        _anomalies = anomalies;
        _mapper = mapper;
        _aiClient = aiClient;
        _logger = logger;
    }

    public async Task<PagedResult<AnomalyDto>> GetAnomaliesAsync(
        Guid userId,
        string? severity,
        bool? reviewed,
        int page,
        int pageSize)
    {
        AnomalySeverity? parsed = null;

        if (!string.IsNullOrWhiteSpace(severity))
        {
            if (!Enum.TryParse<AnomalySeverity>(
                    severity,
                    ignoreCase: false,
                    out var s))
            {
                throw new ValidationException(
                    "Severity",
                    "Severity must be Low, Medium or High");
            }

            parsed = s;
        }

        page = Math.Max(page, 1);

        pageSize = Math.Clamp(pageSize, 1, 100);
        // Doc 4 §1.4: max 100

        var result = await _anomalies.GetPagedByUserAsync(
            userId,
            parsed,
            reviewed,
            page,
            pageSize);

        var dtos = _mapper.Map<List<AnomalyDto>>(
            result.Items);

        return new PagedResult<AnomalyDto>(
            dtos,
            result.Page,
            result.PageSize,
            result.TotalItems);
    }

    public Task<AnomalyReviewResponse> MarkReviewedAsync(
        Guid anomalyId,
        Guid userId)
        => throw new NotImplementedException();

    public async Task<int> ScanAsync(Guid userId, int windowDays)
    {
        if (windowDays is < 1 or > 365)
            throw new ValidationException(
                "windowDays",
                "windowDays must be between 1 and 365");

        var result = await _aiClient.ScanAsync(new AnomalyScanRequest(userId, windowDays));
        if (result.Anomalies.Count == 0) return 0;

        var valid = new Dictionary<Guid, (AnomalyScanItem Item, AnomalySeverity Severity)>();
        foreach (var item in result.Anomalies)
        {
            if (item.AnomalyScore is < 0 or > 1 ||
                !Enum.TryParse<AnomalySeverity>(item.Severity, ignoreCase: true, out var severity))
            {
                _logger.LogWarning(
                    "Skipping invalid anomaly: tx={Tx} score={Score} severity={Sev}",
                    item.TransactionId,
                    item.AnomalyScore,
                    item.Severity);
                continue;
            }

            if (!valid.TryGetValue(item.TransactionId, out var existing) ||
                item.AnomalyScore > existing.Item.AnomalyScore)
                valid[item.TransactionId] = (item, severity);
        }

        var ids = valid.Keys.ToList();
        var owned = await _anomalies.GetOwnedTransactionIdsAsync(userId, ids);
        var already = await _anomalies.GetExistingTransactionIdsAsync(ids);

        var toInsert = valid
            .Where(kv => owned.Contains(kv.Key) && !already.Contains(kv.Key))
            .Select(kv => new Anomaly(
                kv.Key,
                kv.Value.Item.AnomalyScore,
                Truncate(kv.Value.Item.Reason, 500),
                kv.Value.Severity))
            .ToList();

        if (toInsert.Count > 0)
            await _anomalies.BulkInsertAsync(toInsert);

        _logger.LogInformation(
            "Anomaly scan for {User}: {Received} received, {Valid} valid, {Saved} new saved",
            userId,
            result.Anomalies.Count,
            valid.Count,
            toInsert.Count);

        return toInsert.Count;
    }

    private static string Truncate(string? value, int max)
    {
        if (string.IsNullOrWhiteSpace(value)) return "Flagged as unusual by the anomaly model";
        return value.Length <= max ? value : value[..max];
    }
}
