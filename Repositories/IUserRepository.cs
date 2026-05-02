using SmartHomeManager.Models;

namespace SmartHomeManager.Repositories
{
    public interface IUserRepository : IRepository<User>
    {
        Task<User?> GetByUsernameAsync(string username, bool asNoTracking = false, CancellationToken cancellationToken = default);
        Task<User?> GetByEmailAsync(string email, bool asNoTracking = false, CancellationToken cancellationToken = default);
    }
}
