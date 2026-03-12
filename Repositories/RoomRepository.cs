using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SmartHomeManager.Data;
using SmartHomeManager.Models;

namespace SmartHomeManager.Repositories
{
    public class RoomRepository : IRoomRepository
    {
        private readonly AppDbContext _db;

        public RoomRepository(AppDbContext db)
        {
            _db = db;
        }

        public async Task<List<Room>> GetAllWithDevicesAsync()
        {
            return await _db.Rooms
                .AsNoTracking()
                .Include(r => r.Devices)
                .ToListAsync();
        }

        public async Task<Room?> GetByIdWithDevicesAsync(int id)
        {
            return await _db.Rooms
                .Include(r => r.Devices)
                .FirstOrDefaultAsync(r => r.Id == id);
        }

        public async Task<Room> AddAsync(Room room)
        {
            var entry = await _db.Rooms.AddAsync(room);
            await _db.SaveChangesAsync();
            return entry.Entity;
        }

        public async Task UpdateAsync(Room room)
        {
            _db.Rooms.Update(room);
            await _db.SaveChangesAsync();
        }

        public async Task DeleteAsync(Room room)
        {
            _db.Rooms.Remove(room);
            await _db.SaveChangesAsync();
        }
    }
}