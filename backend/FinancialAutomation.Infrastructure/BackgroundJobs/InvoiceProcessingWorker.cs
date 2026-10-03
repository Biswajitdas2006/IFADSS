using FinancialAutomation.Application.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace FinancialAutomation.Infrastructure.BackgroundJobs;

public sealed class InvoiceProcessingWorker : BackgroundService
{
    private readonly IInvoiceProcessingQueue _queue;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<InvoiceProcessingWorker> _logger;

    public InvoiceProcessingWorker(
        IInvoiceProcessingQueue queue,
        IServiceScopeFactory scopeFactory,
        ILogger<InvoiceProcessingWorker> logger)
    {
        _queue = queue;
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(
        CancellationToken stoppingToken)
    {
        _logger.LogInformation(
            "Invoice processing worker started.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var job = await _queue.DequeueAsync(
                    stoppingToken);

                _logger.LogInformation(
                    "Processing OCR job {InvoiceId}",
                    job.InvoiceId);

                using var scope =
                    _scopeFactory.CreateScope();

                var processor =
                    scope.ServiceProvider
                        .GetRequiredService<IInvoiceOcrProcessor>();

                await processor.ProcessOcrAsync(
                    job.InvoiceId,
                    job.FilePath,
                    stoppingToken);
            }
            catch (OperationCanceledException)
                when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Unhandled error in invoice processing worker.");
            }
        }

        _logger.LogInformation(
            "Invoice processing worker stopped.");
    }
}