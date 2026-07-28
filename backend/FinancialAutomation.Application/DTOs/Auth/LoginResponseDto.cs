namespace FinancialAutomation.Application.DTOs.Auth;

public class LoginResponseDto
{
    public string Token { get; set; } = string.Empty;
    public int ExpiresIn { get; set; }
    public LoginUserDto User { get; set; } = null!;
}

public class LoginUserDto
{
    public Guid Id { get; set; }
    public string Role { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
}