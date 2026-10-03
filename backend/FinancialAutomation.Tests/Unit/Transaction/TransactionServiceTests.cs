using FinancialAutomation.Application.DTOs.Transaction;
using FinancialAutomation.Application.Interfaces;
using FinancialAutomation.Application.Services;
using FinancialAutomation.Domain.Entities;
using FinancialAutomation.Domain.Exceptions;
using FluentAssertions;
using Moq;
using Xunit;

namespace FinancialAutomation.Tests.Unit.Transaction;

public class TransactionServiceTests
{
    private readonly Mock<ITransactionRepository> _transactionRepositoryMock;
    private readonly TransactionService _transactionService;
    private readonly Guid _userId = Guid.NewGuid();

    public TransactionServiceTests()
    {
        _transactionRepositoryMock = new Mock<ITransactionRepository>();
        _transactionService = new TransactionService(_transactionRepositoryMock.Object);
    }

    private Domain.Entities.Transaction CreateTestTransaction(Guid? userId = null)
    {
        return new Domain.Entities.Transaction(
            userId: userId ?? _userId,
            description: "Staples Inc. - Office Supplies",
            amount: 45.00m,
            transactionDate: DateOnly.FromDateTime(DateTime.UtcNow));
    }

    [Fact]
    public async Task UpdateCategoryAsync_WithValidCategory_ShouldSucceedAndSetFullConfidence()
    {
        var transaction = CreateTestTransaction();

        _transactionRepositoryMock
            .Setup(r => r.GetByIdAsync(transaction.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(transaction);

        var result = await _transactionService.UpdateCategoryAsync(_userId, transaction.Id, "Travel");

        result.Category.Should().Be("Travel");
        result.CategoryConfidence.Should().Be(1.0m);
        result.OverriddenByUser.Should().BeTrue();

        _transactionRepositoryMock.Verify(
            r => r.UpdateAsync(It.Is<Domain.Entities.Transaction>(t => t.Category == "Travel" && t.OverriddenByUser), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task UpdateCategoryAsync_WithInvalidCategory_ShouldThrowValidationException()
    {
        var transaction = CreateTestTransaction();

        _transactionRepositoryMock
            .Setup(r => r.GetByIdAsync(transaction.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(transaction);

        var act = async () => await _transactionService.UpdateCategoryAsync(_userId, transaction.Id, "NotARealCategory");

        await act.Should().ThrowAsync<ValidationException>();

        _transactionRepositoryMock.Verify(
            r => r.UpdateAsync(It.IsAny<Domain.Entities.Transaction>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task UpdateCategoryAsync_WhenTransactionBelongsToAnotherUser_ShouldThrowNotFoundException()
    {
        var otherUsersTransaction = CreateTestTransaction(userId: Guid.NewGuid());

        _transactionRepositoryMock
            .Setup(r => r.GetByIdAsync(otherUsersTransaction.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(otherUsersTransaction);

        var act = async () => await _transactionService.UpdateCategoryAsync(_userId, otherUsersTransaction.Id, "Travel");

        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task UpdateCategoryAsync_WhenTransactionDoesNotExist_ShouldThrowNotFoundException()
    {
        var missingId = Guid.NewGuid();

        _transactionRepositoryMock
            .Setup(r => r.GetByIdAsync(missingId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Domain.Entities.Transaction?)null);

        var act = async () => await _transactionService.UpdateCategoryAsync(_userId, missingId, "Travel");

        await act.Should().ThrowAsync<NotFoundException>();
    }
}