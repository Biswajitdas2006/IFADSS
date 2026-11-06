using FinancialAutomation.Application.DTOs.Dashboard;
using FinancialAutomation.Application.Interfaces;
using FinancialAutomation.Application.Services;
using FinancialAutomation.Domain.Exceptions;
using FluentAssertions;
using Moq;

namespace FinancialAutomation.Tests.Unit.Dashboard;

public class DashboardServiceTests
{
    private readonly Mock<ITransactionRepository> _transactions = new();
    private readonly Mock<IAnomalyRepository> _anomalies = new();
    private readonly DashboardService _service;
    private readonly Guid _userId = Guid.NewGuid();

    public DashboardServiceTests()
    {
        _service = new DashboardService(_transactions.Object, _anomalies.Object);
    }

    [Fact]
    public async Task GetSummaryAsync_WithExplicitRange_ReturnsTotalsCategoriesAndOpenAnomalyCount()
    {
        var from = new DateOnly(2026, 10, 1);
        var to = new DateOnly(2026, 10, 31);
        var categories = new List<CategorySpendDto>
        {
            new("Office Supplies", 3200m)
        };

        _transactions
            .Setup(repository => repository.GetTotalsAsync(_userId, from, to))
            .ReturnsAsync(new DashboardTotals(84200m, 61230m));
        _transactions
            .Setup(repository => repository.GetTopCategoriesAsync(_userId, from, to, 5))
            .ReturnsAsync(categories);
        _anomalies
            .Setup(repository => repository.CountOpenAsync(_userId))
            .ReturnsAsync(3);

        var result = await _service.GetSummaryAsync(_userId, "2026-10-01", "2026-10-31", true);

        result.TotalIncome.Should().Be(84200m);
        result.TotalExpense.Should().Be(61230m);
        result.NetCashFlow.Should().Be(22970m);
        result.OpenAnomalies.Should().Be(3);
        result.TopCategories.Should().BeEquivalentTo(categories);
        result.From.Should().Be(from);
        result.To.Should().Be(to);
    }

    [Fact]
    public async Task GetSummaryAsync_WithoutAnomalyAccess_ReturnsNullAndSkipsCount()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var from = new DateOnly(today.Year, today.Month, 1);
        var to = from.AddMonths(1).AddDays(-1);

        _transactions
            .Setup(repository => repository.GetTotalsAsync(_userId, from, to))
            .ReturnsAsync(new DashboardTotals(0m, 0m));
        _transactions
            .Setup(repository => repository.GetTopCategoriesAsync(_userId, from, to, 5))
            .ReturnsAsync(new List<CategorySpendDto>());

        var result = await _service.GetSummaryAsync(_userId, null, null, false);

        result.OpenAnomalies.Should().BeNull();
        result.From.Should().Be(from);
        result.To.Should().Be(to);
        _anomalies.Verify(repository => repository.CountOpenAsync(It.IsAny<Guid>()), Times.Never);
    }

    [Theory]
    [InlineData("2026-13-01", "from")]
    [InlineData("10-01-2026", "from")]
    public async Task GetSummaryAsync_WithInvalidDate_ThrowsValidationException(string from, string field)
    {
        var act = () => _service.GetSummaryAsync(_userId, from, null, false);

        var exception = await act.Should().ThrowAsync<ValidationException>();
        exception.Which.Errors.Should().ContainKey(field);
        _transactions.Verify(
            repository => repository.GetTotalsAsync(
                It.IsAny<Guid>(), It.IsAny<DateOnly>(), It.IsAny<DateOnly>()),
            Times.Never);
    }

    [Fact]
    public async Task GetSummaryAsync_WhenFromIsAfterTo_ThrowsValidationException()
    {
        var act = () => _service.GetSummaryAsync(_userId, "2026-12-01", "2026-01-01", false);

        var exception = await act.Should().ThrowAsync<ValidationException>();
        exception.Which.Errors.Should().ContainKey("from");
        _transactions.Verify(
            repository => repository.GetTotalsAsync(
                It.IsAny<Guid>(), It.IsAny<DateOnly>(), It.IsAny<DateOnly>()),
            Times.Never);
    }
}
