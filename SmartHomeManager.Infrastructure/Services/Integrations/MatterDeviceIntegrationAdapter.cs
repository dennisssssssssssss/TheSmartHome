using Microsoft.Extensions.Logging;
using SmartHomeManager.Dtos;
using SmartHomeManager.Models;

namespace SmartHomeManager.Services.Integrations;

public sealed class MatterDeviceIntegrationAdapter : IDeviceIntegrationAdapter
{
    private readonly IMatterBridgeClient _bridgeClient;
    private readonly ILogger<MatterDeviceIntegrationAdapter> _logger;

    public MatterDeviceIntegrationAdapter(IMatterBridgeClient bridgeClient, ILogger<MatterDeviceIntegrationAdapter> logger)
    {
        _bridgeClient = bridgeClient;
        _logger = logger;
    }

    public string Protocol => DeviceIntegrationConstants.Matter;

    public async Task ExecuteCommandAsync(Device device, DeviceControlDto command, CancellationToken cancellationToken = default)
    {
        await _bridgeClient.SendCommandAsync(
            device,
            new MatterDeviceCommandRequest
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

        _logger.LogInformation("Executed Matter command {Command} for device {DeviceId}", command.Command, device.Id);
    }
}
