using System.Linq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using SmartHomeManager.Data;
using SmartHomeManager.Dtos;
using SmartHomeManager.Models;
using SmartHomeManager.Services;
using SmartHomeManager.Hubs;

namespace SmartHomeManager.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DevicesController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IDeviceControlService _deviceControl;
        private readonly IHubContext<SmartHomeHub> _hubContext;
        private readonly IRoomService _roomService; // Added for Clean Architecture

        public DevicesController(
            AppDbContext db,
            IDeviceControlService deviceControl,
            IHubContext<SmartHomeHub> hubContext,
            IRoomService roomService)
        {
            _db = db;
            _deviceControl = deviceControl;
            _hubContext = hubContext;
            _roomService = roomService;
        }

        // GET: api/Devices
        // Return a list of DeviceReadDto (English property names) mapped from the Romanian EF model.
        [HttpGet]
        public async Task<ActionResult<IEnumerable<DeviceReadDto>>> GetDevices()
        {
            // Fetching devices with room details included
            var devices = await _db.Devices
                .AsNoTracking()
                .Include(d => d.Room)
                .ToListAsync();

            // Explicit mapping from Romanian model properties -> English DTO properties
            var dtos = devices.Select(d => new DeviceReadDto
            {
                Id = d.Id,
                Name = d.Nume,
                Type = d.Tip,
                IsOn = d.EstePornit,
                Value = d.Valoare,
                RoomId = d.RoomId,
                RoomName = d.Room?.Name
            }).ToList();

            return Ok(dtos);
        }

        // GET: api/Devices/{id}
        // Single-device read endpoint — returns DeviceReadDto mapped from model.
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

        // POST: api/Devices
        // Create a new device. Accepts DeviceCreateDto (English names) and returns DeviceReadDto.
        [HttpPost]
        public async Task<ActionResult<DeviceReadDto>> CreateDevice([FromBody] DeviceCreateDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            // Map incoming English-named DTO -> Romanian-named model for EF
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

            // Map saved model back to English DTO for the client
            var readDto = new DeviceReadDto
            {
                Id = device.Id,
                Name = device.Nume,
                Type = device.Tip,
                IsOn = device.EstePornit,
                Value = device.Valoare,
                RoomId = device.RoomId,
                RoomName = (await _db.Rooms.FindAsync(device.RoomId))?.Name
            };

            // Notify UI via SignalR so front-end refreshes in real-time
            await _hubContext.Clients.All.SendAsync("UpdateUI");

            return CreatedAtAction(nameof(GetDevice), new { id = device.Id }, readDto);
        }

        // PUT: api/Devices/{id}
        // Update basic device metadata (name/type/room). Accepts DeviceCreateDto (English names).
        // Returns the updated DeviceReadDto mapped from the EF model.
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateDevice(int id, [FromBody] DeviceCreateDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var existingDevice = await _db.Devices.FindAsync(id);
            if (existingDevice == null) return NotFound();

            // Map English DTO -> Romanian model properties
            existingDevice.Nume = dto.Name;
            existingDevice.Tip = dto.Type;
            existingDevice.EstePornit = dto.IsOn;
            existingDevice.Valoare = dto.Value;
            existingDevice.RoomId = dto.RoomId;

            await _db.SaveChangesAsync();

            // Prepare DTO to return to client (ensures consistent English property names)
            var readDto = new DeviceReadDto
            {
                Id = existingDevice.Id,
                Name = existingDevice.Nume,
                Type = existingDevice.Tip,
                IsOn = existingDevice.EstePornit,
                Value = existingDevice.Valoare,
                RoomId = existingDevice.RoomId,
                RoomName = (await _db.Rooms.FindAsync(existingDevice.RoomId))?.Name
            };

            // Notify UI via SignalR
            await _hubContext.Clients.All.SendAsync("UpdateUI");

            return Ok(readDto);
        }

        // PUT: api/Devices/{id}/control
        // Toggle or set device state using DeviceControlDto (e.g. TurnOn/TurnOff/SetValue).
        [HttpPut("{id}/control")]
        public async Task<IActionResult> ControlDevice(int id, [FromBody] DeviceControlDto command)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var device = await _db.Devices.FirstOrDefaultAsync(d => d.Id == id);
            if (device == null) return NotFound();

            // Business logic for device toggling and energy tracking
            await _deviceControl.ExecuteCommandAsync(device, command);
            await _db.SaveChangesAsync();

            // Immediate UI update via SignalR
            try { await _hubContext.Clients.All.SendAsync("UpdateUI"); }
            catch { /* Ignore SignalR errors to avoid blocking the main logic */ }

            return NoContent();
        }

        // DELETE: api/Devices/{id}
        // Remove a device and notify clients.
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDevice(int id)
        {
            var device = await _db.Devices.FindAsync(id);
            if (device == null) return NotFound();

            _db.Devices.Remove(device);
            await _db.SaveChangesAsync();

            await _hubContext.Clients.All.SendAsync("UpdateUI");

            return NoContent();
        }
    }
}