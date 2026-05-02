using SmartHomeManager.Common;
using SmartHomeManager.Dtos;

namespace SmartHomeManager.Services
{
    public interface INotificationService
    {
        Task<ServiceResult<IReadOnlyList<NotificationReadDto>>> GetAllAsync(CancellationToken cancellationToken = default);
        Task<ServiceResult> MarkAsReadAsync(int id, CancellationToken cancellationToken = default);
        Task<ServiceResult> MarkAllAsReadAsync(CancellationToken cancellationToken = default);
        Task<ServiceResult> DeleteAsync(int id, CancellationToken cancellationToken = default);
    }
}
