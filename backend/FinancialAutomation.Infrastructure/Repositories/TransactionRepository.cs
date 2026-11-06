using FinancialAutomation.Application.DTOs.Dashboard;
using FinancialAutomation.Application.DTOs.Prediction;
using FinancialAutomation.Application.Interfaces;
using FinancialAutomation.Domain.Entities;
using FinancialAutomation.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FinancialAutomation.Infrastructure.Repositories;

public class TransactionRepository : Repository<Transaction>, ITransactionRepository
{
    public TransactionRepository(AppDbContext context) : base(context) { }

    public async Task<DashboardTotals> GetTotalsAsync(Guid userId, DateOnly from, DateOnly to)
    {
        var query = _dbSet
            .AsNoTracking()
            .Where(t => t.UserId == userId && t.TransactionDate >= from && t.TransactionDate <= to);

        var income = await query
            .Where(t => t.Amount > 0)
            .SumAsync(t => (decimal?)t.Amount) ?? 0m;
        var expense = await query
            .Where(t => t.Amount < 0)
            .SumAsync(t => (decimal?)t.Amount) ?? 0m;

        return new DashboardTotals(income, -expense);
    }

    public async Task<List<CategorySpendDto>> GetTopCategoriesAsync(
        Guid userId, DateOnly from, DateOnly to, int top)
        => await _dbSet
            .AsNoTracking()
            .Where(t => t.UserId == userId &&
                        t.TransactionDate >= from &&
                        t.TransactionDate <= to &&
                        t.Amount < 0)
            .GroupBy(t => t.Category ?? "Uncategorised")
            .Select(group => new CategorySpendDto(group.Key, -group.Sum(t => t.Amount)))
            .OrderByDescending(category => category.Amount)
            .Take(top)
            .ToListAsync();

    public async Task<(IReadOnlyList<Transaction> Items, int TotalItems)> GetByUserAsync(
        Guid userId, string? category, DateOnly? from, DateOnly? to,
        int page, int pageSize, CancellationToken cancellationToken = default)
    {
        var query = _dbSet.Where(t => t.UserId == userId);

        if (!string.IsNullOrWhiteSpace(category))
            query = query.Where(t => t.Category == category);
        if (from is not null)
            query = query.Where(t => t.TransactionDate >= from);
        if (to is not null)
            query = query.Where(t => t.TransactionDate <= to);

        var totalItems = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(t => t.TransactionDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        return (items, totalItems);
    }

    public async Task<IReadOnlyList<Transaction>> GetForAnomalyScanAsync(
        Guid userId, DateOnly from, DateOnly to, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(t => t.UserId == userId &&
                        t.TransactionDate >= from &&
                        t.TransactionDate <= to)
            .OrderBy(t => t.TransactionDate)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<List<TransactionAmountRow>> GetAmountsByDateAsync(Guid userId, DateOnly from, DateOnly to)
    {
        return await _dbSet
            .AsNoTracking()
            .Where(t => t.UserId == userId && t.TransactionDate >= from && t.TransactionDate <= to)
            .Select(t => new TransactionAmountRow(t.TransactionDate, t.Amount))
            .ToListAsync();
    }

    public async Task<List<Transaction>> GetForScanAsync(Guid userId, DateOnly from, DateOnly to, int maxRows)
    {
        return await _dbSet
            .AsNoTracking()
            .Where(t => t.UserId == userId && t.TransactionDate >= from && t.TransactionDate <= to)
            .OrderByDescending(t => t.TransactionDate)
            .Take(maxRows)
            .ToListAsync();
    }
}