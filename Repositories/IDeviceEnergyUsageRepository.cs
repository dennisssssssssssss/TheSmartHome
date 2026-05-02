using SmartHomeManager.Models;

namespace SmartHomeManager.Repositories
{
    public interface IDeviceEnergyUsageRepository : IRepository<DeviceEnergyUsage>
    {
        Task<IReadOnlyList<DeviceEnergyUsage>> GetAllOrderedAsync(CancellationToken cancellationToken = default);
    }
}
