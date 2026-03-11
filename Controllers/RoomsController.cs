using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartHomeManager.Data;
using SmartHomeManager.Dtos;
using SmartHomeManager.Models;

namespace SmartHomeManager.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RoomsController : ControllerBase
    {
        private readonly AppDbContext _db;

        public RoomsController(AppDbContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<RoomReadDto>>> GetRooms()
        {
            var rooms = await _db.Rooms
                .AsNoTracking()
                .Include(r => r.Devices)
                .ToListAsync();

            var dtos = rooms.Select(r => new RoomReadDto
            {
                Id = r.Id,
                Name = r.Name,
                DeviceCount = r.Devices?.Count ?? 0
            });

            return Ok(dtos);
        }

        [HttpGet("{id}", Name = "GetRoom")]
        public async Task<ActionResult<RoomReadDto>> GetRoom(int id)
        {
            var room = await _db.Rooms
                .AsNoTracking()
                .Include(r => r.Devices)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (room == null) return NotFound();

            var dto = new RoomReadDto
            {
                Id = room.Id,
                Name = room.Name,
                DeviceCount = room.Devices?.Count ?? 0
            };

            return Ok(dto);
        }

        [HttpPost]
        public async Task<ActionResult<RoomReadDto>> CreateRoom([FromBody] RoomCreateDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var room = new Room
            {
                Name = dto.Name
            };

            _db.Rooms.Add(room);
            await _db.SaveChangesAsync();

            var read = new RoomReadDto
            {
                Id = room.Id,
                Name = room.Name,
                DeviceCount = 0
            };

            return CreatedAtRoute("GetRoom", new { id = room.Id }, read);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateRoom(int id, [FromBody] RoomCreateDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var room = await _db.Rooms.FirstOrDefaultAsync(r => r.Id == id);
            if (room == null) return NotFound();

            room.Name = dto.Name;
            _db.Rooms.Update(room);
            await _db.SaveChangesAsync();

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRoom(int id)
        {
            var room = await _db.Rooms.FirstOrDefaultAsync(r => r.Id == id);
            if (room == null) return NotFound();

            // Devices' RoomId is configured to SetNull on delete
            _db.Rooms.Remove(room);
            await _db.SaveChangesAsync();
            return NoContent();
        }
    }
}