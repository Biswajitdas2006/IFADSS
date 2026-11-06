using System.Security.Claims;
using FinancialAutomation.API.Common;
using FinancialAutomation.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinancialAutomation.API.Controllers;

[ApiController]
[Route("api/v1/dashboard")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _service;

    public DashboardController(IDashboardService service)
    {
        _service = service;
    }

    private Guid CurrentUserId
    {
        get
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
            return Guid.TryParse(userId, out var parsedUserId)
                ? parsedUserId
                : throw new UnauthorizedAccessException("The authenticated user ID is missing or invalid.");
        }
    }

    [HttpGet("summary")]
    public async Task<IActionResult> Summary([FromQuery] string? from, [FromQuery] string? to)
    {
        var includeAnomalies = User.IsInRole("Owner") || User.IsInRole("Accountant");
        var data = await _service.GetSummaryAsync(CurrentUserId, from, to, includeAnomalies);
        return Ok(ApiResponse<object>.Ok(data));
    }
}