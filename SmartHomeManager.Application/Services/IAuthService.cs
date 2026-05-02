using SmartHomeManager.Common;
using SmartHomeManager.Dtos;

namespace SmartHomeManager.Services
{
    public interface IAuthService
    {
        Task<ServiceResult<AuthResponseDto>> LoginAsync(LoginDto login, CancellationToken cancellationToken = default);
        Task<ServiceResult<AuthResponseDto>> RegisterAsync(RegisterDto register, CancellationToken cancellationToken = default);
        Task<ServiceResult> ChangePasswordAsync(string? currentUsername, ChangePasswordDto request, CancellationToken cancellationToken = default);
    }
}
