using System.Globalization;
using FinancialAutomation.Application.DTOs.Dashboard;
using FinancialAutomation.Application.Interfaces;
using FinancialAutomation.Domain.Exceptions;

namespace FinancialAutomation.Application.Services;

public class DashboardService : IDashboardService
{
    private const int TopCategoryCount = 5;

    private readonly ITransactionRepository _transactions;
    private readonly IAnomalyRepository _anomalies;

    public DashboardService(ITransactionRepository transactions, IAnomalyRepository anomalies)
    {
        _transactions = transactions;
        _anomalies = anomalies;
    }

    public async Task<DashboardSummaryDto> GetSummaryAsync(
        Guid userId, string? from, string? to, bool includeAnomalies)
    {
        var (fromDate, toDate) = ResolveRange(from, to);

        var totals = await _transactions.GetTotalsAsync(userId, fromDate, toDate);
        var topCategories = await _transactions.GetTopCategoriesAsync(
            userId, fromDate, toDate, TopCategoryCount);
        int? openAnomalies = includeAnomalies
            ? await _anomalies.CountOpenAsync(userId)
            : null;

        return new DashboardSummaryDto
        {
            TotalIncome = totals.Income,
            TotalExpense = totals.Expense,
            NetCashFlow = totals.Income - totals.Expense,
            OpenAnomalies = openAnomalies,
            TopCategories = topCategories,
            From = fromDate,
            To = toDate
        };
    }

    private static (DateOnly From, DateOnly To) ResolveRange(string? from, string? to)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var monthStart = new DateOnly(today.Year, today.Month, 1);
        var monthEnd = monthStart.AddMonths(1).AddDays(-1);

        var fromDate = ParseDate(from, "from") ?? monthStart;
        var toDate = ParseDate(to, "to") ?? monthEnd;

        if (fromDate > toDate)
            throw new ValidationException("from", "'from' must not be after 'to'");

        return (fromDate, toDate);
    }

    private static DateOnly? ParseDate(string? value, string name)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        if (!DateOnly.TryParseExact(
                value,
                "yyyy-MM-dd",
                CultureInfo.InvariantCulture,
                DateTimeStyles.None,
                out var date))
        {
            throw new ValidationException(name, $"'{name}' must be a date in yyyy-MM-dd format");
        }

        return date;
    }
}
