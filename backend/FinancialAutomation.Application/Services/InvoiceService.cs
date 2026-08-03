using FinancialAutomation.Application.DTOs.Invoice;
using FinancialAutomation.Application.Interfaces;
using FinancialAutomation.Domain.Entities;
using FinancialAutomation.Domain.Exceptions;

namespace FinancialAutomation.Application.Services;

public class InvoiceService : IInvoiceService
{
    private static readonly string[] AllowedContentTypes = { "application/pdf", "image/jpeg", "image/png" };
    private const long MaxFileSizeBytes = 10 * 1024 * 1024; // 10MB, per Document 4 Section 4

    private readonly IInvoiceRepository _invoiceRepository;
    private readonly IInvoiceFileStorage _fileStorage;

    public InvoiceService(IInvoiceRepository invoiceRepository, IInvoiceFileStorage fileStorage)
    {
        _invoiceRepository = invoiceRepository;
        _fileStorage = fileStorage;
    }

    public async Task<UploadInvoiceResponseDto> UploadAsync(Guid userId, InvoiceFileUpload file, CancellationToken cancellationToken = default)
    {
        if (file.Length == 0)
            throw new ValidationException("file", "A file is required.");

        if (!AllowedContentTypes.Contains(file.ContentType))
            throw new ValidationException("file", "File must be a PDF, JPG, or PNG.");

        if (file.Length > MaxFileSizeBytes)
            throw new ValidationException("file", "File size must not exceed 10MB.");

        var filePath = await _fileStorage.SaveAsync(file.Content, file.FileName, cancellationToken);

        var invoice = new Invoice(userId, file.FileName, filePath);
        await _invoiceRepository.AddAsync(invoice, cancellationToken);

        // OCR processing is triggered here once FastApiClient exists (Day 3).
        // For now the invoice is correctly persisted as Pending and returned immediately,
        // matching the documented fire-and-forget flow (Document 1, Section 9).

        return new UploadInvoiceResponseDto
        {
            InvoiceId = invoice.Id,
            Status = invoice.Status.ToString(),
            UploadedAt = invoice.UploadedAt
        };
    }

    public async Task<InvoiceDetailDto> GetByIdAsync(Guid userId, Guid invoiceId, CancellationToken cancellationToken = default)
    {
        var invoice = await _invoiceRepository.GetByIdWithTransactionsAsync(invoiceId, userId, cancellationToken);
        if (invoice is null)
            throw new NotFoundException(nameof(Invoice), invoiceId);

        return new InvoiceDetailDto
        {
            Id = invoice.Id,
            VendorName = invoice.VendorName,
            InvoiceDate = invoice.InvoiceDate,
            TotalAmount = invoice.TotalAmount,
            Status = invoice.Status.ToString(),
            Transactions = invoice.Transactions.Select(t => new InvoiceTransactionDto
            {
                Id = t.Id,
                Description = t.Description,
                Amount = t.Amount,
                Category = t.Category
            }).ToList()
        };
    }

    public async Task<InvoiceListResponseDto> GetListAsync(Guid userId, string? status, int page, int pageSize, CancellationToken cancellationToken = default)
    {
        page = page < 1 ? 1 : page;
        pageSize = pageSize is < 1 or > 100 ? 20 : pageSize;

        var (items, totalItems) = await _invoiceRepository.GetByUserAsync(userId, status, page, pageSize, cancellationToken);

        return new InvoiceListResponseDto
        {
            Items = items.Select(i => new InvoiceListItemDto
            {
                Id = i.Id,
                VendorName = i.VendorName,
                TotalAmount = i.TotalAmount,
                Status = i.Status.ToString(),
                UploadedAt = i.UploadedAt
            }).ToList(),
            Page = page,
            PageSize = pageSize,
            TotalItems = totalItems,
            TotalPages = (int)Math.Ceiling(totalItems / (double)pageSize)
        };
    }
}