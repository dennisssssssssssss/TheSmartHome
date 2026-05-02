using Microsoft.EntityFrameworkCore;
using SmartHomeManager.Data;
using SmartHomeManager.Models;
using SmartHomeManager.Repositories;

namespace SmartHomeManager.Infrastructure.Repositories
{
    public class DeviceRepository : Repository<Device>, IDeviceRepository
    {
        public DeviceRepository(AppDbContext dbContext)
            : base(dbContext)
        {
        }

        public async Task<IReadOnlyList<Device>> GetAllWithRoomAsync(CancellationToken cancellationToken = default)
        {
            return await DbContext.Devices
                .AsNoTracking()
                .Include(device => device.Room)
                .ToListAsync(cancellationToken);
        }

        public async Task<Device?> GetByIdWithRoomAsync(int id, bool asNoTracking = false, CancellationToken cancellationToken = default)
        {
            var query = DbContext.Devices.Include(device => device.Room).Where(device => device.Id == id);
            if (asNoTracking)
            {
                query = query.AsNoTracking();
            }

            return await query.FirstOrDefaultAsync(cancellationToken);
        }
    }
}
