namespace FinancialAutomation.Application.DTOs.Dashboard;

public record CategorySpendDto(string Category, decimal Amount);

public record DashboardTotals(decimal Income, decimal Expense);

public class DashboardSummaryDto
{
    public decimal TotalIncome { get; set; }
    public decimal TotalExpense { get; set; }
    public decimal NetCashFlow { get; set; }
    public int? OpenAnomalies { get; set; }
    public List<CategorySpendDto> TopCategories { get; set; } = new();
    public DateOnly From { get; set; }
    public DateOnly To { get; set; }
}
