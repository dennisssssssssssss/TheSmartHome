using SmartHomeManager.Models;

namespace SmartHomeManager.Services
{
    public interface IRealtimeEventPublisher
    {
        Task PublishUiUpdatedAsync(CancellationToken cancellationToken = default);
        Task PublishLogAsync(ActivityLog log, CancellationToken cancellationToken = default);
        Task PublishNotificationsUpdatedAsync(CancellationToken cancellationToken = default);
    }
}
