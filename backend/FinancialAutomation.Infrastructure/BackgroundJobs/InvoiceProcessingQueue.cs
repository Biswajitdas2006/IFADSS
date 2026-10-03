using System.Threading.Channels;
using FinancialAutomation.Application.Interfaces;

namespace FinancialAutomation.Infrastructure.BackgroundJobs;

public sealed class InvoiceProcessingQueue : IInvoiceProcessingQueue
{
    private readonly Channel<(Guid InvoiceId, string FilePath)> _queue;

    public InvoiceProcessingQueue()
    {
        var options = new BoundedChannelOptions(100)
        {
            FullMode = BoundedChannelFullMode.Wait,
            SingleReader = true,
            SingleWriter = false
        };

        _queue = Channel.CreateBounded<(Guid InvoiceId, string FilePath)>(
            options);
    }

    public async ValueTask QueueAsync(
        Guid invoiceId,
        string filePath,
        CancellationToken cancellationToken = default)
    {
        await _queue.Writer.WriteAsync(
            (invoiceId, filePath),
            cancellationToken);
    }

    public async ValueTask<(Guid InvoiceId, string FilePath)> DequeueAsync(
        CancellationToken cancellationToken)
    {
        return await _queue.Reader.ReadAsync(cancellationToken);
    }
}