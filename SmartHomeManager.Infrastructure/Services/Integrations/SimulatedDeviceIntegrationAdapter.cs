using Microsoft.Extensions.Logging;
using SmartHomeManager.Dtos;
using SmartHomeManager.Models;

namespace SmartHomeManager.Services.Integrations;

public sealed class SimulatedDeviceIntegrationAdapter : IDeviceIntegrationAdapter
{
    private readonly ILogger<SimulatedDeviceIntegrationAdapter> _logger;

    public SimulatedDeviceIntegrationAdapter(ILogger<SimulatedDeviceIntegrationAdapter> logger)
    {
        _logger = logger;
    }

    public string Protocol => DeviceIntegrationConstants.Simulated;

    public Task ExecuteCommandAsync(Device device, DeviceControlDto command, CancellationToken cancellationToken = default)
    {
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

        return Task.CompletedTask;
    }
}
