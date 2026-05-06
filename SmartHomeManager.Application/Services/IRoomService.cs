using System.Collections.Generic;
using System.Threading.Tasks;
using SmartHomeManager.Common;
using SmartHomeManager.Dtos;

namespace SmartHomeManager.Services
{
    public interface IRoomService
    {
        Task<ServiceResult<IReadOnlyList<RoomReadDto>>> GetRoomsAsync(CancellationToken cancellationToken = default);
        Task<ServiceResult<RoomReadDto>> GetRoomAsync(int id, CancellationToken cancellationToken = default);
        Task<ServiceResult<RoomReadDto>> CreateRoomAsync(RoomCreateDto dto, CancellationToken cancellationToken = default);
        Task<ServiceResult> UpdateRoomAsync(int id, RoomCreateDto dto, CancellationToken cancellationToken = default);
        Task<ServiceResult> DeleteRoomAsync(int id, CancellationToken cancellationToken = default);
    }
}
