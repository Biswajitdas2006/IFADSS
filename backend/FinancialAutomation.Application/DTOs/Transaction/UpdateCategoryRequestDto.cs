namespace FinancialAutomation.Application.DTOs.Transaction;

public class UpdateCategoryRequestDto
{
    public string Category { get; set; } = string.Empty;
}

public class UpdateCategoryResponseDto
{
    public Guid Id { get; set; }
    public string Category { get; set; } = string.Empty;
    public decimal CategoryConfidence { get; set; }
    public bool OverriddenByUser { get; set; }
}