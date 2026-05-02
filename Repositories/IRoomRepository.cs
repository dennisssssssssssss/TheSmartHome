using System.Collections.Generic;
using System.Threading.Tasks;
using SmartHomeManager.Models;

namespace SmartHomeManager.Repositories
{
    public interface IRoomRepository : IRepository<Room>
    {
        Task<List<Room>> GetAllWithDevicesAsync();
        Task<Room?> GetByIdWithDevicesAsync(int id);
    }
}
