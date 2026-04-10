using System.Collections.Generic;
using System.Threading.Tasks;
using SmartHomeManager.Models;

namespace SmartHomeManager.Repositories
{
    public interface IRoomRepository
    {
        Task<List<Room>> GetAllWithDevicesAsync();
        Task<Room?> GetByIdWithDevicesAsync(int id);
        Task<Room> AddAsync(Room room);
        Task UpdateAsync(Room room);
        Task DeleteAsync(Room room);
    }
}