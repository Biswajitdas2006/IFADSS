using System.Security.Claims;
using FinancialAutomation.API.Common;
using FinancialAutomation.Application.DTOs.Invoice;
using FinancialAutomation.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinancialAutomation.API.Controllers;

[ApiController]
[Route("api/v1/invoices")]
[Authorize]
public class InvoicesController : ControllerBase
{
    private readonly IInvoiceService _invoiceService;

    public InvoicesController(IInvoiceService invoiceService)
    {
        _invoiceService = invoiceService;
    }

    private Guid CurrentUserId =>
        Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")!.Value);

    [HttpPost("upload")]
    [RequestSizeLimit(10_485_760)] // 10MB, Document 4 Section 4
    public async Task<IActionResult> Upload(IFormFile file, CancellationToken cancellationToken)
    {
        await using var stream = file.OpenReadStream();
        var uploadModel = new Application.DTOs.Invoice.InvoiceFileUpload
        {
            Content = stream,
            FileName = file.FileName,
            ContentType = file.ContentType,
            Length = file.Length
        };

        var result = await _invoiceService.UploadAsync(CurrentUserId, uploadModel, cancellationToken);
        return StatusCode(StatusCodes.Status202Accepted, ApiResponse<UploadInvoiceResponseDto>.Ok(result));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await _invoiceService.GetByIdAsync(CurrentUserId, id, cancellationToken);
        return Ok(ApiResponse<InvoiceDetailDto>.Ok(result));
    }

    [HttpGet]
    public async Task<IActionResult> GetList(
        [FromQuery] string? status, [FromQuery] int page = 1, [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await _invoiceService.GetListAsync(CurrentUserId, status, page, pageSize, cancellationToken);
        return Ok(ApiResponse<InvoiceListResponseDto>.Ok(result));
    }
}