namespace FinancialAutomation.Application.Interfaces;

public interface IInvoiceProcessingQueue
{
    ValueTask QueueAsync(
        Guid invoiceId,
        string filePath,
        CancellationToken cancellationToken = default);

    ValueTask<(Guid InvoiceId, string FilePath)> DequeueAsync(
        CancellationToken cancellationToken);
}
