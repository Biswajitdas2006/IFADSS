// using System.Net.Http.Headers;
// using System.Net.Http.Json;
// using System.Text.Json;
// using FinancialAutomation.Application.Interfaces;

// namespace FinancialAutomation.Infrastructure.ExternalServices;

// public class FastApiClient : IFastApiClient
// {
//     public IOcrClient Ocr { get; }
//     public IClassifyClient Classify { get; }

//     public FastApiClient(HttpClient httpClient)
//     {
//         Ocr = new OcrClient(httpClient);
//         Classify = new ClassifyClient(httpClient);
//     }
// }

// // ---------- Shared helpers ----------

// internal static class AiHttp
// {
//     public static async Task EnsureSuccessAsync(HttpResponseMessage response, CancellationToken ct)
//     {
//         if (response.IsSuccessStatusCode) return;
//         var body = await response.Content.ReadAsStringAsync(ct);
//         throw new AiServiceException((int)response.StatusCode, body);
//     }

//     public static CancellationTokenSource WithTimeout(CancellationToken ct, int seconds)
//     {
//         var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
//         cts.CancelAfter(TimeSpan.FromSeconds(seconds));
//         return cts;
//     }
// }

// // JSON shape jo Dev 2 ki service bhejti hai (vendorName / invoiceDate)
// internal class OcrWireResponse
// {
//     public string? VendorName { get; set; }
//     public string? InvoiceDate { get; set; }
//     public decimal? TotalAmount { get; set; }
//     public decimal? TaxAmount { get; set; }
//     public List<OcrLineItem> LineItems { get; set; } = new();
// }

// // ---------- OCR ----------

// internal class OcrClient : IOcrClient
// {
//     private readonly HttpClient _httpClient;

//     public OcrClient(HttpClient httpClient) => _httpClient = httpClient;

//     public async Task<OcrExtractResult> ExtractAsync(
//         string filePath, CancellationToken cancellationToken = default)
//     {
//         const int maxAttempts = 2;
//         Exception? lastException = null;

//         for (var attempt = 1; attempt <= maxAttempts; attempt++)
//         {
//             try
//             {
//                 using var cts = AiHttp.WithTimeout(cancellationToken, 90);   // pehle 15 tha

//                 // Har attempt pe naya stream, kyunki stream ek hi baar padha ja sakta hai
//                 await using var fileStream = File.OpenRead(filePath);
//                 using var content = new MultipartFormDataContent();
//                 var fileContent = new StreamContent(fileStream);
//                 fileContent.Headers.ContentType = new MediaTypeHeaderValue(GetMimeType(filePath));
//                 content.Add(fileContent, "file", Path.GetFileName(filePath)); // field name = "file"

//                 var response = await _httpClient.PostAsync("/internal/ocr/extract", content, cts.Token);
//                 await AiHttp.EnsureSuccessAsync(response, cts.Token);

//                 var wire = await response.Content.ReadFromJsonAsync<OcrWireResponse>(cancellationToken: cts.Token)
//                            ?? new OcrWireResponse();

//                 return new OcrExtractResult
//                 {
//                     Vendor = wire.VendorName,
//                     Date = DateOnly.TryParse(wire.InvoiceDate, out var date) ? date : null,
//                     TotalAmount = wire.TotalAmount,
//                     TaxAmount = wire.TaxAmount,
//                     LineItems = wire.LineItems
//                 };
//             }
//             catch (AiServiceException)
//             {
//                 throw; // 4xx/5xx pe retry se fayda nahi
//             }
//             catch (Exception ex) when (
//                 !cancellationToken.IsCancellationRequested &&
//                 ex is HttpRequestException or TaskCanceledException or JsonException)
//             {
//                 lastException = ex;
//             }
//         }

//         throw new InvalidOperationException("AI service unreachable after retry.", lastException);
//     }

//     private static string GetMimeType(string path) => Path.GetExtension(path).ToLowerInvariant() switch
//     {
//         ".pdf" => "application/pdf",
//         ".png" => "image/png",
//         ".jpg" or ".jpeg" => "image/jpeg",
//         _ => "application/octet-stream"
//     };
// }

// // ---------- Classification ----------

// internal class ClassifyClient : IClassifyClient
// {
//     private readonly HttpClient _httpClient;

//     public ClassifyClient(HttpClient httpClient) => _httpClient = httpClient;

