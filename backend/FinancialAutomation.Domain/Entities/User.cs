using FinancialAutomation.Domain.Common;
using FinancialAutomation.Domain.Enums;

namespace FinancialAutomation.Domain.Entities;

public class User : BaseEntity
{
    public string FullName { get; private set; } = string.Empty;
    public string Email { get; private set; } = string.Empty;
    public string PasswordHash { get; private set; } = string.Empty;
    public UserRole Role { get; private set; } = UserRole.Owner;
    public string? CompanyName { get; private set; }
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; private set; }

    // Navigation properties
    public ICollection<Invoice> Invoices { get; private set; } = new List<Invoice>();
    public ICollection<Transaction> Transactions { get; private set; } = new List<Transaction>();
    public ICollection<Prediction> Predictions { get; private set; } = new List<Prediction>();
    public ICollection<Report> Reports { get; private set; } = new List<Report>();

    private User() { } // Required by EF Core

    public User(string fullName, string email, string passwordHash, UserRole role = UserRole.Owner, string? companyName = null)
    {
        if (string.IsNullOrWhiteSpace(fullName))
            throw new ArgumentException("Full name cannot be empty.", nameof(fullName));
        if (string.IsNullOrWhiteSpace(email))
            throw new ArgumentException("Email cannot be empty.", nameof(email));
        if (string.IsNullOrWhiteSpace(passwordHash))
            throw new ArgumentException("Password hash cannot be empty.", nameof(passwordHash));

        FullName = fullName;
        Email = email;
        PasswordHash = passwordHash;
        Role = role;
        CompanyName = companyName;
    }

    public void UpdateProfile(string fullName, string? companyName)
    {
        if (string.IsNullOrWhiteSpace(fullName))
            throw new ArgumentException("Full name cannot be empty.", nameof(fullName));

        FullName = fullName;
        CompanyName = companyName;
        UpdatedAt = DateTime.UtcNow;
    }

    public void ChangePasswordHash(string newHash)
    {
        if (string.IsNullOrWhiteSpace(newHash))
            throw new ArgumentException("Password hash cannot be empty.", nameof(newHash));

        PasswordHash = newHash;
        UpdatedAt = DateTime.UtcNow;
    }
}