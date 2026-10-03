namespace FinancialAutomation.Domain.Constants;

public static class TransactionCategories
{
    public static readonly string[] All =
    {
        "Office Supplies", "Travel", "Utilities", "Rent", "Payroll",
        "Software/Subscriptions", "Marketing", "Professional Fees", "Miscellaneous"
    };

    public static bool IsValid(string category) => All.Contains(category);
}