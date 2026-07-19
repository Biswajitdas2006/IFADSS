using FinancialAutomation.Domain.Entities;
using FinancialAutomation.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FinancialAutomation.Infrastructure.Persistence.Configurations;

public class ReportConfiguration : IEntityTypeConfiguration<Report>
{
    public void Configure(EntityTypeBuilder<Report> builder)
    {
        builder.ToTable("Reports", t =>
            t.HasCheckConstraint("CK_Reports_PeriodEnd", "\"PeriodEnd\" >= \"PeriodStart\""));

        builder.HasKey(r => r.Id);

        builder.Property(r => r.ReportType)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(r => r.PeriodStart)
            .IsRequired();

        builder.Property(r => r.PeriodEnd)
            .IsRequired();

        builder.Property(r => r.FilePath)
            .HasMaxLength(500);

        builder.Property(r => r.GeneratedAt)
            .HasColumnType("timestamptz")
            .IsRequired();

        // Relationship: Reports (M) --> Users (1), ON DELETE CASCADE
        builder.HasOne(r => r.User)
            .WithMany(u => u.Reports)
            .HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // Index (Document 4, Section 17.1)
        builder.HasIndex(r => new { r.UserId, r.GeneratedAt })
            .HasDatabaseName("ix_reports_userid_generatedat")
            .IsDescending(false, true);
    }
}