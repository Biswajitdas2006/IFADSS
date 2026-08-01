using FinancialAutomation.Application.Interfaces;
using FinancialAutomation.Domain.Entities;
using FinancialAutomation.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FinancialAutomation.Infrastructure.Repositories;

public class InvoiceRepository : Repository<Invoice>, IInvoiceRepository
{
    public InvoiceRepository(AppDbContext context) : base(context) { }

    public async Task<(IReadOnlyList<Invoice> Items, int TotalItems)> GetByUserAsync(
        Guid userId, string? status, int page, int pageSize, CancellationToken cancellationToken = default)
    {
        var query = _dbSet.Where(i => i.UserId == userId);

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(i => i.Status.ToString() == status);

        var totalItems = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(i => i.UploadedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        return (items, totalItems);
    }

    public async Task<Invoice?> GetByIdWithTransactionsAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(i => i.Transactions)
            .FirstOrDefaultAsync(i => i.Id == id && i.UserId == userId, cancellationToken);
    }
}