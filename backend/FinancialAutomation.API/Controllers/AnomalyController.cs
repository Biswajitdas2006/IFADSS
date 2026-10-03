using System.Security.Claims;

using FinancialAutomation.Application.Interfaces;

using Microsoft.AspNetCore.Authorization;

using Microsoft.AspNetCore.Mvc;

namespace FinancialAutomation.API.Controllers;

[ApiController]

[Route("api/v1/anomalies")]

[Authorize(Roles = "Owner,Accountant")]

public class AnomalyController : ControllerBase
{
    private readonly IAnomalyService _service;

    public AnomalyController(IAnomalyService service)
        => _service = service;

    private Guid CurrentUserId =>
        Guid.Parse(
            User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub")!);

    [HttpGet]

    public async Task<IActionResult> Get(
        [FromQuery] string? severity,
        [FromQuery] bool? reviewed,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var data = await _service.GetAnomaliesAsync(
            CurrentUserId,
            severity,
            reviewed,
            page,
            pageSize);

        return Ok(new { success = true, data });
    }

    [HttpPost("scan")]
    public async Task<IActionResult> Scan(
        [FromQuery] int windowDays = 90)
    {
        var count = await _service.ScanAsync(
            CurrentUserId,
            windowDays);

        return Ok(new
        {
            success = true,
            data = new
            {
                newAnomaliesSaved = count
            }
        });
    }
}
