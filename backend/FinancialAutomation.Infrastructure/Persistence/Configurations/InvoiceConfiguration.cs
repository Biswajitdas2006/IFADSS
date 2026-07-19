using FinancialAutomation.Domain.Entities;
using FinancialAutomation.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FinancialAutomation.Infrastructure.Persistence.Configurations;

public class InvoiceConfiguration : IEntityTypeConfiguration<Invoice>
{
    public void Configure(EntityTypeBuilder<Invoice> builder)
    {
        builder.ToTable("Invoices", t =>
            t.HasCheckConstraint("CK_Invoices_TotalAmount", "\"TotalAmount\" >= 0"));

        builder.HasKey(i => i.Id);

        builder.Property(i => i.FileName)
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(i => i.FilePath)
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(i => i.VendorName)
            .HasMaxLength(150);

        builder.Property(i => i.InvoiceDate);

        builder.Property(i => i.TotalAmount)
            .HasPrecision(14, 2);

        builder.Property(i => i.TaxAmount)
            .HasPrecision(14, 2);

        builder.Property(i => i.Status)
            .HasConversion<string>()
            .HasMaxLength(30)
            .HasDefaultValue(InvoiceStatus.Pending)
            .IsRequired();

        builder.Property(i => i.FailureReason)
            .HasMaxLength(500);

        builder.Property(i => i.UploadedAt)
            .HasColumnType("timestamptz")
            .IsRequired();

        builder.Property(i => i.ProcessedAt)
            .HasColumnType("timestamptz");

        // Relationship: Invoices (M) --> Users (1), ON DELETE RESTRICT
        builder.HasOne(i => i.User)
            .WithMany(u => u.Invoices)
            .HasForeignKey(i => i.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        // Indexes (Document 4, Section 12.1)
        builder.HasIndex(i => new { i.UserId, i.Status })
            .HasDatabaseName("ix_invoices_userid_status");

        builder.HasIndex(i => i.UploadedAt)
            
            .HasDatabaseName("ix_invoices_uploadedat")
            .IsDescending(true);
    }
}