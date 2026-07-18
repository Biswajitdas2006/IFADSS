using FinancialAutomation.Domain.Common;

namespace FinancialAutomation.Domain.Entities;

public class Log : BaseEntity
{
    public Guid? UserId { get; private set; }
    public User? User { get; private set; }

    public string Action { get; private set; } = string.Empty;
    public string? Details { get; private set; }
    public DateTime Timestamp { get; private set; } = DateTime.UtcNow;

    private Log() { } // Required by EF Core

    public Log(string action, string? details = null, Guid? userId = null)
    {
        if (string.IsNullOrWhiteSpace(action))
            throw new ArgumentException("Action cannot be empty.", nameof(action));

        Action = action;
        Details = details;
        UserId = userId;
    }
}