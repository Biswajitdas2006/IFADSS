using System.Text.Json;
using FinancialAutomation.Application.DTOs.Invoice;
using FinancialAutomation.Application.Interfaces;
using FinancialAutomation.Domain.Entities;
using FinancialAutomation.Domain.Exceptions;

namespace FinancialAutomation.Application.Services;

public class InvoiceService : IInvoiceService, IInvoiceOcrProcessor
{
    private readonly IInvoiceProcessingQueue _invoiceProcessingQueue;

    private static readonly string[] AllowedContentTypes =
    {
        "application/pdf",
        "image/jpeg",
        "image/png"
    };

    private const long MaxFileSizeBytes = 10 * 1024 * 1024;

    // camelCase output:
    // {"topFeatures":[{"feature":"...","contribution":0.31}]}
    private static readonly JsonSerializerOptions ShapJsonOptions =
        new(JsonSerializerDefaults.Web);

    private readonly IInvoiceRepository _invoiceRepository;
    private readonly ITransactionRepository _transactionRepository;
    private readonly IInvoiceFileStorage _fileStorage;
    private readonly IFastApiClient _fastApiClient;

    public InvoiceService(
        IInvoiceRepository invoiceRepository,
        ITransactionRepository transactionRepository,
        IInvoiceFileStorage fileStorage,
        IFastApiClient fastApiClient,
        IInvoiceProcessingQueue invoiceProcessingQueue)
    {
        _invoiceRepository = invoiceRepository;
        _transactionRepository = transactionRepository;
        _fileStorage = fileStorage;
        _fastApiClient = fastApiClient;
        _invoiceProcessingQueue = invoiceProcessingQueue;
    }

    public async Task<UploadInvoiceResponseDto> UploadAsync(
        Guid userId,
        InvoiceFileUpload file,
        CancellationToken cancellationToken = default)
    {
        if (file.Length == 0)
            throw new ValidationException(
                "file",
                "A file is required.");

        if (!AllowedContentTypes.Contains(file.ContentType))
            throw new ValidationException(
                "file",
                "File must be a PDF, JPG, or PNG.");

        if (file.Length > MaxFileSizeBytes)
            throw new ValidationException(
                "file",
                "File size must not exceed 10MB.");

        // Save uploaded invoice file.
        var filePath = await _fileStorage.SaveAsync(
            file.Content,
            file.FileName,
            cancellationToken);

        // Create invoice record.
        var invoice = new Invoice(
            userId,
            file.FileName,
            filePath);

        await _invoiceRepository.AddAsync(
            invoice,
            cancellationToken);

        // Queue OCR processing instead of using fire-and-forget.
        //
        // The HTTP request can return 202 immediately while the
        // BackgroundService processes the invoice using its own
        // dependency-injection scope and DbContext.
        await _invoiceProcessingQueue.QueueAsync(
            invoice.Id,
            filePath,
            cancellationToken);

        return new UploadInvoiceResponseDto
        {
            InvoiceId = invoice.Id,
            Status = invoice.Status.ToString(),
            UploadedAt = invoice.UploadedAt
        };
    }

