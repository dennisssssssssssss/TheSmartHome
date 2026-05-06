using Microsoft.Extensions.Logging;
using SmartHomeManager.Dtos;
using SmartHomeManager.Models;

namespace SmartHomeManager.Services.Integrations;

public sealed class ModbusDeviceIntegrationAdapter : IDeviceIntegrationAdapter
{
    private readonly IModbusBridgeClient _bridgeClient;
    private readonly ILogger<ModbusDeviceIntegrationAdapter> _logger;

    public ModbusDeviceIntegrationAdapter(IModbusBridgeClient bridgeClient, ILogger<ModbusDeviceIntegrationAdapter> logger)
    {
        _bridgeClient = bridgeClient;
        _logger = logger;
    }

    public string Protocol => DeviceIntegrationConstants.Modbus;

    public async Task ExecuteCommandAsync(Device device, DeviceControlDto command, CancellationToken cancellationToken = default)
    {
        await _bridgeClient.SendCommandAsync(
            device,
            new ModbusDeviceCommandRequest
            {
                Command = command.Command,
                Value = command.Value,
            },
            cancellationToken);

        switch (command.Command.Trim().ToLowerInvariant())
        {
            case "turnon":
            case "on":
                device.EstePornit = true;
                break;
            case "turnoff":
            case "off":
                device.EstePornit = false;
                break;
            case "setvalue":
                if (command.Value.HasValue)
                {
                    device.Valoare = command.Value.Value;
                }
                break;
        }

        _logger.LogInformation("Executed Modbus command {Command} for device {DeviceId}", command.Command, device.Id);
    }
}
