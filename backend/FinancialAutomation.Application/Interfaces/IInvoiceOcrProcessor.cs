namespace FinancialAutomation.Application.Interfaces;

public interface IInvoiceOcrProcessor
{
    Task ProcessOcrAsync(
        Guid invoiceId,
        string filePath,
        CancellationToken cancellationToken = default);
}