using FinancialAutomation.Domain.Entities;

namespace FinancialAutomation.Application.Interfaces;

public interface IUserRepository : IRepository<User>
{
    Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default);
}