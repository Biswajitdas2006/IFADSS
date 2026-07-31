using FinancialAutomation.Application.DTOs.Auth;
using FinancialAutomation.Application.Interfaces;
using FinancialAutomation.Application.Services;
using FinancialAutomation.Domain.Entities;
using FinancialAutomation.Domain.Enums;
using FinancialAutomation.Domain.Exceptions;
using FluentAssertions;
using Moq;
using Xunit;

namespace FinancialAutomation.Tests.Unit.Auth;

public class AuthServiceTests
{
    private readonly Mock<IUserRepository> _userRepositoryMock;
    private readonly Mock<IPasswordHasher> _passwordHasherMock;
    private readonly Mock<IJwtTokenGenerator> _jwtTokenGeneratorMock;
    private readonly AuthService _authService;

    public AuthServiceTests()
    {
        _userRepositoryMock = new Mock<IUserRepository>();
        _passwordHasherMock = new Mock<IPasswordHasher>();
        _jwtTokenGeneratorMock = new Mock<IJwtTokenGenerator>();

        _authService = new AuthService(
            _userRepositoryMock.Object,
            _passwordHasherMock.Object,
            _jwtTokenGeneratorMock.Object);
    }

    // Helper to build a valid User via its real constructor (private setters, so we go through the ctor)
    private static User CreateTestUser(string email = "test@example.com", string passwordHash = "hashed-password")
    {
        return new User(
            fullName: "Test User",
            email: email,
            passwordHash: passwordHash,
            role: UserRole.Owner,
            companyName: "Test Co");
    }

    // ---------- REGISTER ----------

    [Fact]
    public async Task RegisterAsync_WithValidData_ShouldSucceedAndReturnUserDetails()
    {
        // Arrange
        var request = new RegisterRequestDto
        {
            FullName = "Jane Doe",
            Email = "jane@example.com",
            Password = "SecurePass123!",
            CompanyName = "Jane's Bakery"
        };

        _userRepositoryMock
            .Setup(r => r.GetByEmailAsync(request.Email, It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null); // no existing user with this email

        _passwordHasherMock
            .Setup(h => h.Hash(request.Password))
            .Returns("hashed-secure-pass");

        _userRepositoryMock
            .Setup(r => r.AddAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _authService.RegisterAsync(request);

        // Assert
        result.Should().NotBeNull();
        result.Email.Should().Be(request.Email);
        result.Role.Should().Be(UserRole.Owner.ToString());

        _userRepositoryMock.Verify(
            r => r.AddAsync(It.Is<User>(u => u.Email == request.Email), It.IsAny<CancellationToken>()),
            Times.Once);
        _passwordHasherMock.Verify(h => h.Hash(request.Password), Times.Once);
    }

    [Fact]
    public async Task RegisterAsync_WhenEmailAlreadyExists_ShouldThrowConflictException()
    {
        // Arrange
        var request = new RegisterRequestDto
        {
            FullName = "Jane Doe",
            Email = "existing@example.com",
            Password = "SecurePass123!"
        };

        var existingUser = CreateTestUser(email: request.Email);

        _userRepositoryMock
            .Setup(r => r.GetByEmailAsync(request.Email, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingUser);

        // Act
        var act = async () => await _authService.RegisterAsync(request);

        // Assert
        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage($"*{request.Email}*");

        _userRepositoryMock.Verify(
            r => r.AddAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()),
            Times.Never); // must never attempt to create a duplicate
    }

    // ---------- LOGIN ----------

    [Fact]
    public async Task LoginAsync_WithCorrectCredentials_ShouldSucceedAndReturnToken()
    {
        // Arrange
        var request = new LoginRequestDto { Email = "jane@example.com", Password = "SecurePass123!" };
        var user = CreateTestUser(email: request.Email, passwordHash: "correct-hash");

        _userRepositoryMock
            .Setup(r => r.GetByEmailAsync(request.Email, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        _passwordHasherMock
            .Setup(h => h.Verify(request.Password, user.PasswordHash))
            .Returns(true);

        _jwtTokenGeneratorMock
            .Setup(j => j.GenerateToken(user))
            .Returns("fake-jwt-token");

        // Act
        var result = await _authService.LoginAsync(request);

        // Assert
        result.Should().NotBeNull();
        result.Token.Should().Be("fake-jwt-token");
        result.ExpiresIn.Should().Be(3600);
        result.User.Email.Should().Be(request.Email);
    }

    [Fact]
    public async Task LoginAsync_WithWrongPassword_ShouldThrowUnauthorizedAccessException()
    {
        // Arrange
        var request = new LoginRequestDto { Email = "jane@example.com", Password = "WrongPassword!" };
        var user = CreateTestUser(email: request.Email, passwordHash: "correct-hash");

        _userRepositoryMock
            .Setup(r => r.GetByEmailAsync(request.Email, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        _passwordHasherMock
            .Setup(h => h.Verify(request.Password, user.PasswordHash))
            .Returns(false); // password doesn't match

        // Act
        var act = async () => await _authService.LoginAsync(request);

        // Assert
        await act.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("Invalid email or password.");

        _jwtTokenGeneratorMock.Verify(j => j.GenerateToken(It.IsAny<User>()), Times.Never);
    }

    [Fact]
    public async Task LoginAsync_WithNonExistentEmail_ShouldThrowSameUnauthorizedAccessException()
    {
        // Arrange
        var request = new LoginRequestDto { Email = "doesnotexist@example.com", Password = "AnyPassword!" };

        _userRepositoryMock
            .Setup(r => r.GetByEmailAsync(request.Email, It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null); // no such user

        // Act
        var act = async () => await _authService.LoginAsync(request);

        // Assert — must be the exact same exception type AND message as the wrong-password case,
        // proving we don't leak whether the email or the password was the problem
        await act.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("Invalid email or password.");

        _passwordHasherMock.Verify(
            h => h.Verify(It.IsAny<string>(), It.IsAny<string>()),
            Times.Never); // never even attempted a password check for a nonexistent user
        _jwtTokenGeneratorMock.Verify(j => j.GenerateToken(It.IsAny<User>()), Times.Never);
    }
}