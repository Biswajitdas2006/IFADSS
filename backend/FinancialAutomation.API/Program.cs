using Microsoft.EntityFrameworkCore;
using FinancialAutomation.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

// Register AppDbContext with PostgreSQL (Neon)
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// One-time connection test — safe to remove once you trust the connection
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    Console.WriteLine(db.Database.CanConnect() ? "✅ Connected to Neon" : "❌ Connection failed");
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();