    public async Task ProcessOcrAsync(
        Guid invoiceId,
        string filePath,
        CancellationToken cancellationToken = default)
    {
        try
        {
            Console.WriteLine();
            Console.WriteLine(
                $"Starting OCR processing for invoice {invoiceId}");

            // Call FastAPI OCR service.
            var ocrResult =
                await _fastApiClient.Ocr.ExtractAsync(
                    filePath,
                    cancellationToken);

            Console.WriteLine(
                $"OCR request completed for invoice {invoiceId}");

            // IMPORTANT:
            // This method is now executed inside a fresh BackgroundService
            // dependency-injection scope. Therefore the repository's
            // AppDbContext is still alive here.
            var invoice =
                await _invoiceRepository.GetByIdAsync(
                    invoiceId,
                    cancellationToken);

            if (invoice is null)
            {
                Console.WriteLine(
                    $"Invoice {invoiceId} no longer exists.");

                return;
            }

            // Update invoice with OCR information.
            invoice.MarkProcessed(
                ocrResult.Vendor,
                ocrResult.Date,
                ocrResult.TotalAmount,
                ocrResult.TaxAmount);

            await _invoiceRepository.UpdateAsync(
                invoice,
                cancellationToken);

            // Create transactions from OCR line items.
            foreach (var lineItem in ocrResult.LineItems)
            {
                var transaction = new Transaction(
                    userId: invoice.UserId,
                    description: lineItem.Description,
                    amount: lineItem.Amount,
                    transactionDate:
                        ocrResult.Date
                        ?? DateOnly.FromDateTime(
                            DateTime.UtcNow),
                    invoiceId: invoice.Id);

                await _transactionRepository.AddAsync(
                    transaction,
                    cancellationToken);

                // Classification failure should not fail the
                // complete invoice-processing pipeline.
                await ClassifyTransactionSafelyAsync(
                    transaction,
                    cancellationToken);
            }

            Console.WriteLine(
                $"OCR processing completed for invoice {invoiceId}");
        }
        catch (OperationCanceledException)
            when (cancellationToken.IsCancellationRequested)
        {
            Console.WriteLine(
                $"OCR processing cancelled for invoice {invoiceId}");

            throw;
        }
        catch (Exception ex)
        {
            Console.WriteLine();
            Console.WriteLine(
                $"OCR FAILED for invoice {invoiceId}");

            Console.WriteLine(ex.ToString());

            // The worker owns the current DI scope, so the DbContext
            // is still valid here.
            try
            {
                var invoice =
                    await _invoiceRepository.GetByIdAsync(
                        invoiceId,
                        CancellationToken.None);

                if (invoice is not null)
                {
                    invoice.MarkFailed(ex.Message);

                    await _invoiceRepository.UpdateAsync(
                        invoice,
                        CancellationToken.None);
                }
            }
            catch (Exception updateException)
            {
                Console.WriteLine(
                    $"Failed to mark invoice {invoiceId} as failed.");

                Console.WriteLine(
                    updateException.ToString());
            }
        }
    }

    internal async Task ClassifyTransactionSafelyAsync(
        Transaction transaction,
        CancellationToken cancellationToken)
    {
        try
        {
            var classification =
                await _fastApiClient.Classify.ClassifyAsync(
                    transaction.Description,
                    transaction.Amount,
                    cancellationToken);

            // If no category is returned, leave the transaction
            // uncategorized.
            if (string.IsNullOrWhiteSpace(
                    classification.Category))
            {
                return;
            }

            var shapJson =
                classification.ShapExplanation is not null
                    ? JsonSerializer.Serialize(
                        classification.ShapExplanation,
                        ShapJsonOptions)
                    : null;

            transaction.ApplyAiCategory(
                classification.Category,
                classification.Confidence,
                shapJson);

            await _transactionRepository.UpdateAsync(
                transaction,
                cancellationToken);
        }
        catch (OperationCanceledException)
            when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception ex)
        {
            // Graceful degradation:
            //
            // If classification fails, the transaction remains
            // uncategorized instead of failing the entire invoice.
            Console.WriteLine(
                $"Transaction classification failed " +
                $"for transaction {transaction.Id}");

            Console.WriteLine(ex.Message);
        }
    }

    public async Task<InvoiceDetailDto> GetByIdAsync(
        Guid userId,
        Guid invoiceId,
        CancellationToken cancellationToken = default)
    {
        var invoice =
            await _invoiceRepository.GetByIdWithTransactionsAsync(
                invoiceId,
                userId,
                cancellationToken);

        if (invoice is null)
        {
            throw new NotFoundException(
                nameof(Invoice),
                invoiceId);
        }

        return new InvoiceDetailDto
        {
            Id = invoice.Id,

            VendorName = invoice.VendorName,

            InvoiceDate = invoice.InvoiceDate,

            TotalAmount = invoice.TotalAmount,

            Status = invoice.Status.ToString(),

            FailureReason = invoice.FailureReason,

            Transactions =
                invoice.Transactions
                    .Select(t => new InvoiceTransactionDto
                    {
                        Id = t.Id,

                        Description = t.Description,

                        Amount = t.Amount,

                        Category = t.Category
                    })
                    .ToList()
        };
    }

    public async Task<InvoiceListResponseDto> GetListAsync(
        Guid userId,
        string? status,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        page = page < 1
            ? 1
            : page;

        pageSize = pageSize is < 1 or > 100
            ? 20
            : pageSize;

        var (items, totalItems) =
            await _invoiceRepository.GetByUserAsync(
                userId,
                status,
                page,
                pageSize,
                cancellationToken);

        return new InvoiceListResponseDto
        {
            Items =
                items.Select(i => new InvoiceListItemDto
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

            TotalPages =
                (int)Math.Ceiling(
                    totalItems / (double)pageSize)
        };
    }
}