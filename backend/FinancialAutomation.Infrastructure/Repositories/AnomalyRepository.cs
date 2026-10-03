using FinancialAutomation.Application.DTOs.Common;
using FinancialAutomation.Application.Interfaces;
using FinancialAutomation.Domain.Entities;
using FinancialAutomation.Domain.Enums;
using FinancialAutomation.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using FinancialAutomation.Application.DTOs.Anomaly;

namespace FinancialAutomation.Infrastructure.Repositories;

public class AnomalyRepository : IAnomalyRepository
{
    private readonly AppDbContext _db;
    public AnomalyRepository(AppDbContext db) => _db = db;

    // ---- IRepository<Anomaly> base ----
    public async Task<Anomaly?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        => await _db.Anomalies.FirstOrDefaultAsync(a => a.Id == id, cancellationToken);

    public async Task<IReadOnlyList<Anomaly>> GetAllAsync(CancellationToken cancellationToken = default)
        => await _db.Anomalies.AsNoTracking().ToListAsync(cancellationToken);

    public async Task AddAsync(Anomaly entity, CancellationToken cancellationToken = default)
    {
        await _db.Anomalies.AddAsync(entity, cancellationToken);
        await _db.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateAsync(Anomaly entity, CancellationToken cancellationToken = default)
    {
        _db.Anomalies.Update(entity);
        await _db.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(Anomaly entity, CancellationToken cancellationToken = default)
    {
        _db.Anomalies.Remove(entity);
        await _db.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(Guid id)
    {
        var e = await _db.Anomalies.FindAsync(id);
        if (e is null) return;
        _db.Anomalies.Remove(e);
        await _db.SaveChangesAsync();
    }

    // ---- Custom ----
    public async Task<PagedResult<Anomaly>> GetPagedByUserAsync(
        Guid userId, AnomalySeverity? severity, bool? reviewed, int page, int pageSize)
    {
        // Anomalies me UserId nahi hai -> Transaction se ownership
        var query = _db.Anomalies
            .AsNoTracking()
            .Where(a => a.Transaction != null && a.Transaction.UserId == userId);

        if (severity is not null) query = query.Where(a => a.Severity == severity);
        if (reviewed is not null) query = query.Where(a => a.Reviewed == reviewed);

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(a => a.DetectedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<Anomaly>(items, page, pageSize, total);
    }

    public async Task<Anomaly?> GetByIdForUserAsync(Guid id, Guid userId)
        => await _db.Anomalies
            .FirstOrDefaultAsync(a => a.Id == id && a.Transaction != null && a.Transaction.UserId == userId);

    public async Task MarkReviewedAsync(Guid id)
    {
        var a = await _db.Anomalies.FindAsync(id);
        if (a is null) return;
        a.MarkReviewed();
        await _db.SaveChangesAsync();
    }

    public async Task BulkInsertAsync(IEnumerable<Anomaly> anomalies)
    {
        _db.Anomalies.AddRange(anomalies);
        await _db.SaveChangesAsync();
    }

    public async Task<HashSet<Guid>> GetOwnedTransactionIdsAsync(
        Guid userId, IEnumerable<Guid> transactionIds)
    {
        var ids = transactionIds.ToList();
        var owned = await _db.Transactions
            .Where(t => t.UserId == userId && ids.Contains(t.Id))
            .Select(t => t.Id)
            .ToListAsync();
        return owned.ToHashSet();
    }

    public async Task<HashSet<Guid>> GetExistingTransactionIdsAsync(IEnumerable<Guid> transactionIds)
    {
        var ids = transactionIds.ToList();
        var existing = await _db.Anomalies
            .Where(a => ids.Contains(a.TransactionId))
            .Select(a => a.TransactionId)
            .ToListAsync();
        return existing.ToHashSet();
    }
}