//     public async Task<ClassificationResult> ClassifyAsync(
//         string description, decimal amount, CancellationToken cancellationToken = default)
//     {
//         const int maxAttempts = 2; // Document 1, Section 22.4
//         Exception? lastException = null;

//         for (var attempt = 1; attempt <= maxAttempts; attempt++)
//         {
//             try
//             {
//                 using var cts = AiHttp.WithTimeout(cancellationToken, 5);

//                 var response = await _httpClient.PostAsJsonAsync(
//                     "/internal/classify/transaction",
//                     new { description, amount },
//                     cts.Token);

//                 await AiHttp.EnsureSuccessAsync(response, cts.Token);

//                 var result = await response.Content.ReadFromJsonAsync<ClassificationResult>(
//                     cancellationToken: cts.Token);
//                 return result ?? new ClassificationResult();
//             }
//             catch (AiServiceException)
//             {
//                 throw;
//             }
//             catch (Exception ex) when (
//                 !cancellationToken.IsCancellationRequested &&
//                 ex is HttpRequestException or TaskCanceledException or JsonException)
//             {
//                 lastException = ex;
//             }
//         }

//         throw new InvalidOperationException("AI service unreachable after retry.", lastException);
//     }
// }


using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;

using FinancialAutomation.Application.Interfaces;

namespace FinancialAutomation.Infrastructure.ExternalServices;

public class FastApiClient : IFastApiClient
{
    public IOcrClient Ocr { get; }
    public IClassifyClient Classify { get; }

    public FastApiClient(HttpClient httpClient)
    {
        Ocr = new OcrClient(httpClient);
        Classify = new ClassifyClient(httpClient);
    }
}

internal static class AiHttp
{
    public static async Task EnsureSuccessAsync(
        HttpResponseMessage response,
        CancellationToken ct)
    {
        if (response.IsSuccessStatusCode)
            return;

        var body =
            await response.Content.ReadAsStringAsync(ct);

        throw new AiServiceException(
            (int)response.StatusCode,
            body);
    }

    public static CancellationTokenSource WithTimeout(
        CancellationToken ct,
        int seconds)
    {
        var cts =
            CancellationTokenSource.CreateLinkedTokenSource(ct);

        cts.CancelAfter(
            TimeSpan.FromSeconds(seconds));

        return cts;
    }
}

internal class OcrWireResponse
{
    public string? VendorName { get; set; }

    public string? InvoiceDate { get; set; }

    public decimal? TotalAmount { get; set; }

    public decimal? TaxAmount { get; set; }

    public List<OcrLineItem> LineItems { get; set; } = new();
}

internal class OcrJobResponse
{
    public string? JobId { get; set; }

    public string? Status { get; set; }

    public OcrWireResponse? Result { get; set; }

    public string? Error { get; set; }
}

internal class OcrClient : IOcrClient
{
    private readonly HttpClient _httpClient;

    private const int MaxAttempts = 2;

    // Maximum time allowed for the entire OCR job,
    // including polling after the initial POST.
    private const int OcrTimeoutSeconds = 90;

    // How frequently .NET checks the FastAPI job status.
    private const int PollIntervalMilliseconds = 2000;

