namespace FinancialAutomation.Application.DTOs.Invoice;

public class InvoiceFileUpload
{
    public required Stream Content { get; init; }
    public required string FileName { get; init; }
    public required string ContentType { get; init; }
    public required long Length { get; init; }
}