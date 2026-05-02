using System.ComponentModel.DataAnnotations;
using SmartHomeManager.Common;
using SmartHomeManager.Dtos;
using SmartHomeManager.Models;
using SmartHomeManager.Repositories;

namespace SmartHomeManager.Services
{
    public class AuthService : IAuthService
    {
        private static readonly EmailAddressAttribute EmailValidator = new();

        private readonly IUserRepository _users;
        private readonly IJwtTokenService _jwtTokenService;

        public AuthService(IUserRepository users, IJwtTokenService jwtTokenService)
        {
            _users = users;
            _jwtTokenService = jwtTokenService;
        }

        public async Task<ServiceResult<AuthResponseDto>> LoginAsync(LoginDto login, CancellationToken cancellationToken = default)
        {
            var normalizedUsername = NormalizeUsername(login.Username);

            if (string.IsNullOrWhiteSpace(normalizedUsername) || string.IsNullOrWhiteSpace(login.Password))
            {
                return ServiceResult<AuthResponseDto>.Unauthorized("Invalid username or password.");
            }

            var user = await _users.GetByUsernameAsync(normalizedUsername, asNoTracking: true, cancellationToken);
            if (user == null || !PasswordService.VerifyPassword(login.Password, user.PasswordSalt, user.PasswordHash))
            {
                return ServiceResult<AuthResponseDto>.Unauthorized("Invalid username or password.");
            }

            return ServiceResult<AuthResponseDto>.Success(CreateAuthResponse(user));
        }

        public async Task<ServiceResult<AuthResponseDto>> RegisterAsync(RegisterDto register, CancellationToken cancellationToken = default)
        {
            var normalizedUsername = NormalizeUsername(register.Username);
            var normalizedEmail = NormalizeEmail(register.Email);
            var displayName = string.IsNullOrWhiteSpace(register.DisplayName)
                ? normalizedUsername
                : register.DisplayName.Trim();

            if (string.IsNullOrWhiteSpace(normalizedUsername))
            {
                return ServiceResult<AuthResponseDto>.Validation("Username is required.");
            }

            if (normalizedUsername.Length is < 3 or > 32)
            {
                return ServiceResult<AuthResponseDto>.Validation("Username must be between 3 and 32 characters.");
            }

            if (!normalizedUsername.All(ch => char.IsLetterOrDigit(ch) || ch is '.' or '_' or '-'))
            {
                return ServiceResult<AuthResponseDto>.Validation("Username may only contain letters, numbers, dots, underscores, and dashes.");
            }

            if (string.IsNullOrWhiteSpace(register.Password) || register.Password.Length < 8)
            {
                return ServiceResult<AuthResponseDto>.Validation("Password must contain at least 8 characters.");
            }

            if (!string.IsNullOrWhiteSpace(register.Email) && !EmailValidator.IsValid(register.Email))
            {
                return ServiceResult<AuthResponseDto>.Validation("Email address is not valid.");
            }

            if (await _users.GetByUsernameAsync(normalizedUsername, asNoTracking: true, cancellationToken) != null)
            {
                return ServiceResult<AuthResponseDto>.Conflict("Username is already in use.");
            }

            if (!string.IsNullOrWhiteSpace(normalizedEmail) &&
                await _users.GetByEmailAsync(normalizedEmail, asNoTracking: true, cancellationToken) != null)
            {
                return ServiceResult<AuthResponseDto>.Conflict("Email is already in use.");
            }

            var (salt, hash) = PasswordService.HashPassword(register.Password);
            var user = new User
            {
                Username = normalizedUsername,
                DisplayName = displayName,
                Email = normalizedEmail,
                PasswordHash = hash,
                PasswordSalt = salt,
                CreatedAtUtc = DateTime.UtcNow,
            };

            await _users.AddAsync(user, cancellationToken);
            await _users.SaveChangesAsync(cancellationToken);

            return ServiceResult<AuthResponseDto>.Success(CreateAuthResponse(user));
        }

        public async Task<ServiceResult> ChangePasswordAsync(string? currentUsername, ChangePasswordDto request, CancellationToken cancellationToken = default)
        {
            var username = NormalizeUsername(currentUsername);
            if (string.IsNullOrWhiteSpace(username))
            {
                return ServiceResult.Unauthorized("Unable to resolve the current user.");
            }

            if (string.IsNullOrWhiteSpace(request.CurrentPassword) || string.IsNullOrWhiteSpace(request.NewPassword))
            {
                return ServiceResult.Validation("Current password and new password are required.");
            }

            if (request.NewPassword.Length < 8)
            {
                return ServiceResult.Validation("New password must contain at least 8 characters.");
            }

            var user = await _users.GetByUsernameAsync(username, asNoTracking: false, cancellationToken);
            if (user == null)
            {
                return ServiceResult.NotFound("User account was not found.");
            }

            if (!PasswordService.VerifyPassword(request.CurrentPassword, user.PasswordSalt, user.PasswordHash))
            {
                return ServiceResult.Validation("Current password is incorrect.");
            }

            if (PasswordService.VerifyPassword(request.NewPassword, user.PasswordSalt, user.PasswordHash))
            {
                return ServiceResult.Validation("New password must be different from the current password.");
            }

            var (salt, hash) = PasswordService.HashPassword(request.NewPassword);
            user.PasswordSalt = salt;
            user.PasswordHash = hash;

            _users.Update(user);
            await _users.SaveChangesAsync(cancellationToken);

            return ServiceResult.Success("Password updated successfully.");
        }

        private AuthResponseDto CreateAuthResponse(User user)
        {
            return new AuthResponseDto
            {
                Token = _jwtTokenService.GenerateToken(user),
                Username = user.Username,
                DisplayName = user.DisplayName,
                Email = user.Email,
            };
        }

        private static string NormalizeUsername(string? username) =>
            username?.Trim().ToLowerInvariant() ?? string.Empty;

        private static string? NormalizeEmail(string? email) =>
            string.IsNullOrWhiteSpace(email) ? null : email.Trim().ToLowerInvariant();
    }
}