    public OcrClient(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<OcrExtractResult> ExtractAsync(
        string filePath,
        CancellationToken cancellationToken = default)
    {
        Exception? lastException = null;

        for (var attempt = 1;
             attempt <= MaxAttempts;
             attempt++)
        {
            try
            {
                using var cts =
                    AiHttp.WithTimeout(
                        cancellationToken,
                        OcrTimeoutSeconds);

                Console.WriteLine();
                Console.WriteLine(
                    "====================================================");

                Console.WriteLine(
                    $"OCR ATTEMPT {attempt}/{MaxAttempts}");

                Console.WriteLine(
                    "====================================================");

                Console.WriteLine(
                    $"OCR File: {filePath}");

                Console.WriteLine(
                    $"OCR File Exists: {File.Exists(filePath)}");

                if (!File.Exists(filePath))
                {
                    throw new FileNotFoundException(
                        "OCR file was not found.",
                        filePath);
                }

                var fileInfo =
                    new FileInfo(filePath);

                Console.WriteLine(
                    $"OCR File Size: {fileInfo.Length} bytes");

                await using var fileStream =
                    File.OpenRead(filePath);

                using var content =
                    new MultipartFormDataContent();

                using var fileContent =
                    new StreamContent(fileStream);

                fileContent.Headers.ContentType =
                    new MediaTypeHeaderValue(
                        GetMimeType(filePath));

                content.Add(
                    fileContent,
                    "file",
                    Path.GetFileName(filePath));

                Console.WriteLine(
                    $"OCR Request URL: " +
                    $"{_httpClient.BaseAddress}" +
                    "/internal/ocr/extract");

                Console.WriteLine(
                    $"OCR attempt {attempt}: " +
                    "SENDING REQUEST");

                // -------------------------------------------------
                // STEP 1: Submit OCR job
                // -------------------------------------------------

                using var response =
                    await _httpClient.PostAsync(
                        "/internal/ocr/extract",
                        content,
                        cts.Token);

                Console.WriteLine(
                    $"OCR attempt {attempt}: " +
                    $"RECEIVED {(int)response.StatusCode} " +
                    $"{response.StatusCode}");

                await AiHttp.EnsureSuccessAsync(
                    response,
                    cts.Token);

                Console.WriteLine(
                    $"OCR attempt {attempt}: HTTP SUCCESS");

                var responseBody =
                    await response.Content.ReadAsStringAsync(
                        cts.Token);

                Console.WriteLine(
                    "OCR Initial Response Body:");

                Console.WriteLine(responseBody);

                var job =
                    JsonSerializer.Deserialize<OcrJobResponse>(
                        responseBody,
                        new JsonSerializerOptions
                        {
                            PropertyNameCaseInsensitive = true
                        });

                if (job is null)
                {
                    throw new JsonException(
                        "OCR service returned an empty job response.");
                }

                if (string.IsNullOrWhiteSpace(job.JobId))
                {
                    throw new JsonException(
                        "OCR service did not return a jobId.");
                }

                Console.WriteLine(
                    $"OCR Job ID: {job.JobId}");

                Console.WriteLine(
                    $"OCR Job Initial Status: {job.Status}");

                // -------------------------------------------------
                // STEP 2: Poll for OCR result
                // -------------------------------------------------

                var result =
                    await PollForResultAsync(
                        job.JobId,
                        cts.Token);

                Console.WriteLine(
                    "OCR FINAL RESULT RECEIVED");

                Console.WriteLine(
                    $"Vendor: {result.VendorName}");

                Console.WriteLine(
                    $"Invoice Date: {result.InvoiceDate}");

                Console.WriteLine(
                    $"Total Amount: {result.TotalAmount}");

                Console.WriteLine(
                    $"Tax Amount: {result.TaxAmount}");

                Console.WriteLine(
                    $"Line Items: {result.LineItems.Count}");

                Console.WriteLine(
                    $"OCR attempt {attempt}: " +
                    "JSON DESERIALIZATION SUCCESS");

                // -------------------------------------------------
                // STEP 3: Convert wire response to application DTO
                // -------------------------------------------------

                return new OcrExtractResult
                {
                    Vendor = result.VendorName,

                    Date =
                        DateOnly.TryParse(
                            result.InvoiceDate,
                            out var date)
                            ? date
                            : null,

                    TotalAmount =
                        result.TotalAmount,

                    TaxAmount =
                        result.TaxAmount,

                    LineItems =
                        result.LineItems
                };
            }
            catch (AiServiceException)
            {
                throw;
            }
            catch (Exception ex) when (
                !cancellationToken.IsCancellationRequested &&
                ex is HttpRequestException
                    or TaskCanceledException
                    or JsonException
                    or InvalidOperationException)
            {
                Console.WriteLine();
                Console.WriteLine(
                    "========== OCR ATTEMPT FAILED ==========");

                Console.WriteLine(
                    $"Attempt: {attempt}/{MaxAttempts}");

                Console.WriteLine(
                    $"Exception Type: " +
                    $"{ex.GetType().FullName}");

                Console.WriteLine(
                    $"Message: {ex.Message}");

                Console.WriteLine(
                    "Full Exception:");

                Console.WriteLine(ex.ToString());

                if (ex.InnerException is not null)
                {
                    Console.WriteLine(
                        "Inner Exception:");

                    Console.WriteLine(
                        ex.InnerException.ToString());
                }

                Console.WriteLine(
                    "=========================================");

                lastException = ex;
            }
        }

        Console.WriteLine();
        Console.WriteLine(
            "========== OCR FINAL FAILURE ==========");

        Console.WriteLine(
            "AI service unreachable or OCR failed after retry.");

        if (lastException is not null)
        {
            Console.WriteLine(
                $"Last Exception: {lastException}");
        }

        Console.WriteLine(
            "=======================================");

        throw new InvalidOperationException(
            "AI service unreachable or OCR failed after retry.",
            lastException);
    }

    private async Task<OcrWireResponse> PollForResultAsync(
        string jobId,
        CancellationToken cancellationToken)
    {
        var attempt = 0;

        while (!cancellationToken.IsCancellationRequested)
        {
            attempt++;

            Console.WriteLine();
            Console.WriteLine(
                $"OCR POLL #{attempt}");

            Console.WriteLine(
                $"Checking job: {jobId}");

            using var response =
                await _httpClient.GetAsync(
                    $"/internal/ocr/extract/{jobId}",
                    cancellationToken);

            Console.WriteLine(
                $"OCR Poll Response: " +
                $"{(int)response.StatusCode} " +
                $"{response.StatusCode}");

            await AiHttp.EnsureSuccessAsync(
                response,
                cancellationToken);

            var responseBody =
                await response.Content.ReadAsStringAsync(
                    cancellationToken);

            Console.WriteLine(
                "OCR Poll Response Body:");

            Console.WriteLine(responseBody);

            var job =
                JsonSerializer.Deserialize<OcrJobResponse>(
                    responseBody,
                    new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });

            if (job is null)
            {
                throw new JsonException(
                    "OCR polling returned an empty response.");
            }

            var status =
                job.Status?.Trim().ToLowerInvariant();

            Console.WriteLine(
                $"OCR Job Status: {status}");

            // -------------------------------------------------
            // OCR completed
            // -------------------------------------------------

            if (status == "done")
            {
                if (job.Result is null)
                {
                    throw new JsonException(
                        "OCR job completed but no result was returned.");
                }

                return job.Result;
            }

            // -------------------------------------------------
            // OCR failed
            // -------------------------------------------------

            if (status == "failed")
            {
                var error =
                    string.IsNullOrWhiteSpace(job.Error)
                        ? "Unknown OCR processing error."
                        : job.Error;

                throw new InvalidOperationException(
                    $"OCR processing failed: {error}");
            }

            // -------------------------------------------------
            // Still processing
            // -------------------------------------------------

            if (status == "processing")
            {
                Console.WriteLine(
                    $"OCR job still processing. " +
                    $"Waiting {PollIntervalMilliseconds}ms...");

                await Task.Delay(
                    PollIntervalMilliseconds,
                    cancellationToken);

                continue;
            }

            // -------------------------------------------------
            // Unknown status
            // -------------------------------------------------

            throw new InvalidOperationException(
                $"OCR service returned unknown job status: " +
                $"'{job.Status}'.");
        }

        throw new OperationCanceledException(
            cancellationToken);
    }

