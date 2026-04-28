using SmartHomeManager.Models;

namespace SmartHomeManager.Services.Integrations;

public interface IMatterBridgeClient
{
    Task<IReadOnlyList<MatterDiscoveredDevice>> DiscoverDevicesAsync(
        BridgeConnectionOverride? connectionOverride = null,
        CancellationToken cancellationToken = default);
    Task<MatterPairingResult> PairDeviceAsync(
        MatterPairingRequest request,
        BridgeConnectionOverride? connectionOverride = null,
        CancellationToken cancellationToken = default);
    Task TestConnectionAsync(BridgeConnectionOverride? connectionOverride = null, CancellationToken cancellationToken = default);
    Task SendCommandAsync(Device device, MatterDeviceCommandRequest request, CancellationToken cancellationToken = default);
}
