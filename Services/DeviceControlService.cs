using Microsoft.EntityFrameworkCore;
using SmartHomeManager.Data;
using SmartHomeManager.Dtos;
using SmartHomeManager.Models;
using SmartHomeManager.Services.Integrations;

namespace SmartHomeManager.Services
{
    public class DeviceControlService : IDeviceControlService
    {
        private readonly AppDbContext _db;
        private readonly ILogger<DeviceControlService> _logger;
        private readonly IReadOnlyDictionary<string, IDeviceIntegrationAdapter> _adapters;

        public DeviceControlService(
            AppDbContext db,
            ILogger<DeviceControlService> logger,
            IEnumerable<IDeviceIntegrationAdapter> adapters)
        {
            _db = db;
            _logger = logger;
            _adapters = adapters.ToDictionary(
                adapter => DeviceIntegrationConstants.NormalizeProtocol(adapter.Protocol),
                StringComparer.OrdinalIgnoreCase);
        }

        public async Task ExecuteCommandAsync(Device device, DeviceControlDto command)
        {
            var protocol = DeviceIntegrationConstants.NormalizeProtocol(device.IntegrationProtocol);
            if (!_adapters.TryGetValue(protocol, out var adapter))
            {
                throw new InvalidOperationException(
                    $"No integration adapter is registered for protocol '{protocol}'.");
            }

            await adapter.ExecuteCommandAsync(device, command);

            device.IntegrationProtocol = protocol;
            device.LastSeenUtc = DateTime.UtcNow;
            _db.Devices.Update(device);

            var usage = new DeviceEnergyUsage
            {
                DeviceId = device.Id,
                TimestampUtc = DateTime.UtcNow,
                ConsumptionWh = device.EstePornit ? 10.0 : 1.0
            };

            _db.DeviceEnergyUsages.Add(usage);
        }
    }
}
