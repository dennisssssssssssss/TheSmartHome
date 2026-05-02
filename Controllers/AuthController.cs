using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using SmartHomeManager.Common;
using SmartHomeManager.Dtos;
using SmartHomeManager.Services;

namespace SmartHomeManager.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [EnableRateLimiting("auth")]
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto login)
        {
            var result = await _authService.LoginAsync(login, HttpContext?.RequestAborted ?? CancellationToken.None);
            return ToActionResult(result);
        }

        [EnableRateLimiting("auth")]
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto register)
        {
            var result = await _authService.RegisterAsync(register, HttpContext?.RequestAborted ?? CancellationToken.None);
            return ToActionResult(result);
        }

        [Authorize]
        [EnableRateLimiting("auth")]
        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto request)
        {
            var result = await _authService.ChangePasswordAsync(GetCurrentUsername(), request, HttpContext?.RequestAborted ?? CancellationToken.None);

            return result.Status switch
            {
                ServiceResultStatus.Success => Ok(new { message = result.Message }),
                ServiceResultStatus.NotFound => NotFound(new { message = result.Message }),
                ServiceResultStatus.ValidationError => BadRequest(new { message = result.Message, errors = result.Errors }),
                ServiceResultStatus.Unauthorized => Unauthorized(new { message = result.Message }),
                _ => StatusCode(500, new { message = result.Message ?? "Unexpected service failure." }),
            };
        }

        private IActionResult ToActionResult(ServiceResult<AuthResponseDto> result)
        {
            return result.Status switch
            {
                ServiceResultStatus.Success when result.Data != null => Ok(result.Data),
                ServiceResultStatus.Conflict => Conflict(new { message = result.Message }),
                ServiceResultStatus.ValidationError => BadRequest(new { message = result.Message, errors = result.Errors }),
                ServiceResultStatus.Unauthorized => Unauthorized(new { message = result.Message }),
                _ => StatusCode(500, new { message = result.Message ?? "Unexpected service failure." }),
            };
        }

        private string? GetCurrentUsername()
        {
            return User.Identity?.Name
                ?? User.Claims.FirstOrDefault(claim => claim.Type.EndsWith("unique_name", StringComparison.OrdinalIgnoreCase))?.Value
                ?? User.Claims.FirstOrDefault(claim => claim.Type.EndsWith("/nameidentifier", StringComparison.OrdinalIgnoreCase))?.Value
                ?? User.Claims.FirstOrDefault(claim => claim.Type.EndsWith("/name", StringComparison.OrdinalIgnoreCase))?.Value;
        }
    }
}
