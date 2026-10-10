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
    private readonly ITransactionRepository _transactions;
    private readonly IMapper _mapper;
    private readonly IAnomalyApiClient _aiClient;
    private readonly ILogger<AnomalyService> _logger;

    public AnomalyService(
        IAnomalyRepository anomalies,
        ITransactionRepository transactions,
        IMapper mapper,
        IAnomalyApiClient aiClient,
        ILogger<AnomalyService> logger)
    {
        _anomalies = anomalies;
        _transactions = transactions;
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

    public async Task<AnomalyReviewResponse> MarkReviewedAsync(
        Guid anomalyId,
        Guid userId)
    {
        var anomaly = await _anomalies.GetByIdForUserAsync(
            anomalyId,
            userId)
            ?? throw new NotFoundException(
                nameof(Anomaly),
                anomalyId);

        if (!anomaly.Reviewed)
            await _anomalies.MarkReviewedAsync(anomalyId);

        return new AnomalyReviewResponse
        {
            Id = anomaly.Id,
            Reviewed = true,
            ReviewedAt = anomaly.ReviewedAt ?? DateTime.UtcNow
        };
    }

    public async Task<int> ScanAsync(
        Guid userId,
        int windowDays)
    {
        if (windowDays is < 1 or > 365)
        {
            throw new ValidationException(
                "windowDays",
                "windowDays must be between 1 and 365");
        }

        // ---------------------------------------------------------
        // 1. Calculate analysis window
        // ---------------------------------------------------------

        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var from = today.AddDays(-(windowDays - 1));
        var to = today;

        // ---------------------------------------------------------
        // 2. Fetch ALL transactions for this user/window
        // ---------------------------------------------------------

        const int pageSize = 100;
        var page = 1;

        var transactions = new List<Transaction>();

        while (true)
        {
            var (items, totalItems) =
                await _transactions.GetByUserAsync(
                    userId,
                    category: null,
                    from,
                    to,
                    page,
                    pageSize);

            transactions.AddRange(items);

            if (transactions.Count >= totalItems ||
                items.Count == 0)
            {
                break;
            }

            page++;
        }

        _logger.LogInformation(
            "Preparing anomaly scan for {User}: {Count} transactions from {From} to {To}",
            userId,
            transactions.Count,
            from,
            to);

        // ---------------------------------------------------------
        // 3. Nothing to analyze
        // ---------------------------------------------------------

        if (transactions.Count == 0)
        {
            _logger.LogInformation(
                "No transactions found for anomaly scan: user={User}",
                userId);

            return 0;
        }

        // ---------------------------------------------------------
        // 4. Build FastAPI request
        // ---------------------------------------------------------

        var request = new AnomalyScanRequest
        {
            Transactions = transactions
                .Select(t => new AnomalyScanTransaction
                {
                    Id = t.Id,
                    Description = t.Description,
                    Amount = t.Amount,
                    TransactionDate = t.TransactionDate
                })
                .ToList()
        };

        // ---------------------------------------------------------
        // 5. Send transactions to Isolation Forest
        // ---------------------------------------------------------

        var result = await _aiClient.ScanAsync(request);

        if (result.Anomalies.Count == 0)
        {
            _logger.LogInformation(
                "Anomaly scan completed: no anomalies detected for {User}",
                userId);

            return 0;
        }

        // ---------------------------------------------------------
        // 6. Validate and deduplicate AI results
        // ---------------------------------------------------------

        var valid =
            new Dictionary<Guid, (AnomalyScanItem Item, AnomalySeverity Severity)>();

        foreach (var item in result.Anomalies)
        {
            if (item.AnomalyScore is < 0 or > 1 ||
                !Enum.TryParse<AnomalySeverity>(
                    item.Severity,
                    ignoreCase: true,
                    out var severity))
            {
                _logger.LogWarning(
                    "Skipping invalid anomaly: tx={Tx} score={Score} severity={Sev}",
                    item.TransactionId,
                    item.AnomalyScore,
                    item.Severity);

                continue;
            }

            if (item.TransactionId == Guid.Empty)
            {
                _logger.LogWarning(
                    "Skipping anomaly with empty transaction ID");

                continue;
            }

            if (!valid.TryGetValue(
                    item.TransactionId,
                    out var existing) ||
                item.AnomalyScore > existing.Item.AnomalyScore)
            {
                valid[item.TransactionId] =
                    (item, severity);
            }
        }

        if (valid.Count == 0)
            return 0;

        // ---------------------------------------------------------
        // 7. Security check:
        //    Only save anomalies belonging to this user
        // ---------------------------------------------------------

        var ids = valid.Keys.ToList();

        var owned =
            await _anomalies.GetOwnedTransactionIdsAsync(
                userId,
                ids);

        var already =
            await _anomalies.GetExistingTransactionIdsAsync(
                ids);

        // ---------------------------------------------------------
        // 8. Create new Anomaly entities
        // ---------------------------------------------------------

        var toInsert = valid
            .Where(kv =>
                owned.Contains(kv.Key) &&
                !already.Contains(kv.Key))
            .Select(kv =>
                new Anomaly(
                    kv.Key,
                    kv.Value.Item.AnomalyScore,
                    Truncate(
                        kv.Value.Item.Reason,
                        500),
                    kv.Value.Severity))
            .ToList();

        // ---------------------------------------------------------
        // 9. Persist
        // ---------------------------------------------------------

        if (toInsert.Count > 0)
        {
            await _anomalies.BulkInsertAsync(toInsert);
        }

        _logger.LogInformation(
            "Anomaly scan for {User}: {Received} received, {Valid} valid, {Saved} new saved",
            userId,
            result.Anomalies.Count,
            valid.Count,
            toInsert.Count);

        return toInsert.Count;
    }

    private static string Truncate(
        string? value,
        int max)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return "Flagged as unusual by the anomaly model";
        }

        return value.Length <= max
            ? value
            : value[..max];
    }
}