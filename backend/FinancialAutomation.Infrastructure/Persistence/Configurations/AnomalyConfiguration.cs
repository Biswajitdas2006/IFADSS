using FinancialAutomation.Domain.Entities;
using FinancialAutomation.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FinancialAutomation.Infrastructure.Persistence.Configurations;

public class AnomalyConfiguration : IEntityTypeConfiguration<Anomaly>
{
    public void Configure(EntityTypeBuilder<Anomaly> builder)
    {
        builder.ToTable("Anomalies", t =>
            t.HasCheckConstraint("CK_Anomalies_AnomalyScore", "\"AnomalyScore\" >= 0 AND \"AnomalyScore\" <= 1"));

        builder.HasKey(a => a.Id);

        builder.Property(a => a.AnomalyScore)
            .HasPrecision(6, 5)
            .IsRequired();

        builder.Property(a => a.Reason)
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(a => a.Severity)
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(a => a.Reviewed)
            .HasDefaultValue(false)
            .IsRequired();

        builder.Property(a => a.ReviewedAt)
            .HasColumnType("timestamptz");

        builder.Property(a => a.DetectedAt)
            .HasColumnType("timestamptz")
            .IsRequired();

        // Indexes (Document 4, Section 14.1)
        builder.HasIndex(a => a.TransactionId)
            .IsUnique()
            .HasDatabaseName("ux_anomalies_transactionid");

        builder.HasIndex(a => new { a.Severity, a.Reviewed })
            .HasDatabaseName("ix_anomalies_severity_reviewed");
    }
}