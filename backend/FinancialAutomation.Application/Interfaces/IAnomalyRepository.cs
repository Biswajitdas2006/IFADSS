using FinancialAutomation.Application.DTOs.Common;
using FinancialAutomation.Domain.Entities;
using FinancialAutomation.Domain.Enums;

namespace FinancialAutomation.Application.Interfaces;

public interface IAnomalyRepository : IRepository<Anomaly>
{
    Task<PagedResult<Anomaly>> GetPagedByUserAsync(
        Guid userId, AnomalySeverity? severity, bool? reviewed, int page, int pageSize);

    Task<Anomaly?> GetByIdForUserAsync(Guid id, Guid userId);
    Task MarkReviewedAsync(Guid id);
    Task BulkInsertAsync(IEnumerable<Anomaly> anomalies);
    Task<HashSet<Guid>> GetOwnedTransactionIdsAsync(Guid userId, IEnumerable<Guid> transactionIds);
    Task<HashSet<Guid>> GetExistingTransactionIdsAsync(IEnumerable<Guid> transactionIds);
}