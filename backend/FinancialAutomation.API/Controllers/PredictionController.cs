using System.Security.Claims;
using FinancialAutomation.API.Common;
using FinancialAutomation.Application.DTOs.Prediction;
using FinancialAutomation.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinancialAutomation.API.Controllers;

[ApiController]
[Route("api/v1/predictions")]
[Authorize]
public class PredictionController : ControllerBase
{
    private readonly IPredictionService _predictionService;

    public PredictionController(IPredictionService predictionService)
    {
        _predictionService = predictionService;
    }

    private Guid CurrentUserId =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub")!);

    [HttpGet]
    public async Task<IActionResult> GetForecast(
        [FromQuery] string metricType,
        [FromQuery] int horizonDays = 30)
    {
        var result = await _predictionService.GetForecastAsync(CurrentUserId, metricType, horizonDays);
        return Ok(ApiResponse<ForecastResponse>.Ok(result));
    }
}
