namespace FinancialAutomation.Application.DTOs.Common;

public class PagedResult<T>
{
    public IReadOnlyList<T> Items { get; }
    public int Page { get; }
    public int PageSize { get; }
    public int TotalItems { get; }
    public int TotalPages => (int)Math.Ceiling(TotalItems / (double)PageSize);

    public PagedResult(IReadOnlyList<T> items, int page, int pageSize, int totalItems)
        => (Items, Page, PageSize, TotalItems) = (items, page, pageSize, totalItems);
}