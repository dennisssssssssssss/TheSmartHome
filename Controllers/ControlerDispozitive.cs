using System.Linq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartHomeManager.Data;
using SmartHomeManager.Dtos;
using SmartHomeManager.Models;
using SmartHomeManager.Services;

namespace SmartHomeManager.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DevicesController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IDeviceControlService _deviceControl;

        public DevicesController(AppDbContext db, IDeviceControlService deviceControl)
        {
            _db = db;
            _deviceControl = deviceControl;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<DeviceReadDto>>> GetDevices()
        {
            var devices = await _db.Devices
                .AsNoTracking()
                .Include(d => d.Room)
                .ToListAsync();

            var dtos = devices.Select(d => new DeviceReadDto
            {
                Id = d.Id,
                Name = d.Nume,
                Type = d.Tip,
                IsOn = d.EstePornit,
                Value = d.Valoare,
                RoomId = d.RoomId,
                RoomName = d.Room?.Name
            });

            return Ok(dtos);
        }

        [HttpGet("{id}", Name = "GetDevice")]
        public async Task<ActionResult<DeviceReadDto>> GetDevice(int id)
        {
            var d = await _db.Devices
                .AsNoTracking()
                .Include(x => x.Room)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (d == null) return NotFound();

            var dto = new DeviceReadDto
            {
                Id = d.Id,
                Name = d.Nume,
                Type = d.Tip,
                IsOn = d.EstePornit,
                Value = d.Valoare,
                RoomId = d.RoomId,
                RoomName = d.Room?.Name
            };

            return Ok(dto);
        }

        [HttpPost]
        public async Task<ActionResult<DeviceReadDto>> CreateDevice([FromBody] DeviceCreateDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            // If a RoomId is provided, validate that room exists and return 404 with a clear message if not
            if (dto.RoomId.HasValue)
            {
                var roomExists = await _db.Rooms.AnyAsync(r => r.Id == dto.RoomId.Value);
                if (!roomExists)
                {
                    return NotFound(new { Message = "Camera nu există" });
                }
            }

            var device = new Device
            {
                Nume = dto.Name,
                Tip = dto.Type,
                EstePornit = dto.IsOn,
                Valoare = dto.Value,
                RoomId = dto.RoomId
            };

            _db.Devices.Add(device);
            await _db.SaveChangesAsync();

            var read = new DeviceReadDto
            {
                Id = device.Id,
                Name = device.Nume,
                Type = device.Tip,
                IsOn = device.EstePornit,
                Value = device.Valoare,
                RoomId = device.RoomId
            };

            return CreatedAtRoute("GetDevice", new { id = device.Id }, read);
        }

        [HttpPut("{id}/control")]
        public async Task<IActionResult> ControlDevice(int id, [FromBody] DeviceControlDto command)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var device = await _db.Devices.FirstOrDefaultAsync(d => d.Id == id);
            if (device == null) return NotFound();

            // Use device control service which encapsulates business logic & energy usage recording
            await _deviceControl.ExecuteCommandAsync(device, command);

            await _db.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDevice(int id)
        {
            var device = await _db.Devices.FirstOrDefaultAsync(d => d.Id == id);
            if (device == null) return NotFound();

            _db.Devices.Remove(device);
            await _db.SaveChangesAsync();
            return NoContent();
        }
    }
}
