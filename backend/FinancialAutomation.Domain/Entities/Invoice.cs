using FinancialAutomation.Domain.Common;
using FinancialAutomation.Domain.Enums;

namespace FinancialAutomation.Domain.Entities;

public class Invoice : BaseEntity
{
    public Guid UserId { get; private set; }
    public User? User { get; private set; }

    public string FileName { get; private set; } = string.Empty;
    public string FilePath { get; private set; } = string.Empty;
    public string? VendorName { get; private set; }
    public DateOnly? InvoiceDate { get; private set; }
    public decimal? TotalAmount { get; private set; }
    public decimal? TaxAmount { get; private set; }
    public InvoiceStatus Status { get; private set; } = InvoiceStatus.Pending;
    public string? FailureReason { get; private set; }
    public DateTime UploadedAt { get; private set; } = DateTime.UtcNow;
    public DateTime? ProcessedAt { get; private set; }

    public ICollection<Transaction> Transactions { get; private set; } = new List<Transaction>();

    private Invoice() { } // Required by EF Core

    public Invoice(Guid userId, string fileName, string filePath)
    {
        if (userId == Guid.Empty)
            throw new ArgumentException("UserId cannot be empty.", nameof(userId));
        if (string.IsNullOrWhiteSpace(fileName))
            throw new ArgumentException("FileName cannot be empty.", nameof(fileName));
        if (string.IsNullOrWhiteSpace(filePath))
            throw new ArgumentException("FilePath cannot be empty.", nameof(filePath));

        UserId = userId;
        FileName = fileName;
        FilePath = filePath;
    }

    public void MarkProcessed(string? vendorName, DateOnly? invoiceDate, decimal? totalAmount, decimal? taxAmount)
    {
        VendorName = vendorName;
        InvoiceDate = invoiceDate;
        TotalAmount = totalAmount;
        TaxAmount = taxAmount;
        Status = InvoiceStatus.Processed;
        ProcessedAt = DateTime.UtcNow;
    }

    public void MarkFailed(string reason)
    {
        if (string.IsNullOrWhiteSpace(reason))
            throw new ArgumentException("Failure reason cannot be empty.", nameof(reason));

        Status = InvoiceStatus.Failed;
        FailureReason = reason;
        ProcessedAt = DateTime.UtcNow;
    }
}