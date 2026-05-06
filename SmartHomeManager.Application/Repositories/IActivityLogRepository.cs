using SmartHomeManager.Models;

namespace SmartHomeManager.Repositories
{
    public interface IActivityLogRepository : IRepository<ActivityLog>
    {
        Task<IReadOnlyList<ActivityLog>> GetLatestAsync(int take = 50, CancellationToken cancellationToken = default);
    }
}
