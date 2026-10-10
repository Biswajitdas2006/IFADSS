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
                // ------------------------------------------------
                // Wait for next invoice job
                // ------------------------------------------------

                var job =
                    await _queue.DequeueAsync(
                        stoppingToken);


                _logger.LogInformation(
                    "Processing OCR job {InvoiceId}",
                    job.InvoiceId);


                // ------------------------------------------------
                // Create a NEW DI scope
                // ------------------------------------------------

                using var scope =
                    _scopeFactory.CreateScope();


                var processor =
                    scope.ServiceProvider
                        .GetRequiredService<
                            IInvoiceOcrProcessor>();


                // ------------------------------------------------
                // IMPORTANT
                //
                // Do NOT pass stoppingToken here.
                //
                // stoppingToken belongs to the BackgroundService
                // lifetime. If the host requests shutdown while
                // OCR is running, it would cancel the OCR request.
                //
                // OCR has its own 600-second timeout inside
                // FastApiClient.
                // ------------------------------------------------

                await processor.ProcessOcrAsync(
                    job.InvoiceId,
                    job.FilePath,
                    CancellationToken.None);


                _logger.LogInformation(
                    "OCR processing completed for invoice {InvoiceId}",
                    job.InvoiceId);
            }
            catch (OperationCanceledException)
                when (stoppingToken.IsCancellationRequested)
            {
                _logger.LogInformation(
                    "Invoice processing worker cancellation requested.");

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