using Microsoft.EntityFrameworkCore;
using SmartHomeManager.Data;
using SmartHomeManager.Models;
using SmartHomeManager.Repositories;

namespace SmartHomeManager.Infrastructure.Repositories
{
    public class DeviceEnergyUsageRepository : Repository<DeviceEnergyUsage>, IDeviceEnergyUsageRepository
    {
        public DeviceEnergyUsageRepository(AppDbContext dbContext)
            : base(dbContext)
        {
        }

        public async Task<IReadOnlyList<DeviceEnergyUsage>> GetAllOrderedAsync(CancellationToken cancellationToken = default)
        {
            return await DbContext.DeviceEnergyUsages
                .AsNoTracking()
                .OrderBy(usage => usage.TimestampUtc)
                .ToListAsync(cancellationToken);
        }
    }
}
