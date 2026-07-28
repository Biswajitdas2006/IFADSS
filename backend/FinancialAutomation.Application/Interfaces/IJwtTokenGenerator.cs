using FinancialAutomation.Domain.Entities;

namespace FinancialAutomation.Application.Interfaces;

public interface IJwtTokenGenerator
{
    string GenerateToken(User user);
}