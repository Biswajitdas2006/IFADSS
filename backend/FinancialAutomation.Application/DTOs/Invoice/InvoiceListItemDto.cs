namespace FinancialAutomation.Application.DTOs.Invoice;

public class InvoiceListItemDto
{
    public Guid Id { get; set; }
    public string? VendorName { get; set; }
    public decimal? TotalAmount { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime UploadedAt { get; set; }
}

public class InvoiceListResponseDto
{
    public List<InvoiceListItemDto> Items { get; set; } = new();
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalItems { get; set; }
    public int TotalPages { get; set; }
}