    private static string GetMimeType(string path)
    {
        return Path.GetExtension(path)
            .ToLowerInvariant() switch
        {
            ".pdf" =>
                "application/pdf",

            ".png" =>
                "image/png",

            ".jpg" or ".jpeg" =>
                "image/jpeg",

            _ =>
                "application/octet-stream"
        };
    }
}

internal class ClassifyClient : IClassifyClient
{
    private readonly HttpClient _httpClient;

    public ClassifyClient(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<ClassificationResult> ClassifyAsync(
        string description,
        decimal amount,
        CancellationToken cancellationToken = default)
    {
        const int maxAttempts = 2;

        Exception? lastException = null;

        for (var attempt = 1;
             attempt <= maxAttempts;
             attempt++)
        {
            try
            {
                using var cts =
                    AiHttp.WithTimeout(
                        cancellationToken,
                        5);

                var response =
                    await _httpClient.PostAsJsonAsync(
                        "/internal/classify/transaction",
                        new
                        {
                            description,
                            amount
                        },
                        cts.Token);

                await AiHttp.EnsureSuccessAsync(
                    response,
                    cts.Token);

                var result =
                    await response.Content
                        .ReadFromJsonAsync<ClassificationResult>(
                            cancellationToken: cts.Token);

                return result ??
                    new ClassificationResult();
            }
            catch (AiServiceException)
            {
                throw;
            }
            catch (Exception ex) when (
                !cancellationToken.IsCancellationRequested &&
                ex is HttpRequestException
                    or TaskCanceledException
                    or JsonException)
            {
                lastException = ex;
            }
        }

        throw new InvalidOperationException(
            "AI service unreachable after retry.",
            lastException);
    }
}