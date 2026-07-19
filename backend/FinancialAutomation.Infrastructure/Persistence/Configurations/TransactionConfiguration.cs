using FinancialAutomation.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FinancialAutomation.Infrastructure.Persistence.Configurations;

public class TransactionConfiguration : IEntityTypeConfiguration<Transaction>
{
    public void Configure(EntityTypeBuilder<Transaction> builder)
    {
        builder.ToTable("Transactions", t =>
            t.HasCheckConstraint("CK_Transactions_CategoryConfidence", "\"CategoryConfidence\" IS NULL OR (\"CategoryConfidence\" >= 0 AND \"CategoryConfidence\" <= 1)"));

        builder.HasKey(t => t.Id);

        builder.Property(t => t.Description)
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(t => t.Amount)
            .HasPrecision(14, 2)
            .IsRequired();

        builder.Property(t => t.TransactionDate)
            .IsRequired();

        builder.Property(t => t.Category)
            .HasMaxLength(100);

        builder.Property(t => t.CategoryConfidence)
            .HasPrecision(5, 4);

        builder.Property(t => t.ShapExplanationJson)
            .HasColumnType("jsonb");

        builder.Property(t => t.OverriddenByUser)
            .HasDefaultValue(false)
            .IsRequired();

        builder.Property(t => t.CreatedAt)
            .HasColumnType("timestamptz")
            .IsRequired();

        // Relationship: Transactions (M) --> Users (1), ON DELETE RESTRICT
        builder.HasOne(t => t.User)
            .WithMany(u => u.Transactions)
            .HasForeignKey(t => t.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        // Relationship: Transactions (M) --> Invoices (0..1), ON DELETE SET NULL
        builder.HasOne(t => t.Invoice)
            .WithMany(i => i.Transactions)
            .HasForeignKey(t => t.InvoiceId)
            .OnDelete(DeleteBehavior.SetNull)
            .IsRequired(false);

        // Relationship: Transactions (1) --< Anomalies (0..1), ON DELETE CASCADE
        builder.HasOne(t => t.Anomaly)
            .WithOne(a => a.Transaction)
            .HasForeignKey<Anomaly>(a => a.TransactionId)
            .OnDelete(DeleteBehavior.Cascade);

        // Indexes
        builder.HasIndex(t => new { t.UserId, t.TransactionDate })
            .HasDatabaseName("ix_transactions_userid_date");

        builder.HasIndex(t => t.Category)
            .HasDatabaseName("ix_transactions_category");
    }
}