using FinancialAutomation.Application.DTOs.Transaction;

namespace FinancialAutomation.Application.Interfaces;

public interface ITransactionService
{
    Task<TransactionListResponseDto> GetListAsync(
        Guid userId, string? category, DateOnly? from, DateOnly? to,
        int page, int pageSize, CancellationToken cancellationToken = default);
    Task<UpdateCategoryResponseDto> UpdateCategoryAsync(
    Guid userId, Guid transactionId, string category, CancellationToken cancellationToken = default);// newly added for the UpdateCategoryAsync method
}