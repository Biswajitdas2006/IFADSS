using FinancialAutomation.Application.DTOs.Auth;
using FinancialAutomation.Application.Interfaces;
using FinancialAutomation.Domain.Entities;
using FinancialAutomation.Domain.Exceptions;

namespace FinancialAutomation.Application.Services;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;

    public AuthService(
        IUserRepository userRepository,
        IPasswordHasher passwordHasher,
        IJwtTokenGenerator jwtTokenGenerator)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _jwtTokenGenerator = jwtTokenGenerator;
    }

    public async Task<RegisterResponseDto> RegisterAsync(RegisterRequestDto request, CancellationToken cancellationToken = default)
    {
        var existingUser = await _userRepository.GetByEmailAsync(request.Email, cancellationToken);
        if (existingUser is not null)
            throw new ConflictException($"A user with email '{request.Email}' is already registered.");

        var passwordHash = _passwordHasher.Hash(request.Password);

        var user = new User(
            fullName: request.FullName.Trim(),
            email: request.Email.Trim(),
            passwordHash: passwordHash,
            companyName: request.CompanyName?.Trim());

        await _userRepository.AddAsync(user, cancellationToken);

        return new RegisterResponseDto
        {
            Id = user.Id,
            Email = user.Email,
            Role = user.Role.ToString(),
            CreatedAt = user.CreatedAt
        };
    }

    public async Task<LoginResponseDto> LoginAsync(LoginRequestDto request, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByEmailAsync(request.Email, cancellationToken);
        if (user is null || !_passwordHasher.Verify(request.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Invalid email or password.");

        var token = _jwtTokenGenerator.GenerateToken(user);

        return new LoginResponseDto
        {
            Token = token,
            ExpiresIn = 3600,
            User = new LoginUserDto
            {
                Id = user.Id,
                Role = user.Role.ToString(),
                Email = user.Email
            }
        };
    }

    public async Task<CurrentUserDto> GetCurrentUserAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(userId, cancellationToken);
        if (user is null)
            throw new NotFoundException(nameof(User), userId);

        return new CurrentUserDto
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Role = user.Role.ToString(),
            CompanyName = user.CompanyName
        };
    }
}