// using FinancialAutomation.Application.DTOs.Transaction;
// using FinancialAutomation.Application.Interfaces;

// namespace FinancialAutomation.Application.Services;

// public class TransactionService : ITransactionService
// {
//     private readonly ITransactionRepository _transactionRepository;

//     public TransactionService(ITransactionRepository transactionRepository)
//     {
//         _transactionRepository = transactionRepository;
//     }

//     public async Task<TransactionListResponseDto> GetListAsync(
//         Guid userId, string? category, DateOnly? from, DateOnly? to,
//         int page, int pageSize, CancellationToken cancellationToken = default)
//     {
//         page = page < 1 ? 1 : page;
//         pageSize = pageSize is < 1 or > 100 ? 20 : pageSize;

//         var (items, totalItems) = await _transactionRepository.GetByUserAsync(
//             userId, category, from, to, page, pageSize, cancellationToken);

//         return new TransactionListResponseDto
//         {
//             Items = items.Select(t => new TransactionDto
//             {
//                 Id = t.Id,
//                 InvoiceId = t.InvoiceId,
//                 Description = t.Description,
//                 Amount = t.Amount,
//                 TransactionDate = t.TransactionDate,
//                 Category = t.Category,
//                 CategoryConfidence = t.CategoryConfidence,
//                 OverriddenByUser = t.OverriddenByUser
//             }).ToList(),
//             Page = page,
//             PageSize = pageSize,
//             TotalItems = totalItems,
//             TotalPages = (int)Math.Ceiling(totalItems / (double)pageSize)
//         };
//     }
// } 
// updated based on the user manual update 
using FinancialAutomation.Application.DTOs.Transaction;
using FinancialAutomation.Application.Interfaces;
using FinancialAutomation.Domain.Constants;
using FinancialAutomation.Domain.Entities;
using FinancialAutomation.Domain.Exceptions;

namespace FinancialAutomation.Application.Services;

public class TransactionService : ITransactionService
{
    private readonly ITransactionRepository _transactionRepository;

    public TransactionService(ITransactionRepository transactionRepository)
    {
        _transactionRepository = transactionRepository;
    }

    public async Task<TransactionListResponseDto> GetListAsync(
        Guid userId,
        string? category,
        DateOnly? from,
        DateOnly? to,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        page = page < 1 ? 1 : page;
        pageSize = pageSize is < 1 or > 100 ? 20 : pageSize;

        var (items, totalItems) = await _transactionRepository.GetByUserAsync(
            userId,
            category,
            from,
            to,
            page,
            pageSize,
            cancellationToken);

        return new TransactionListResponseDto
        {
            Items = items.Select(t => new TransactionDto
            {
                Id = t.Id,
                InvoiceId = t.InvoiceId,
                Description = t.Description,
                Amount = t.Amount,
                TransactionDate = t.TransactionDate,
                Category = t.Category,
                CategoryConfidence = t.CategoryConfidence,
                OverriddenByUser = t.OverriddenByUser
            }).ToList(),

            Page = page,
            PageSize = pageSize,
            TotalItems = totalItems,
            TotalPages = (int)Math.Ceiling(totalItems / (double)pageSize)
        };
    }

    public async Task<UpdateCategoryResponseDto> UpdateCategoryAsync(
        Guid userId,
        Guid transactionId,
        string category,
        CancellationToken cancellationToken = default)
    {
        if (!TransactionCategories.IsValid(category))
        {
            throw new ValidationException(
                "category",
                $"Category must be one of: {string.Join(", ", TransactionCategories.All)}");
        }

        var transaction = await _transactionRepository.GetByIdAsync(
            transactionId,
            cancellationToken);

        if (transaction is null || transaction.UserId != userId)
        {
            throw new NotFoundException(
                nameof(Transaction),
                transactionId);
        }

        transaction.OverrideCategory(category);

        await _transactionRepository.UpdateAsync(
            transaction,
            cancellationToken);

        return new UpdateCategoryResponseDto
        {
            Id = transaction.Id,
            Category = transaction.Category!,
            CategoryConfidence = 1.0m,
            OverriddenByUser = transaction.OverriddenByUser
        };
    }
}