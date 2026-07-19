using FinancialAutomation.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FinancialAutomation.Infrastructure.Persistence.Configurations;

public class LogConfiguration : IEntityTypeConfiguration<Log>
{
    public void Configure(EntityTypeBuilder<Log> builder)
    {
        builder.ToTable("Logs");

        builder.HasKey(l => l.Id);

        builder.Property(l => l.Action)
            .HasMaxLength(150)
            .IsRequired();

        builder.Property(l => l.Details)
            .HasColumnType("text");

        builder.Property(l => l.Timestamp)
            .HasColumnType("timestamptz")
            .IsRequired();

        // Relationship: Logs (M) --> Users (0..1), ON DELETE SET NULL
        builder.HasOne(l => l.User)
            .WithMany()
            .HasForeignKey(l => l.UserId)
            .OnDelete(DeleteBehavior.SetNull)
            .IsRequired(false);

        // Index (Document 4, Section 16.1)
        builder.HasIndex(l => new { l.UserId, l.Timestamp })
            .HasDatabaseName("ix_logs_userid_timestamp")
            .IsDescending(false, true);
    }
}