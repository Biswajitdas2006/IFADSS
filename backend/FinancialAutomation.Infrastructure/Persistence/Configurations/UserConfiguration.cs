using FinancialAutomation.Domain.Entities;
using FinancialAutomation.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FinancialAutomation.Infrastructure.Persistence.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("Users");

        builder.HasKey(u => u.Id);

        builder.Property(u => u.FullName)
            .HasMaxLength(150)
            .IsRequired();

        builder.Property(u => u.Email)
            .HasMaxLength(150)
            .IsRequired();

        builder.HasIndex(u => u.Email)
            .IsUnique();

        builder.Property(u => u.PasswordHash)
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(u => u.Role)
            .HasConversion<string>()
            .HasMaxLength(30)
            .HasDefaultValue(UserRole.Owner)
            .IsRequired();

        builder.Property(u => u.CompanyName)
            .HasMaxLength(150);

        builder.Property(u => u.CreatedAt)
            .HasColumnType("timestamptz")
            .IsRequired();

        builder.Property(u => u.UpdatedAt)
            .HasColumnType("timestamptz");
    }
}