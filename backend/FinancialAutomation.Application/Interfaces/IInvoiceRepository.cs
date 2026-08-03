using FinancialAutomation.Domain.Entities;

namespace FinancialAutomation.Application.Interfaces;

public interface IInvoiceRepository : IRepository<Invoice>
{
    Task<(IReadOnlyList<Invoice> Items, int TotalItems)> GetByUserAsync(
        Guid userId, string? status, int page, int pageSize, CancellationToken cancellationToken = default);

    Task<Invoice?> GetByIdWithTransactionsAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);
}