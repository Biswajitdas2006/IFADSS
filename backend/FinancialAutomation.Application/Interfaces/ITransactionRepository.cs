using FinancialAutomation.Application.DTOs.Prediction;
using FinancialAutomation.Domain.Entities;

namespace FinancialAutomation.Application.Interfaces;

public interface ITransactionRepository : IRepository<Transaction>
{
    Task<(IReadOnlyList<Transaction> Items, int TotalItems)> GetByUserAsync(
        Guid userId, string? category, DateOnly? from, DateOnly? to,
        int page, int pageSize, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Transaction>> GetForAnomalyScanAsync(
        Guid userId, DateOnly from, DateOnly to, CancellationToken cancellationToken = default);

    Task<List<TransactionAmountRow>> GetAmountsByDateAsync(Guid userId, DateOnly from, DateOnly to);

    Task<List<Transaction>> GetForScanAsync(Guid userId, DateOnly from, DateOnly to, int maxRows);
}