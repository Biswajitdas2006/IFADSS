namespace FinancialAutomation.Application.DTOs.Invoice;

public class UploadInvoiceResponseDto
{
    public Guid InvoiceId { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime UploadedAt { get; set; }
}
