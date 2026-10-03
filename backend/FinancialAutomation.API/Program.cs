using System.Text;

using AutoMapper;

using FinancialAutomation.Application.Interfaces;

using FinancialAutomation.Application.Mappings;

using FinancialAutomation.Application.Services;

using FinancialAutomation.API.Middleware;

using FinancialAutomation.Infrastructure.BackgroundJobs;

using FinancialAutomation.Infrastructure.ExternalServices;

using FinancialAutomation.Infrastructure.Logging;

using FinancialAutomation.Infrastructure.Persistence;

using FinancialAutomation.Infrastructure.Repositories;

using FinancialAutomation.Infrastructure.Security;

using FinancialAutomation.Infrastructure.Storage;

using Microsoft.AspNetCore.Authentication.JwtBearer;

using Microsoft.EntityFrameworkCore;

using Microsoft.IdentityModel.Tokens;

using Microsoft.OpenApi.Models;

using Serilog;

// ============================================================
// BOOTSTRAP LOGGER
// ============================================================

// Catches startup errors before the full Serilog configuration
// is loaded.
// ============================================================

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

var builder = WebApplication.CreateBuilder(args);

// ============================================================
// SERILOG
// ============================================================

builder.Host.UseSerilog((context, services, loggerConfig) =>
{
    SerilogConfig.Configure(
        loggerConfig,
        context.Configuration);
});

// ============================================================
// DATABASE
// ============================================================

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString(
            "DefaultConnection")));

// ============================================================
// REPOSITORIES
// ============================================================

builder.Services.AddScoped<IUserRepository, UserRepository>();

builder.Services.AddScoped<
    IInvoiceRepository,
    InvoiceRepository>();

builder.Services.AddScoped<
    ITransactionRepository,
    TransactionRepository>();

// Anomaly repository
builder.Services.AddScoped<IAnomalyRepository, AnomalyRepository>();

// ============================================================
// FILE STORAGE
// ============================================================

builder.Services.AddScoped<
    IInvoiceFileStorage,
    LocalInvoiceFileStorage>();

// ============================================================
// INVOICE SERVICES
// ============================================================

builder.Services.AddScoped<
    IInvoiceService,
    InvoiceService>();

// Invoice OCR processor.
//
// The BackgroundService creates a new DI scope for each job,
// so InvoiceService receives a fresh AppDbContext.
builder.Services.AddScoped<
    IInvoiceOcrProcessor,
    InvoiceService>();

// ============================================================
// INVOICE BACKGROUND PROCESSING
// ============================================================

// In-memory bounded queue.
//
// Singleton is intentional because the queue must be shared
// between HTTP requests and the BackgroundService.
builder.Services.AddSingleton<
    IInvoiceProcessingQueue,
    InvoiceProcessingQueue>();

// Background worker.
//
// This continuously consumes queued invoice-processing jobs.
builder.Services.AddHostedService<
    InvoiceProcessingWorker>();

// ============================================================
// FASTAPI / AI SERVICE
// ============================================================

builder.Services.Configure<FastApiOptions>(
    builder.Configuration.GetSection("FastApi"));

builder.Services.AddHttpClient<
    IFastApiClient,
    FastApiClient>((sp, client) =>
    {
        var baseUrl =
            builder.Configuration["FastApi:BaseUrl"]
            ?? throw new InvalidOperationException(
                "FastApi:BaseUrl is not configured.");

        client.BaseAddress = new Uri(baseUrl);

        // Outer safety net.
        //
        // Individual clients have their own shorter
        // per-call timeout.
        client.Timeout = TimeSpan.FromSeconds(120);
    });

builder.Services.AddHttpClient<
    IAnomalyApiClient,
    AnomalyApiClient>(client =>
    {
        var baseUrl =
            builder.Configuration["FastApi:BaseUrl"]
            ?? throw new InvalidOperationException(
                "FastApi:BaseUrl is not configured.");

        client.BaseAddress = new Uri(baseUrl);
        client.Timeout = TimeSpan.FromSeconds(15);
    });

// ============================================================
// SECURITY
// ============================================================

builder.Services.AddScoped<
    IPasswordHasher,
    PasswordHasher>();

builder.Services.AddScoped<
    IJwtTokenGenerator,
    JwtTokenGenerator>();

// ============================================================
// APPLICATION SERVICES
// ============================================================

builder.Services.AddScoped<
    IAuthService,
    AuthService>();

builder.Services.AddScoped<
    ITransactionService,
    TransactionService>();

// Anomaly service
builder.Services.AddScoped<IAnomalyService, AnomalyService>();

// ============================================================
// JWT AUTHENTICATION
// ============================================================

var jwtSecret =
    builder.Configuration["Jwt:Secret"]
    ?? throw new InvalidOperationException(
        "Jwt:Secret is not configured.");

var jwtIssuer =
    builder.Configuration["Jwt:Issuer"]
    ?? "IFADSS";

builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme =
            JwtBearerDefaults.AuthenticationScheme;

        options.DefaultChallengeScheme =
            JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters =
            new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = jwtIssuer,
                ValidateAudience = false,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey =
                    new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(
                            jwtSecret))
            };
    });

builder.Services.AddAuthorization();

// ============================================================
// CORS
// ============================================================

builder.Services.AddCors(options =>
{
    options.AddPolicy(
        "AllowFrontend",
        policy =>
        {
            policy
                .WithOrigins(
                    "http://localhost:5173")
                .AllowAnyHeader()
                .AllowAnyMethod();
        });
});

// ============================================================
// MVC / API
// ============================================================

builder.Services.AddControllers();

builder.Services.AddSingleton(provider => new MapperConfiguration(
    config => config.AddProfile<AutoMapperProfile>(),
    provider.GetRequiredService<ILoggerFactory>()));
builder.Services.AddSingleton<IMapper>(provider =>
    provider.GetRequiredService<MapperConfiguration>().CreateMapper());

builder.Services.AddEndpointsApiExplorer();

// ============================================================
// SWAGGER
// ============================================================

builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition(
        "Bearer",
        new OpenApiSecurityScheme
        {
            Name = "Authorization",
            Type = SecuritySchemeType.Http,
            Scheme = "Bearer",
            BearerFormat = "JWT",
            In = ParameterLocation.Header,
            Description =
                "Enter: Bearer {your token}"
        });

    options.AddSecurityRequirement(
        new OpenApiSecurityRequirement
        {
            {
                new OpenApiSecurityScheme
                {
                    Reference =
                        new OpenApiReference
                        {
                            Type =
                                ReferenceType.SecurityScheme,
                            Id = "Bearer"
                        }
                },
                Array.Empty<string>()
            }
        });
});

// ============================================================
// BUILD APPLICATION
// ============================================================

var app = builder.Build();

// ============================================================
// REQUEST LOGGING
// ============================================================

app.UseSerilogRequestLogging();

// ============================================================
// GLOBAL EXCEPTION HANDLING
// ============================================================

app.UseMiddleware<ExceptionHandlingMiddleware>();

// ============================================================
// SWAGGER
// ============================================================

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// ============================================================
// HTTPS
// ============================================================

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

// ============================================================
// CORS
// ============================================================

app.UseCors("AllowFrontend");

// ============================================================
// AUTHENTICATION / AUTHORIZATION
// ============================================================

app.UseAuthentication();

app.UseAuthorization();

// ============================================================
// CONTROLLERS
// ============================================================

app.MapControllers();

// ============================================================
// RUN APPLICATION
// ============================================================

try
{
    Log.Information(
        "Starting FinancialAutomation.API");

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(
        ex,
        "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
