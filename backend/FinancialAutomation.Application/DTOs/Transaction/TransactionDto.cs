namespace FinancialAutomation.Application.DTOs.Transaction;

public class TransactionDto
{
    public Guid Id { get; set; }
    public Guid? InvoiceId { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateOnly TransactionDate { get; set; }
    public string? Category { get; set; }
    public decimal? CategoryConfidence { get; set; }
    public bool OverriddenByUser { get; set; }
}

public class TransactionListResponseDto
{
    public List<TransactionDto> Items { get; set; } = new();
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalItems { get; set; }
    public int TotalPages { get; set; }
}