// using System.Security.Claims;
// using FinancialAutomation.API.Common;
// using FinancialAutomation.Application.DTOs.Transaction;
// using FinancialAutomation.Application.Interfaces;
// using Microsoft.AspNetCore.Authorization;
// using Microsoft.AspNetCore.Mvc;

// namespace FinancialAutomation.API.Controllers;

// [ApiController]
// [Route("api/v1/transactions")]
// [Authorize]
// public class TransactionsController : ControllerBase
// {
//     private readonly ITransactionService _transactionService;

//     public TransactionsController(ITransactionService transactionService)
//     {
//         _transactionService = transactionService;
//     }

//     private Guid CurrentUserId =>
//         Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")!.Value);

//     [HttpGet]
//     public async Task<IActionResult> GetList(
//         [FromQuery] string? category, [FromQuery] DateOnly? from, [FromQuery] DateOnly? to,
//         [FromQuery] int page = 1, [FromQuery] int pageSize = 20,
//         CancellationToken cancellationToken = default)
//     {
//         var result = await _transactionService.GetListAsync(CurrentUserId, category, from, to, page, pageSize, cancellationToken);
//         return Ok(ApiResponse<TransactionListResponseDto>.Ok(result));
//     }
// }
using System.Security.Claims;
using FinancialAutomation.API.Common;
using FinancialAutomation.Application.DTOs.Transaction;
using FinancialAutomation.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinancialAutomation.API.Controllers;

[ApiController]
[Route("api/v1/transactions")]
[Authorize]
public class TransactionsController : ControllerBase
{
    private readonly ITransactionService _transactionService;

    public TransactionsController(ITransactionService transactionService)
    {
        _transactionService = transactionService;
    }

    private Guid CurrentUserId =>
        Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")!.Value);

    [HttpGet]
    public async Task<IActionResult> GetList(
        [FromQuery] string? category,
        [FromQuery] DateOnly? from,
        [FromQuery] DateOnly? to,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await _transactionService.GetListAsync(
            CurrentUserId,
            category,
            from,
            to,
            page,
            pageSize,
            cancellationToken);

        return Ok(ApiResponse<TransactionListResponseDto>.Ok(result));
    }

    [HttpPatch("{id}/category")]
    [Authorize(Roles = "Owner,Accountant")]
    public async Task<IActionResult> UpdateCategory(
        Guid id,
        [FromBody] UpdateCategoryRequestDto request,
        CancellationToken cancellationToken)
    {
        var result = await _transactionService.UpdateCategoryAsync(
            CurrentUserId,
            id,
            request.Category,
            cancellationToken);

        return Ok(ApiResponse<UpdateCategoryResponseDto>.Ok(result));
    }
}