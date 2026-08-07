using FinancialAutomation.Application.DTOs.Invoice;
using FinancialAutomation.Application.Interfaces;
using FinancialAutomation.Domain.Entities;
using FinancialAutomation.Domain.Exceptions;

namespace FinancialAutomation.Application.Services;

public class InvoiceService : IInvoiceService
{
    private static readonly string[] AllowedContentTypes = { "application/pdf", "image/jpeg", "image/png" };
    private const long MaxFileSizeBytes = 10 * 1024 * 1024;

    private readonly IInvoiceRepository _invoiceRepository;
    private readonly ITransactionRepository _transactionRepository;
    private readonly IInvoiceFileStorage _fileStorage;
    private readonly IFastApiClient _fastApiClient;

    public InvoiceService(
        IInvoiceRepository invoiceRepository,
        ITransactionRepository transactionRepository,
        IInvoiceFileStorage fileStorage,
        IFastApiClient fastApiClient)
    {
        _invoiceRepository = invoiceRepository;
        _transactionRepository = transactionRepository;
        _fileStorage = fileStorage;
        _fastApiClient = fastApiClient;
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

        // Fire-and-forget OCR processing (Document 1, Section 9) — the upload request
        // returns 202 immediately; this runs after the response is already sent.
        _ = ProcessOcrAsync(invoice.Id, filePath, CancellationToken.None);

        return new UploadInvoiceResponseDto
        {
            InvoiceId = invoice.Id,
            Status = invoice.Status.ToString(),
            UploadedAt = invoice.UploadedAt
        };
    }

    private async Task ProcessOcrAsync(Guid invoiceId, string filePath, CancellationToken cancellationToken)
    {
        try
        {
            var ocrResult = await _fastApiClient.Ocr.ExtractAsync(filePath, cancellationToken);

            var invoice = await _invoiceRepository.GetByIdAsync(invoiceId, cancellationToken);
            if (invoice is null) return; // invoice was deleted mid-processing — nothing to update

            invoice.MarkProcessed(ocrResult.Vendor, ocrResult.Date, ocrResult.TotalAmount, ocrResult.TaxAmount);
            await _invoiceRepository.UpdateAsync(invoice, cancellationToken);

            foreach (var lineItem in ocrResult.LineItems)
            {
                var transaction = new Transaction(
                    userId: invoice.UserId,
                    description: lineItem.Description,
                    amount: lineItem.Amount,
                    transactionDate: ocrResult.Date ?? DateOnly.FromDateTime(DateTime.UtcNow),
                    invoiceId: invoice.Id);

                await _transactionRepository.AddAsync(transaction, cancellationToken);

                // Classification (TransactionService.ClassifyAsync) happens in Week 5 —
                // Category stays null on these Transactions until then, exactly as
                // Document 1, Section 9, step 4 specifies.
            }
        }
        catch (Exception ex)
        {
            // Graceful degradation, per Document 1, Section 22.4 —
            // the invoice stays Pending with a stored failure reason
            // rather than crashing anything or leaving no trace.
            var invoice = await _invoiceRepository.GetByIdAsync(invoiceId, cancellationToken);
            if (invoice is not null)
            {
                invoice.MarkFailed(ex.Message);
                await _invoiceRepository.UpdateAsync(invoice, cancellationToken);
            }
        }
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
            FailureReason = invoice.FailureReason,   // ← new
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