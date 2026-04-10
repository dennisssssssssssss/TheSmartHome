using System.Collections.Generic;
using System.Threading.Tasks;
using SmartHomeManager.Dtos;

namespace SmartHomeManager.Services
{
    public interface IRoomService
    {
        Task<IEnumerable<RoomReadDto>> GetRoomsAsync();
        Task<RoomReadDto?> GetRoomAsync(int id);
        Task<RoomReadDto> CreateRoomAsync(RoomCreateDto dto);
        Task<bool> UpdateRoomAsync(int id, RoomCreateDto dto);
        Task<bool> DeleteRoomAsync(int id);
    }
}