using SmartHomeManager.Models;

namespace SmartHomeManager.Repositories
{
    public interface IEnergyAssetRepository : IRepository<EnergyAsset>
    {
        Task<IReadOnlyList<EnergyAsset>> GetAllWithTelemetryAsync(CancellationToken cancellationToken = default);
    }
}
