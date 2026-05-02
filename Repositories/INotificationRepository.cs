using SmartHomeManager.Models;

namespace SmartHomeManager.Repositories
{
    public interface INotificationRepository : IRepository<Notification>
    {
        Task<IReadOnlyList<Notification>> GetAllOrderedAsync(CancellationToken cancellationToken = default);
        Task<int> MarkAllAsReadAsync(CancellationToken cancellationToken = default);
    }
}
