using FinancialAutomation.Domain.Entities;
using FinancialAutomation.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FinancialAutomation.Infrastructure.Persistence.Configurations;

public class PredictionConfiguration : IEntityTypeConfiguration<Prediction>
{
    public void Configure(EntityTypeBuilder<Prediction> builder)
    {
        builder.ToTable("Predictions");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.MetricType)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(p => p.ForecastDate)
            .IsRequired();

        builder.Property(p => p.PredictedValue)
            .HasPrecision(14, 2)
            .IsRequired();

        builder.Property(p => p.LowerBound)
            .HasPrecision(14, 2);

        builder.Property(p => p.UpperBound)
            .HasPrecision(14, 2);

        builder.Property(p => p.GeneratedAt)
            .HasColumnType("timestamptz")
            .IsRequired();

        // Relationship: Predictions (M) --> Users (1), ON DELETE CASCADE
        builder.HasOne(p => p.User)
            .WithMany(u => u.Predictions)
            .HasForeignKey(p => p.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // Index (Document 4, Section 15.1)
        builder.HasIndex(p => new { p.UserId, p.MetricType, p.ForecastDate })
            .IsUnique()
            .HasDatabaseName("ux_predictions_user_metric_date");
    }
}