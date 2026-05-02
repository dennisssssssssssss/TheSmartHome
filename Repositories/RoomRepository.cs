using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SmartHomeManager.Data;
using SmartHomeManager.Infrastructure.Repositories;
using SmartHomeManager.Models;

namespace SmartHomeManager.Repositories
{
    public class RoomRepository : Repository<Room>, IRoomRepository
    {
        public RoomRepository(AppDbContext db)
            : base(db)
        {
        }

        public async Task<List<Room>> GetAllWithDevicesAsync()
        {
            return await DbContext.Rooms
                .AsNoTracking()
                .Include(r => r.Devices)
                .ToListAsync();
        }

        public async Task<Room?> GetByIdWithDevicesAsync(int id)
        {
            return await DbContext.Rooms
                .Include(r => r.Devices)
                .FirstOrDefaultAsync(r => r.Id == id);
        }
    }
}
