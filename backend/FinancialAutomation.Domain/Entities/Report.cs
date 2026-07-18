using FinancialAutomation.Domain.Common;
using FinancialAutomation.Domain.Enums;

namespace FinancialAutomation.Domain.Entities;

public class Report : BaseEntity
{
    public Guid UserId { get; private set; }
    public User? User { get; private set; }

    public ReportType ReportType { get; private set; }
    public DateOnly PeriodStart { get; private set; }
    public DateOnly PeriodEnd { get; private set; }
    public string? FilePath { get; private set; }
    public DateTime GeneratedAt { get; private set; } = DateTime.UtcNow;

    private Report() { } // Required by EF Core

    public Report(Guid userId, ReportType reportType, DateOnly periodStart, DateOnly periodEnd)
    {
        if (userId == Guid.Empty)
            throw new ArgumentException("UserId cannot be empty.", nameof(userId));
        if (periodEnd < periodStart)
            throw new ArgumentException("PeriodEnd cannot be before PeriodStart.", nameof(periodEnd));

        UserId = userId;
        ReportType = reportType;
        PeriodStart = periodStart;
        PeriodEnd = periodEnd;
    }

    public void AttachFile(string filePath)
    {
        if (string.IsNullOrWhiteSpace(filePath))
            throw new ArgumentException("FilePath cannot be empty.", nameof(filePath));

        FilePath = filePath;
    }
}