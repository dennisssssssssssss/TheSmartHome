using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using SmartHomeManager.Data;
using SmartHomeManager.Dtos;
using SmartHomeManager.Models;
using SmartHomeManager.Services;
using SmartHomeManager.Hubs;
using Microsoft.AspNetCore.Authorization;

// Alias the DTO type to avoid ambiguity with a model type having the same name
using DtoDeviceRead = SmartHomeManager.Dtos.DeviceReadDto;

namespace SmartHomeManager.Controllers
{
    /// <summary>
    /// Devices API controller. Maps Romanian EF model fields to English DTOs for the frontend.
    /// All mutating operations create an ActivityLog and broadcast real-time notifications.
    /// </summary>
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class DevicesController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IDeviceControlService _deviceControl;
        private readonly IHubContext<SmartHomeHub> _hubContext;
        private readonly IRoomService _roomService; // kept for compatibility with application services

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

        /// <summary>
        /// GET: api/Devices
        /// Return a list of DeviceReadDto mapped from Romanian model properties.
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<DtoDeviceRead>>> GetDevices()
        {
            var devices = await _db.Devices
                .AsNoTracking()
                .Include(d => d.Room)
                .ToListAsync();

            var dtos = devices.Select(d => new DtoDeviceRead
            {
                Id = d.Id,
                Name = d.Nume,
                Type = d.Tip,
                IsOn = d.EstePornit,
                Value = d.Valoare,
                RoomId = d.RoomId,
                RoomName = d.Room?.Name,
                SensorValue = d.SensorValue,
                SensorUnit = d.SensorUnit
            }).ToList();

            return Ok(dtos);
        }

        /// <summary>
        /// GET: api/Devices/{id}
        /// Return single device mapped to DeviceReadDto.
        /// </summary>
        [HttpGet("{id}", Name = "GetDevice")]
        public async Task<ActionResult<DtoDeviceRead>> GetDevice(int id)
        {
            var d = await _db.Devices
                .AsNoTracking()
                .Include(x => x.Room)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (d == null) return NotFound();

            var dto = new DtoDeviceRead
            {
                Id = d.Id,
                Name = d.Nume,
                Type = d.Tip,
                IsOn = d.EstePornit,
                Value = d.Valoare,
                RoomId = d.RoomId,
                RoomName = d.Room?.Name,
                SensorValue = d.SensorValue,
                SensorUnit = d.SensorUnit
            };

            return Ok(dto);
        }

        /// <summary>
        /// POST: api/Devices
        /// Create a new device. Accepts DeviceCreateDto (English props), maps to Romanian model for persistence.
        /// Creates an ActivityLog and broadcasts it to connected clients.
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<DtoDeviceRead>> CreateDevice([FromBody] DeviceCreateDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            // Map DTO -> EF model (Romanian property names)
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

            // Map saved entity -> English read DTO for the client
            var readDto = new DtoDeviceRead
            {
                Id = device.Id,
                Name = device.Nume,
                Type = device.Tip,
                IsOn = device.EstePornit,
                Value = device.Valoare,
                RoomId = device.RoomId,
                RoomName = (await _db.Rooms.FindAsync(device.RoomId))?.Name,
                SensorValue = device.SensorValue,
                SensorUnit = device.SensorUnit
            };

            // Create activity log entry describing the creation
            var newLog = new ActivityLog
            {
                TimestampUtc = System.DateTime.UtcNow,
                Action = "DeviceCreated",
                Details = $"DeviceId={device.Id}; Name='{device.Nume}'; RoomId={device.RoomId}"
            };

            _db.ActivityLogs.Add(newLog);
            await _db.SaveChangesAsync();

            // Notify clients in real-time: UI refresh and explicit log delivery
            await _hubContext.Clients.All.SendAsync("UpdateUI");
            await _hubContext.Clients.All.SendAsync("ReceiveLog", newLog);

            return CreatedAtAction(nameof(GetDevice), new { id = device.Id }, readDto);
        }

