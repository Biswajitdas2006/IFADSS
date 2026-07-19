using FinancialAutomation.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace FinancialAutomation.Infrastructure.Persistence;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<Transaction> Transactions => Set<Transaction>();
    public DbSet<Anomaly> Anomalies => Set<Anomaly>();
    public DbSet<Prediction> Predictions => Set<Prediction>();
    public DbSet<Log> Logs => Set<Log>();
    public DbSet<Report> Reports => Set<Report>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }
}