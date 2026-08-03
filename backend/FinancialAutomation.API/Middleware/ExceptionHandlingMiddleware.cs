using System.Net;
using System.Text.Json;
using FinancialAutomation.API.Common;
using FinancialAutomation.Domain.Exceptions;

namespace FinancialAutomation.API.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
    try
    {
        await _next(context);
    }
    catch (Exception ex)
    {
        var (statusCode, code) = ex switch
        {
            ValidationException => (HttpStatusCode.BadRequest, "VALIDATION_ERROR"),
            NotFoundException => (HttpStatusCode.NotFound, "NOT_FOUND"),
            ConflictException => (HttpStatusCode.Conflict, "CONFLICT"),
            UnauthorizedAccessException => (HttpStatusCode.Unauthorized, "UNAUTHORIZED"),
            _ => (HttpStatusCode.InternalServerError, "INTERNAL_ERROR")
        };

        if (statusCode == HttpStatusCode.InternalServerError)
        {
            _logger.LogError(ex, "Unhandled exception");
        }
        else
        {
            _logger.LogWarning("{ExceptionType}: {Message}", ex.GetType().Name, ex.Message);
        }

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;

        var response = ApiResponse<object>.Fail(code, ex.Message);
        await context.Response.WriteAsync(JsonSerializer.Serialize(response));
    }
}
    
}