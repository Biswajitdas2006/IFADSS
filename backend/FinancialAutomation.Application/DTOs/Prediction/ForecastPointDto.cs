namespace FinancialAutomation.Application.DTOs.Prediction;

public class ForecastPointDto
{
    public DateOnly Date { get; set; }
    public decimal Predicted { get; set; }
    public decimal? LowerBound { get; set; }
    public decimal? UpperBound { get; set; }
}