using Microsoft.EntityFrameworkCore;
using SmartHomeManager.Data;
using SmartHomeManager.Dtos;
using SmartHomeManager.Models;

namespace SmartHomeManager.Services
{
    // Simple simulated device control: updates device state and logs a small energy usage entry.
    public class DeviceControlService : IDeviceControlService
    {
        private readonly AppDbContext _db;
        private readonly ILogger<DeviceControlService> _logger;

        public DeviceControlService(AppDbContext db, ILogger<DeviceControlService> logger)
        {
            _db = db;
            _logger = logger;
        }

        public async Task ExecuteCommandAsync(Device device, DeviceControlDto command)
        {
            // Basic commands
            switch (command.Command.Trim().ToLowerInvariant())
            {
                case "turnon":
                case "on":
                    device.EstePornit = true;
                    _logger.LogInformation("Device {DeviceId} turned on", device.Id);
                    break;

                case "turnoff":
                case "off":
                    device.EstePornit = false;
                    _logger.LogInformation("Device {DeviceId} turned off", device.Id);
                    break;

                case "setvalue":
                    if (command.Value.HasValue)
                    {
                        device.Valoare = command.Value.Value;
                        _logger.LogInformation("Device {DeviceId} set value {Value}", device.Id, command.Value.Value);
                    }
                    break;

                default:
                    _logger.LogWarning("Unknown command {Command} for device {DeviceId}", command.Command, device.Id);
                    break;
            }

            // Persist device state
            _db.Devices.Update(device);

            // Log a simple synthetic energy usage event for simulation.
            var usage = new DeviceEnergyUsage
            {
                DeviceId = device.Id,
                TimestampUtc = DateTime.UtcNow,
                // Very naive: if device is on, add 10 Wh, otherwise 1 Wh
                ConsumptionWh = device.EstePornit ? 10.0 : 1.0
            };

            _db.DeviceEnergyUsages.Add(usage);

            // Save changes is responsibility of caller (controller or background service).
            await Task.CompletedTask;
        }
    }
}