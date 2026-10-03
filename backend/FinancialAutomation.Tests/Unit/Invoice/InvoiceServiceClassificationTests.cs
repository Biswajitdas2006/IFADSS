using FinancialAutomation.Application.Interfaces;
using FinancialAutomation.Application.Services;
using FinancialAutomation.Domain.Entities;
using FluentAssertions;
using Moq;
using Xunit;
using DomainTransaction = FinancialAutomation.Domain.Entities.Transaction;

namespace FinancialAutomation.Tests.Unit.Invoice;
public class InvoiceServiceClassificationTests
{
    private readonly Mock<IInvoiceRepository> _invoiceRepositoryMock;
    private readonly Mock<ITransactionRepository> _transactionRepositoryMock;
    private readonly Mock<IInvoiceFileStorage> _fileStorageMock;
    private readonly Mock<IFastApiClient> _fastApiClientMock;
    private readonly Mock<IInvoiceProcessingQueue> _invoiceProcessingQueueMock;
    private readonly Mock<IClassifyClient> _classifyClientMock;
    private readonly InvoiceService _invoiceService;

    public InvoiceServiceClassificationTests()
    {
        _invoiceRepositoryMock = new Mock<IInvoiceRepository>();
        _transactionRepositoryMock = new Mock<ITransactionRepository>();
        _fileStorageMock = new Mock<IInvoiceFileStorage>();
        _invoiceProcessingQueueMock = new Mock<IInvoiceProcessingQueue>();
        _classifyClientMock = new Mock<IClassifyClient>();

        _fastApiClientMock = new Mock<IFastApiClient>();
        _fastApiClientMock.Setup(c => c.Classify).Returns(_classifyClientMock.Object);

        _invoiceService = new InvoiceService(
            _invoiceRepositoryMock.Object,
            _transactionRepositoryMock.Object,
            _fileStorageMock.Object,
            _fastApiClientMock.Object,
            _invoiceProcessingQueueMock.Object);
    }

    private static DomainTransaction CreateTestTransaction()
    {
        return new DomainTransaction(
            userId: Guid.NewGuid(),
            description: "Staples Inc. - Printer Paper",
            amount: 45.00m,
            transactionDate: DateOnly.FromDateTime(DateTime.UtcNow));
    }

    [Fact]
    public async Task ClassifyTransactionSafelyAsync_WhenClassificationSucceeds_ShouldApplyCategoryAndConfidence()
    {
        var transaction = CreateTestTransaction();

        _classifyClientMock
            .Setup(c => c.ClassifyAsync(transaction.Description, transaction.Amount, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ClassificationResult
            {
                Category = "Office Supplies",
                Confidence = 0.94m,
                ShapExplanation = new ShapExplanation
                {
                    TopFeatures = new() { new ShapFeature { Feature = "embedding_dim_12", Contribution = 0.31m } }
                }
            });

        await _invoiceService.ClassifyTransactionSafelyAsync(transaction, CancellationToken.None);

        transaction.Category.Should().Be("Office Supplies");
        transaction.CategoryConfidence.Should().Be(0.94m);
        transaction.OverriddenByUser.Should().BeFalse(); // AI-assigned, not a human override
        transaction.ShapExplanationJson.Should().NotBeNullOrEmpty();

        _transactionRepositoryMock.Verify(
            r => r.UpdateAsync(transaction, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task ClassifyTransactionSafelyAsync_WhenAiServiceUnreachable_ShouldLeaveTransactionUncategorized()
    {
        var transaction = CreateTestTransaction();

        _classifyClientMock
            .Setup(c => c.ClassifyAsync(transaction.Description, transaction.Amount, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("AI service unreachable after retry."));

        // Should NOT throw — this is the graceful degradation contract from Document 1, Section 22.4
        var act = async () => await _invoiceService.ClassifyTransactionSafelyAsync(transaction, CancellationToken.None);
        await act.Should().NotThrowAsync();

        transaction.Category.Should().BeNull();
        transaction.CategoryConfidence.Should().BeNull();

        _transactionRepositoryMock.Verify(
            r => r.UpdateAsync(It.IsAny<DomainTransaction>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }
}