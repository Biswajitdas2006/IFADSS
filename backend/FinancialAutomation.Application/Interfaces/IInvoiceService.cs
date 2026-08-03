using FinancialAutomation.Application.DTOs.Invoice;

namespace FinancialAutomation.Application.Interfaces;

public interface IInvoiceService
{
    Task<UploadInvoiceResponseDto> UploadAsync(Guid userId, InvoiceFileUpload file, CancellationToken cancellationToken = default);
    Task<InvoiceDetailDto> GetByIdAsync(Guid userId, Guid invoiceId, CancellationToken cancellationToken = default);
    Task<InvoiceListResponseDto> GetListAsync(Guid userId, string? status, int page, int pageSize, CancellationToken cancellationToken = default);
}