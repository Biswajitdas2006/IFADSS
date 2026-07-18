using FinancialAutomation.Domain.Common;

namespace FinancialAutomation.Domain.Entities;

public class Transaction : BaseEntity
{
    public Guid UserId { get; private set; }
    public User? User { get; private set; }

    public Guid? InvoiceId { get; private set; }
    public Invoice? Invoice { get; private set; }

    public string Description { get; private set; } = string.Empty;
    public decimal Amount { get; private set; }
    public DateOnly TransactionDate { get; private set; }
    public string? Category { get; private set; }
    public decimal? CategoryConfidence { get; private set; }
    public string? ShapExplanationJson { get; private set; }
    public bool OverriddenByUser { get; private set; }
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;

    public Anomaly? Anomaly { get; private set; }

    private Transaction() { } // Required by EF Core

    public Transaction(Guid userId, string description, decimal amount, DateOnly transactionDate, Guid? invoiceId = null)
    {
        if (userId == Guid.Empty)
            throw new ArgumentException("UserId cannot be empty.", nameof(userId));
        if (string.IsNullOrWhiteSpace(description))
            throw new ArgumentException("Description cannot be empty.", nameof(description));

        UserId = userId;
        Description = description;
        Amount = amount;
        TransactionDate = transactionDate;
        InvoiceId = invoiceId;
    }

    public void ApplyAiCategory(string category, decimal confidence, string? shapExplanationJson)
    {
        if (string.IsNullOrWhiteSpace(category))
            throw new ArgumentException("Category cannot be empty.", nameof(category));
        if (confidence < 0 || confidence > 1)
            throw new ArgumentOutOfRangeException(nameof(confidence), "Confidence must be between 0 and 1.");

        Category = category;
        CategoryConfidence = confidence;
        ShapExplanationJson = shapExplanationJson;
        OverriddenByUser = false;
    }

    public void OverrideCategory(string category)
    {
        if (string.IsNullOrWhiteSpace(category))
            throw new ArgumentException("Category cannot be empty.", nameof(category));

        Category = category;
        OverriddenByUser = true;
    }
}