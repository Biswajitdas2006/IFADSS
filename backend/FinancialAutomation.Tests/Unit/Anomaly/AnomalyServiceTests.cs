using AutoMapper;
using FinancialAutomation.Application.DTOs.Anomaly;
using FinancialAutomation.Application.Interfaces;
using FinancialAutomation.Application.Services;
using FinancialAutomation.Domain.Entities;
using FinancialAutomation.Domain.Enums;
using FinancialAutomation.Domain.Exceptions;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using AnomalyEntity = FinancialAutomation.Domain.Entities.Anomaly;
using TransactionEntity = FinancialAutomation.Domain.Entities.Transaction;

namespace FinancialAutomation.Tests.Unit.Anomaly;

public class AnomalyServiceTests
{
    private readonly Mock<IAnomalyRepository> _anomalyRepositoryMock = new();
    private readonly Mock<ITransactionRepository> _transactionRepositoryMock = new();
    private readonly Mock<IAnomalyApiClient> _anomalyApiClientMock = new();
    private readonly AnomalyService _anomalyService;
    private readonly Guid _userId = Guid.NewGuid();

    public AnomalyServiceTests()
    {
        _anomalyService = new AnomalyService(
            _anomalyRepositoryMock.Object,
            _transactionRepositoryMock.Object,
            Mock.Of<IMapper>(),
            _anomalyApiClientMock.Object,
            Mock.Of<ILogger<AnomalyService>>());
    }

    [Fact]
    public async Task MarkReviewedAsync_WhenAnomalyBelongsToUser_MarksReviewedAndReturnsTimestamp()
    {
        var anomaly = CreateAnomaly();
        _anomalyRepositoryMock
            .Setup(repository => repository.GetByIdForUserAsync(anomaly.Id, _userId))
            .ReturnsAsync(anomaly);
        _anomalyRepositoryMock
            .Setup(repository => repository.MarkReviewedAsync(anomaly.Id))
            .Callback(() => anomaly.MarkReviewed())
            .Returns(Task.CompletedTask);

        var result = await _anomalyService.MarkReviewedAsync(anomaly.Id, _userId);

        result.Id.Should().Be(anomaly.Id);
        result.Reviewed.Should().BeTrue();
        result.ReviewedAt.Should().Be(anomaly.ReviewedAt);
        _anomalyRepositoryMock.Verify(
            repository => repository.MarkReviewedAsync(anomaly.Id),
            Times.Once);
    }

    [Fact]
    public async Task MarkReviewedAsync_WhenAlreadyReviewed_IsIdempotent()
    {
        var anomaly = CreateAnomaly();
        anomaly.MarkReviewed();
        var originalReviewedAt = anomaly.ReviewedAt;

        _anomalyRepositoryMock
            .Setup(repository => repository.GetByIdForUserAsync(anomaly.Id, _userId))
            .ReturnsAsync(anomaly);

        var result = await _anomalyService.MarkReviewedAsync(anomaly.Id, _userId);

        result.Reviewed.Should().BeTrue();
        result.ReviewedAt.Should().Be(originalReviewedAt);
        _anomalyRepositoryMock.Verify(
            repository => repository.MarkReviewedAsync(It.IsAny<Guid>()),
            Times.Never);
    }

    [Fact]
    public async Task MarkReviewedAsync_WhenAnomalyIsNotOwnedByUser_ThrowsNotFoundException()
    {
        var anomalyId = Guid.NewGuid();
        _anomalyRepositoryMock
            .Setup(repository => repository.GetByIdForUserAsync(anomalyId, _userId))
            .ReturnsAsync((AnomalyEntity?)null);

        var act = () => _anomalyService.MarkReviewedAsync(anomalyId, _userId);

        await act.Should().ThrowAsync<NotFoundException>();
        _anomalyRepositoryMock.Verify(
            repository => repository.MarkReviewedAsync(It.IsAny<Guid>()),
            Times.Never);
    }

    [Fact]
    public async Task ScanAsync_SendsUserTransactionsToAiService()
    {
        var transaction = new TransactionEntity(
            _userId,
            "Office supplies",
            42.50m,
            new DateOnly(2026, 10, 1));
        AnomalyScanRequest? capturedRequest = null;

        _transactionRepositoryMock
            .Setup(repository => repository.GetForAnomalyScanAsync(
                _userId,
                It.IsAny<DateOnly>(),
                It.IsAny<DateOnly>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((IReadOnlyList<TransactionEntity>)new[] { transaction });
        _anomalyApiClientMock
            .Setup(client => client.ScanAsync(
                It.IsAny<AnomalyScanRequest>(),
                It.IsAny<CancellationToken>()))
            .Callback<AnomalyScanRequest, CancellationToken>((request, _) => capturedRequest = request)
            .ReturnsAsync(new AnomalyScanResponse());

        var savedCount = await _anomalyService.ScanAsync(_userId, 30);

        savedCount.Should().Be(0);
        capturedRequest.Should().NotBeNull();
        capturedRequest!.Transactions.Should().ContainSingle().Which.Should().BeEquivalentTo(
            new FinancialAutomation.Application.DTOs.Ai.AiTransaction(
                transaction.Id.ToString("D"),
                "Office supplies",
                42.50m,
                "2026-10-01"));
    }

    private static AnomalyEntity CreateAnomaly()
        => new(Guid.NewGuid(), 0.8m, "Unusual transaction", AnomalySeverity.High);
}
