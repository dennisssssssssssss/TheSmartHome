using SmartHomeManager.Models;

namespace SmartHomeManager.Services
{
    public interface ISecurityNotificationService
    {
        Task<bool> PublishDeviceEventAsync(
            Device device,
            string action,
            double? value = null,
            string? source = null,
            CancellationToken cancellationToken = default);
    }
}
