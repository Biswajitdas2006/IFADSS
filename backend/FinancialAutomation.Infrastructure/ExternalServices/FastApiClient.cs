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


// ============================================================
// SHARED AI HTTP HELPERS
// ============================================================

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

        // IMPORTANT:
        // Use the actual timeout supplied by the caller.
        cts.CancelAfter(
            TimeSpan.FromSeconds(seconds));

        return cts;
    }
}


// ============================================================
// OCR RESPONSE MODELS
// ============================================================

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


// ============================================================
// OCR CLIENT
// ============================================================

internal class OcrClient : IOcrClient
{
    private readonly HttpClient _httpClient;

    /*
     * OCR POST creates a background job.
     *
     * DO NOT retry the POST automatically.
     *
     * POST -> job created
     * polling timeout -> retry POST
     * retry POST -> second OCR job
     *
     * That can create duplicate processing.
     */

    // Maximum time for the COMPLETE OCR operation.
    // Includes:
    // POST + polling + FastAPI OCR processing.
    private const int OcrTimeoutSeconds = 600;

    // Poll FastAPI every 2 seconds.
    private const int PollIntervalMilliseconds = 2000;


    public OcrClient(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }


    public async Task<OcrExtractResult> ExtractAsync(
        string filePath,
        CancellationToken cancellationToken = default)
    {
        using var cts =
            AiHttp.WithTimeout(
                cancellationToken,
                OcrTimeoutSeconds);


        Console.WriteLine();
        Console.WriteLine(
            "====================================================");

        Console.WriteLine(
            "OCR JOB STARTED");

        Console.WriteLine(
            "====================================================");

        Console.WriteLine(
            $"OCR File: {filePath}");

        Console.WriteLine(
            $"OCR File Exists: {File.Exists(filePath)}");


        // --------------------------------------------------------
        // Validate file
        // --------------------------------------------------------

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


        // --------------------------------------------------------
        // Create multipart request
        // --------------------------------------------------------

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
            "internal/ocr/extract");


        // ========================================================
        // STEP 1
        // SUBMIT OCR JOB
        // ========================================================

        Console.WriteLine();
        Console.WriteLine(
            "OCR: SENDING JOB");


        using var response =
            await _httpClient.PostAsync(
                "internal/ocr/extract",
                content,
                cts.Token);


        Console.WriteLine(
            $"OCR: HTTP {(int)response.StatusCode} " +
            $"{response.StatusCode}");


        await AiHttp.EnsureSuccessAsync(
            response,
            cts.Token);


        var responseBody =
            await response.Content.ReadAsStringAsync(
                cts.Token);


        Console.WriteLine();
        Console.WriteLine(
            "OCR INITIAL RESPONSE:");

        Console.WriteLine(
            responseBody);


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
            $"OCR Initial Status: {job.Status}");


        // ========================================================
        // STEP 2
        // POLL OCR JOB
        // ========================================================

        var result =
            await PollForResultAsync(
                job.JobId,
                cts.Token);


        // ========================================================
        // STEP 3
        // LOG FINAL RESULT
        // ========================================================

        Console.WriteLine();
        Console.WriteLine(
            "====================================================");

        Console.WriteLine(
            "OCR FINAL RESULT RECEIVED");

        Console.WriteLine(
            "====================================================");

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


        // ========================================================
        // STEP 4
        // CONVERT TO APPLICATION DTO
        // ========================================================

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


    // ============================================================
    // OCR POLLING
    // ============================================================

    private async Task<OcrWireResponse> PollForResultAsync(
        string jobId,
        CancellationToken cancellationToken)
    {
        var pollNumber = 0;


        while (true)
        {
            cancellationToken.ThrowIfCancellationRequested();

            pollNumber++;


            Console.WriteLine();
            Console.WriteLine(
                $"OCR POLL #{pollNumber}");

            Console.WriteLine(
                $"Checking Job: {jobId}");


            using var response =
                await _httpClient.GetAsync(
                    $"internal/ocr/extract/{jobId}",
                    cancellationToken);


            Console.WriteLine(
                $"OCR POLL HTTP: " +
                $"{(int)response.StatusCode} " +
                $"{response.StatusCode}");


            await AiHttp.EnsureSuccessAsync(
                response,
                cancellationToken);


            var responseBody =
                await response.Content.ReadAsStringAsync(
                    cancellationToken);


            Console.WriteLine(
                "OCR POLL RESPONSE:");

            Console.WriteLine(
                responseBody);


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
                job.Status?
                    .Trim()
                    .ToLowerInvariant();


            Console.WriteLine(
                $"OCR JOB STATUS: {status}");


            // ====================================================
            // COMPLETED
            // ====================================================

            if (status == "completed" || status == "done")
            {
                if (job.Result is null)
                {
                    throw new JsonException(
                        "OCR job completed but no result was returned.");
                }


                Console.WriteLine(
                    "OCR JOB COMPLETED SUCCESSFULLY");


                return job.Result;
            }


            // ====================================================
            // FAILED
            // ====================================================

            if (status == "failed")
            {
                var error =
                    string.IsNullOrWhiteSpace(job.Error)
                        ? "Unknown OCR processing error."
                        : job.Error;


                throw new InvalidOperationException(
                    $"OCR processing failed: {error}");
            }


            // ====================================================
            // PROCESSING
            // ====================================================

            if (status == "processing")
            {
                Console.WriteLine(
                    $"OCR still processing. " +
                    $"Waiting {PollIntervalMilliseconds}ms...");


                await Task.Delay(
                    PollIntervalMilliseconds,
                    cancellationToken);

                continue;
            }


            // ====================================================
            // UNKNOWN STATUS
            // ====================================================

            throw new InvalidOperationException(
                $"OCR service returned unknown job status: " +
                $"'{job.Status}'.");
        }
    }


    // ============================================================
    // MIME TYPE
    // ============================================================

    private static string GetMimeType(
        string path)
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


// ============================================================
// CLASSIFICATION CLIENT
// ============================================================

internal class ClassifyClient : IClassifyClient
{
    private readonly HttpClient _httpClient;


    public ClassifyClient(
        HttpClient httpClient)
    {
        _httpClient = httpClient;
    }


    public async Task<ClassificationResult> ClassifyAsync(
        string description,
        decimal amount,
        CancellationToken cancellationToken = default)
    {
        const int maxAttempts = 2;

        const int classificationTimeoutSeconds = 30;

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
                        classificationTimeoutSeconds);


                Console.WriteLine(
                    $"Classification attempt " +
                    $"{attempt}/{maxAttempts}");


                using var response =
                    await _httpClient.PostAsJsonAsync(
                        "internal/classify/transaction",
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


                Console.WriteLine(
                    $"Classification attempt " +
                    $"{attempt} failed: {ex.Message}");
            }
        }


        throw new InvalidOperationException(
            "AI service unreachable after retry.",
            lastException);
    }
}