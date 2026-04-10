using System.ComponentModel.DataAnnotations;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SmartHomeManager.Data;
using SmartHomeManager.Models;
using SmartHomeManager.Services;

namespace SmartHomeManager.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IConfiguration _config;
        private readonly AppDbContext _db;

        public AuthController(IConfiguration config, AppDbContext db)
        {
            _config = config;
            _db = db;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto login)
        {
            var normalizedUsername = NormalizeUsername(login.Username);

            if (string.IsNullOrWhiteSpace(normalizedUsername) || string.IsNullOrWhiteSpace(login.Password))
            {
                return Unauthorized(new { message = "Invalid username or password." });
            }

            var user = await _db.Users
                .AsNoTracking()
                .SingleOrDefaultAsync(candidate => candidate.Username == normalizedUsername);

            if (user == null || !PasswordService.VerifyPassword(login.Password, user.PasswordSalt, user.PasswordHash))
            {
                return Unauthorized(new { message = "Invalid username or password." });
            }

            return Ok(CreateAuthResponse(user));
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto register)
        {
            var normalizedUsername = NormalizeUsername(register.Username);
            var normalizedEmail = NormalizeEmail(register.Email);
            var displayName = string.IsNullOrWhiteSpace(register.DisplayName)
                ? normalizedUsername
                : register.DisplayName.Trim();

            if (string.IsNullOrWhiteSpace(normalizedUsername))
            {
                return BadRequest(new { message = "Username is required." });
            }

            if (normalizedUsername.Length < 3 || normalizedUsername.Length > 32)
            {
                return BadRequest(new { message = "Username must be between 3 and 32 characters." });
            }

            if (!normalizedUsername.All(ch => char.IsLetterOrDigit(ch) || ch is '.' or '_' or '-'))
            {
                return BadRequest(new { message = "Username may only contain letters, numbers, dots, underscores, and dashes." });
            }

            if (string.IsNullOrWhiteSpace(register.Password) || register.Password.Length < 8)
            {
                return BadRequest(new { message = "Password must contain at least 8 characters." });
            }

            if (!string.IsNullOrWhiteSpace(register.Email) && !new EmailAddressAttribute().IsValid(register.Email))
            {
                return BadRequest(new { message = "Email address is not valid." });
            }

            if (await _db.Users.AnyAsync(user => user.Username == normalizedUsername))
            {
                return Conflict(new { message = "Username is already in use." });
            }

            if (!string.IsNullOrWhiteSpace(normalizedEmail) &&
                await _db.Users.AnyAsync(user => user.Email == normalizedEmail))
            {
                return Conflict(new { message = "Email is already in use." });
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

            _db.Users.Add(user);
            await _db.SaveChangesAsync();

            return Ok(CreateAuthResponse(user));
        }

        [Authorize]
        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto request)
        {
            var username = GetCurrentUsername();
            if (string.IsNullOrWhiteSpace(username))
            {
                return Unauthorized(new { message = "Unable to resolve the current user." });
            }

            if (string.IsNullOrWhiteSpace(request.CurrentPassword) ||
                string.IsNullOrWhiteSpace(request.NewPassword))
            {
                return BadRequest(new { message = "Current password and new password are required." });
            }

            if (request.NewPassword.Length < 8)
            {
                return BadRequest(new { message = "New password must contain at least 8 characters." });
            }

            var user = await _db.Users.SingleOrDefaultAsync(candidate => candidate.Username == username);
            if (user == null)
            {
                return NotFound(new { message = "User account was not found." });
            }

            if (!PasswordService.VerifyPassword(request.CurrentPassword, user.PasswordSalt, user.PasswordHash))
            {
                return BadRequest(new { message = "Current password is incorrect." });
            }

            if (PasswordService.VerifyPassword(request.NewPassword, user.PasswordSalt, user.PasswordHash))
            {
                return BadRequest(new { message = "New password must be different from the current password." });
            }

            var (salt, hash) = PasswordService.HashPassword(request.NewPassword);
            user.PasswordSalt = salt;
            user.PasswordHash = hash;

            await _db.SaveChangesAsync();

            return Ok(new { message = "Password updated successfully." });
        }

        private AuthResponseDto CreateAuthResponse(User user)
        {
            var tokenString = GenerateJsonWebToken(user);

            return new AuthResponseDto
            {
                Token = tokenString,
                Username = user.Username,
                DisplayName = user.DisplayName,
                Email = user.Email,
            };
        }

        private string GenerateJsonWebToken(User user)
        {
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
            {
                new(JwtRegisteredClaimNames.Sub, user.Username),
                new(JwtRegisteredClaimNames.UniqueName, user.Username),
                new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            };

            if (!string.IsNullOrWhiteSpace(user.Email))
            {
                claims.Add(new Claim(JwtRegisteredClaimNames.Email, user.Email));
            }

            if (!string.IsNullOrWhiteSpace(user.DisplayName))
            {
                claims.Add(new Claim("display_name", user.DisplayName));
            }

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddHours(8),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private static string NormalizeUsername(string? username) =>
            username?.Trim().ToLowerInvariant() ?? string.Empty;

        private static string? NormalizeEmail(string? email) =>
            string.IsNullOrWhiteSpace(email) ? null : email.Trim().ToLowerInvariant();

        private string? GetCurrentUsername()
        {
            return NormalizeUsername(
                User.FindFirstValue(JwtRegisteredClaimNames.UniqueName) ??
                User.FindFirstValue(JwtRegisteredClaimNames.Sub) ??
                User.FindFirstValue(ClaimTypes.Name) ??
                User.FindFirstValue(ClaimTypes.NameIdentifier));
        }
    }

    public class LoginDto
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class RegisterDto
    {
        public string Username { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string Password { get; set; } = string.Empty;
    }

    public class ChangePasswordDto
    {
        public string CurrentPassword { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }

    public class AuthResponseDto
    {
        public string Token { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string? DisplayName { get; set; }
        public string? Email { get; set; }
    }
}