        /// <summary>
        /// PUT: api/Devices/{id}
        /// Update device metadata (name/type/room/isOn/value).
        /// Returns updated DeviceReadDto mapped from EF model.
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateDevice(int id, [FromBody] DeviceCreateDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var existingDevice = await _db.Devices.FindAsync(id);
            if (existingDevice == null) return NotFound();

            // Map DTO fields into EF model (Romanian properties)
            existingDevice.Nume = dto.Name;
            existingDevice.Tip = dto.Type;
            existingDevice.EstePornit = dto.IsOn;
            existingDevice.Valoare = dto.Value;
            existingDevice.RoomId = dto.RoomId;

            await _db.SaveChangesAsync();

            // Create activity log entry describing the update
            var updateLog = new ActivityLog
            {
                TimestampUtc = System.DateTime.UtcNow,
                Action = "DeviceUpdated",
                Details = $"DeviceId={existingDevice.Id}; Name='{existingDevice.Nume}'; IsOn={existingDevice.EstePornit}; RoomId={existingDevice.RoomId}"
            };

            _db.ActivityLogs.Add(updateLog);
            await _db.SaveChangesAsync();

            // Notify clients in real-time
            await _hubContext.Clients.All.SendAsync("UpdateUI");
            await _hubContext.Clients.All.SendAsync("ReceiveLog", updateLog);

            // Return the updated DTO to the caller
            var readDto = new DtoDeviceRead
            {
                Id = existingDevice.Id,
                Name = existingDevice.Nume,
                Type = existingDevice.Tip,
                IsOn = existingDevice.EstePornit,
                Value = existingDevice.Valoare,
                RoomId = existingDevice.RoomId,
                RoomName = (await _db.Rooms.FindAsync(existingDevice.RoomId))?.Name,
                SensorValue = existingDevice.SensorValue,
                SensorUnit = existingDevice.SensorUnit
            };

            return Ok(readDto);
        }

        /// <summary>
        /// PUT: api/Devices/{id}/control
        /// Toggle or set device state using DeviceControlDto (e.g. TurnOn/TurnOff/SetValue).
        /// Will create an ActivityLog describing the result and broadcast it.
        /// </summary>
        [HttpPut("{id}/control")]
        public async Task<IActionResult> ControlDevice(int id, [FromBody] DeviceControlDto command)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var device = await _db.Devices.FirstOrDefaultAsync(d => d.Id == id);
            if (device == null) return NotFound();

            // Execute command (service handles energy usage logging)
            await _deviceControl.ExecuteCommandAsync(device, command);

            // Persist device changes and any energy usage rows added by the service
            await _db.SaveChangesAsync();

            // Build human readable details for the activity log
            var action = command.Command ?? "Unknown";
            string details;
            if (action.Equals("TurnOn", System.StringComparison.OrdinalIgnoreCase) ||
                action.Equals("On", System.StringComparison.OrdinalIgnoreCase))
            {
                details = $"DeviceId={device.Id}; Name='{device.Nume}' turned ON";
            }
            else if (action.Equals("TurnOff", System.StringComparison.OrdinalIgnoreCase) ||
                     action.Equals("Off", System.StringComparison.OrdinalIgnoreCase))
            {
                details = $"DeviceId={device.Id}; Name='{device.Nume}' turned OFF";
            }
            else if (action.Equals("SetValue", System.StringComparison.OrdinalIgnoreCase) && command.Value.HasValue)
            {
                details = $"DeviceId={device.Id}; Name='{device.Nume}' set value {command.Value.Value}";
            }
            else
            {
                details = $"DeviceId={device.Id}; Name='{device.Nume}' action={action}";
            }

            // Persist activity log
            var log = new ActivityLog
            {
                TimestampUtc = System.DateTime.UtcNow,
                Action = $"Control:{action}",
                Details = details
            };

            _db.ActivityLogs.Add(log);
            await _db.SaveChangesAsync();

            // Notify clients: UI refresh and deliver the log entry
            try
            {
                await _hubContext.Clients.All.SendAsync("UpdateUI");
                await _hubContext.Clients.All.SendAsync("ReceiveLog", log);
            }
            catch
            {
                // Failures notifying clients should not prevent API success
            }

            return NoContent();
        }

        /// <summary>
        /// DELETE: api/Devices/{id}
        /// Remove device and publish ActivityLog.
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDevice(int id)
        {
            var device = await _db.Devices.FindAsync(id);
            if (device == null) return NotFound();

            _db.Devices.Remove(device);
            await _db.SaveChangesAsync();

            var delLog = new ActivityLog
            {
                TimestampUtc = System.DateTime.UtcNow,
                Action = "DeviceDeleted",
                Details = $"DeviceId={device.Id}; Name='{device.Nume}'"
            };

            _db.ActivityLogs.Add(delLog);
            await _db.SaveChangesAsync();

            await _hubContext.Clients.All.SendAsync("UpdateUI");
            await _hubContext.Clients.All.SendAsync("ReceiveLog", delLog);

            return NoContent();
        }
    }
}