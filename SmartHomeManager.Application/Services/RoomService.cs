using System.Collections.Generic;
using System.Threading.Tasks;
using AutoMapper;
using SmartHomeManager.Common;
using SmartHomeManager.Dtos;
using SmartHomeManager.Models;
using SmartHomeManager.Repositories;

namespace SmartHomeManager.Services
{
    public class RoomService : IRoomService
    {
        private readonly IRoomRepository _repo;
        private readonly IMapper _mapper;

        public RoomService(IRoomRepository repo, IMapper mapper)
        {
            _repo = repo;
            _mapper = mapper;
        }

        public async Task<ServiceResult<IReadOnlyList<RoomReadDto>>> GetRoomsAsync(CancellationToken cancellationToken = default)
        {
            var rooms = await _repo.GetAllWithDevicesAsync();
            return ServiceResult<IReadOnlyList<RoomReadDto>>.Success(
                _mapper.Map<IReadOnlyList<RoomReadDto>>(rooms));
        }

        public async Task<ServiceResult<RoomReadDto>> GetRoomAsync(int id, CancellationToken cancellationToken = default)
        {
            var r = await _repo.GetByIdWithDevicesAsync(id);
            return r == null
                ? ServiceResult<RoomReadDto>.NotFound("Room was not found.")
                : ServiceResult<RoomReadDto>.Success(_mapper.Map<RoomReadDto>(r));
        }

        public async Task<ServiceResult<RoomReadDto>> CreateRoomAsync(RoomCreateDto dto, CancellationToken cancellationToken = default)
        {
            var room = new Room { Name = dto.Name };
            await _repo.AddAsync(room, cancellationToken);
            await _repo.SaveChangesAsync(cancellationToken);
            return ServiceResult<RoomReadDto>.Success(_mapper.Map<RoomReadDto>(room));
        }

        public async Task<ServiceResult> UpdateRoomAsync(int id, RoomCreateDto dto, CancellationToken cancellationToken = default)
        {
            var room = await _repo.GetByIdWithDevicesAsync(id);
            if (room == null)
            {
                return ServiceResult.NotFound("Room was not found.");
            }

            room.Name = dto.Name;
            _repo.Update(room);
            await _repo.SaveChangesAsync(cancellationToken);
            return ServiceResult.Success();
        }

        public async Task<ServiceResult> DeleteRoomAsync(int id, CancellationToken cancellationToken = default)
        {
            var room = await _repo.GetByIdWithDevicesAsync(id);
            if (room == null)
            {
                return ServiceResult.NotFound("Room was not found.");
            }

            _repo.Delete(room);
            await _repo.SaveChangesAsync(cancellationToken);
            return ServiceResult.Success();
        }
    }
}
