using SmartHomeManager.Dtos;
using SmartHomeManager.Models;

namespace SmartHomeManager.Services.Integrations;

public interface IDeviceIntegrationAdapter
{
    string Protocol { get; }
    Task ExecuteCommandAsync(Device device, DeviceControlDto command, CancellationToken cancellationToken = default);
}
