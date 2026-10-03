using FinancialAutomation.Domain.Entities;

namespace FinancialAutomation.Application.Interfaces;

public interface ITransactionRepository : IRepository<Transaction>
{
    Task<(IReadOnlyList<Transaction> Items, int TotalItems)> GetByUserAsync(
        Guid userId, string? category, DateOnly? from, DateOnly? to,
        int page, int pageSize, CancellationToken cancellationToken = default);
}