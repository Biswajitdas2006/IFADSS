namespace FinancialAutomation.Application.DTOs.Invoice;

public class InvoiceDetailDto
{
    public Guid Id { get; set; }
    public string? VendorName { get; set; }
    public DateOnly? InvoiceDate { get; set; }
    public decimal? TotalAmount { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? FailureReason { get; set; }   // ← new
    public List<InvoiceTransactionDto> Transactions { get; set; } = new();
}

public class InvoiceTransactionDto
{
    public Guid Id { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string? Category { get; set; }
}