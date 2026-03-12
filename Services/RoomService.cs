using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using SmartHomeManager.Dtos;
using SmartHomeManager.Models;
using SmartHomeManager.Repositories;

namespace SmartHomeManager.Services
{
    public class RoomService : IRoomService
    {
        private readonly IRoomRepository _repo;

        public RoomService(IRoomRepository repo)
        {
            _repo = repo;
        }

        public async Task<IEnumerable<RoomReadDto>> GetRoomsAsync()
        {
            var rooms = await _repo.GetAllWithDevicesAsync();
            return rooms.Select(r => MapToReadDto(r)).ToList();
        }

        public async Task<RoomReadDto?> GetRoomAsync(int id)
        {
            var r = await _repo.GetByIdWithDevicesAsync(id);
            return r == null ? null : MapToReadDto(r);
        }

        public async Task<RoomReadDto> CreateRoomAsync(RoomCreateDto dto)
        {
            var room = new Room { Name = dto.Name };
            var created = await _repo.AddAsync(room);
            return MapToReadDto(created);
        }

        public async Task<bool> UpdateRoomAsync(int id, RoomCreateDto dto)
        {
            var room = await _repo.GetByIdWithDevicesAsync(id);
            if (room == null) return false;
            room.Name = dto.Name;
            await _repo.UpdateAsync(room);
            return true;
        }

        public async Task<bool> DeleteRoomAsync(int id)
        {
            var room = await _repo.GetByIdWithDevicesAsync(id);
            if (room == null) return false;
            await _repo.DeleteAsync(room);
            return true;
        }

        private static RoomReadDto MapToReadDto(Room r)
        {
            return new RoomReadDto
            {
                Id = r.Id,
                Name = r.Name,
                DeviceCount = r.Devices?.Count ?? 0,
                Devices = r.Devices == null
                    ? new List<DeviceReadDto>()
                    : r.Devices.Select(d => new DeviceReadDto
                    {
                        Id = d.Id,
                        Name = d.Nume,
                        Type = d.Tip,
                        IsOn = d.EstePornit,
                        Value = d.Valoare,
                        RoomId = d.RoomId,
                        RoomName = r.Name
                    }).ToList()
            };
        }
    }
}