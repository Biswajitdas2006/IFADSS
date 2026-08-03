namespace FinancialAutomation.Application.Interfaces;

public interface IInvoiceFileStorage
{
    Task<string> SaveAsync(Stream fileStream, string fileName, CancellationToken cancellationToken = default);
}