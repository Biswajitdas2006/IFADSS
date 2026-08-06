namespace FinancialAutomation.Infrastructure.ExternalServices;

public class FastApiOptions
{
    public string BaseUrl { get; set; } = string.Empty;
    public int TimeoutSeconds { get; set; } = 5;
}