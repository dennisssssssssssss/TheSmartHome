using SmartHomeManager.Models;

namespace SmartHomeManager.Services.Integrations;

public interface IModbusBridgeClient
{
    Task<IReadOnlyList<ModbusDiscoveredDevice>> DiscoverDevicesAsync(BridgeConnectionOverride? connectionOverride = null, CancellationToken cancellationToken = default);
    Task TestConnectionAsync(BridgeConnectionOverride? connectionOverride = null, CancellationToken cancellationToken = default);
    Task<ModbusTelemetrySnapshot> GetTelemetrySnapshotAsync(BridgeConnectionOverride? connectionOverride = null, CancellationToken cancellationToken = default);
    Task SendCommandAsync(Device device, ModbusDeviceCommandRequest request, CancellationToken cancellationToken = default);
}
