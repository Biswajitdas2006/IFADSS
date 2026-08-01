using FinancialAutomation.Application.Interfaces;
using Microsoft.Extensions.Configuration;

namespace FinancialAutomation.Infrastructure.Storage;

public class LocalInvoiceFileStorage : IInvoiceFileStorage
{
    private readonly string _basePath;

    public LocalInvoiceFileStorage(IConfiguration configuration)
    {
        _basePath = configuration["Storage:InvoicesPath"]
            ?? Path.Combine(Directory.GetCurrentDirectory(), "storage", "invoices");
        Directory.CreateDirectory(_basePath);
    }

    public async Task<string> SaveAsync(Stream fileStream, string fileName, CancellationToken cancellationToken = default)
    {
        var safeFileName = $"{Guid.NewGuid()}_{Path.GetFileName(fileName)}";
        var fullPath = Path.Combine(_basePath, safeFileName);

        await using var output = new FileStream(fullPath, FileMode.Create);
        await fileStream.CopyToAsync(output, cancellationToken);

        return fullPath;
    }
}