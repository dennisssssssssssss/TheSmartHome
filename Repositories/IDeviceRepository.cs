using SmartHomeManager.Models;

namespace SmartHomeManager.Repositories
{
    public interface IDeviceRepository : IRepository<Device>
    {
        Task<IReadOnlyList<Device>> GetAllWithRoomAsync(CancellationToken cancellationToken = default);
        Task<Device?> GetByIdWithRoomAsync(int id, bool asNoTracking = false, CancellationToken cancellationToken = default);
    }
}
