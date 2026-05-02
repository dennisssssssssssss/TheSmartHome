using Microsoft.EntityFrameworkCore;
using SmartHomeManager.Data;
using SmartHomeManager.Models;
using SmartHomeManager.Repositories;

namespace SmartHomeManager.Infrastructure.Repositories
{
    public class EnergyAssetRepository : Repository<EnergyAsset>, IEnergyAssetRepository
    {
        public EnergyAssetRepository(AppDbContext dbContext)
            : base(dbContext)
        {
        }

        public async Task<IReadOnlyList<EnergyAsset>> GetAllWithTelemetryAsync(CancellationToken cancellationToken = default)
        {
            return await DbContext.EnergyAssets
                .AsNoTracking()
                .Include(asset => asset.TelemetrySamples)
                .OrderBy(asset => asset.Kind)
                .ThenBy(asset => asset.Name)
                .ToListAsync(cancellationToken);
        }
    }
}
