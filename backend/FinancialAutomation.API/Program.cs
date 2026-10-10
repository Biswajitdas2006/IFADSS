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

builder.Services.AddScoped<
    IUserRepository,
    UserRepository>();

builder.Services.AddScoped<
    IInvoiceRepository,
    InvoiceRepository>();

builder.Services.AddScoped<
    ITransactionRepository,
    TransactionRepository>();

builder.Services.AddScoped<
    IAnomalyRepository,
    AnomalyRepository>();

builder.Services.AddScoped<
    IPredictionRepository,
    PredictionRepository>();

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

builder.Services.AddScoped<
    IInvoiceOcrProcessor,
    InvoiceService>();

builder.Services.AddScoped<
    IPredictionService,
    PredictionService>();

// ============================================================
// INVOICE BACKGROUND PROCESSING
// ============================================================

// Singleton is intentional.
// The queue must be shared between HTTP requests
// and the BackgroundService.

builder.Services.AddSingleton<
    IInvoiceProcessingQueue,
    InvoiceProcessingQueue>();

builder.Services.AddHostedService<
    InvoiceProcessingWorker>();

// ============================================================
// FASTAPI / AI SERVICE
// ============================================================

builder.Services.Configure<FastApiOptions>(
    builder.Configuration.GetSection("FastApi"));


// ------------------------------------------------------------
// MAIN FASTAPI CLIENT
// ------------------------------------------------------------

builder.Services.AddHttpClient<
    IFastApiClient,
    FastApiClient>((sp, client) =>
    {
        var baseUrl =
            builder.Configuration["FastApi:BaseUrl"];

        if (string.IsNullOrWhiteSpace(baseUrl))
        {
            throw new InvalidOperationException(
                "FastApi:BaseUrl is not configured.");
        }

        // Always normalize the URL.
        //
        // Example:
        //
        // https://example.trycloudflare.com
        //
        // becomes:
        //
        // https://example.trycloudflare.com/
        //
        // This prevents accidental double-slash URLs.

        client.BaseAddress =
            new Uri(
                baseUrl.TrimEnd('/') + "/");

        // Outer HTTP safety timeout.
        //
        // OCR has its own internal 600-second timeout
        // inside FastApiClient.
        //
        // This 11-minute timeout gives a small safety margin.

        client.Timeout =
            TimeSpan.FromMinutes(11);
    });


// ------------------------------------------------------------
// ANOMALY API CLIENT
// ------------------------------------------------------------

builder.Services.AddHttpClient<
    IAnomalyApiClient,
    AnomalyApiClient>(client =>
    {
        var baseUrl =
            builder.Configuration["FastApi:BaseUrl"];

        if (string.IsNullOrWhiteSpace(baseUrl))
        {
            throw new InvalidOperationException(
                "FastApi:BaseUrl is not configured.");
        }

        client.BaseAddress =
            new Uri(
                baseUrl.TrimEnd('/') + "/");

        // Anomaly scanning should be much faster
        // than the asynchronous OCR pipeline.

        client.Timeout =
            TimeSpan.FromSeconds(15);
    });

builder.Services.AddHttpClient<
    IPredictionApiClient,
    PredictionApiClient>(client =>
    {
        var baseUrl =
            builder.Configuration["FastApi:BaseUrl"];

        if (string.IsNullOrWhiteSpace(baseUrl))
        {
            throw new InvalidOperationException(
                "FastApi:BaseUrl is not configured.");
        }

        client.BaseAddress =
            new Uri(
                baseUrl.TrimEnd('/') + "/");

        client.Timeout =
            TimeSpan.FromSeconds(30);
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

builder.Services.AddScoped<
    IAnomalyService,
    AnomalyService>();

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

                ValidIssuer =
                    jwtIssuer,

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

builder.Services.AddSingleton(
    provider =>
        new MapperConfiguration(
            config =>
                config.AddProfile<AutoMapperProfile>(),
            provider.GetRequiredService<
                ILoggerFactory>()));

builder.Services.AddSingleton<IMapper>(
    provider =>
        provider
            .GetRequiredService<
                MapperConfiguration>()
            .CreateMapper());

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

            Type =
                SecuritySchemeType.Http,

            Scheme = "Bearer",

            BearerFormat = "JWT",

            In =
                ParameterLocation.Header,

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

app.UseMiddleware<
    ExceptionHandlingMiddleware>();

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

app.UseCors(
    "AllowFrontend");

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