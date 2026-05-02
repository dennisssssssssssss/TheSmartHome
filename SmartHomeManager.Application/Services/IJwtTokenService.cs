using SmartHomeManager.Models;

namespace SmartHomeManager.Services
{
    public interface IJwtTokenService
    {
        string GenerateToken(User user);
    }
}
