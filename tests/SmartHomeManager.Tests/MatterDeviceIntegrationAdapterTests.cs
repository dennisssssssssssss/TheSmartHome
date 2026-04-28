using Microsoft.Extensions.Logging.Abstractions;
using SmartHomeManager.Dtos;
using SmartHomeManager.Models;
using SmartHomeManager.Services.Integrations;

namespace SmartHomeManager.Tests;

public sealed class MatterDeviceIntegrationAdapterTests
{
    [Fact]
    public async Task ExecuteCommandAsync_ShouldForwardCommand_AndSyncLocalState()
    {
        var bridgeClient = new RecordingMatterBridgeClient();
        var adapter = new MatterDeviceIntegrationAdapter(bridgeClient, NullLogger<MatterDeviceIntegrationAdapter>.Instance);
        var device = new Device
        {
            Id = 7,
            Nume = "Kitchen Light",
            Tip = "Lampa",
            IntegrationProtocol = DeviceIntegrationConstants.Matter,
            ExternalDeviceId = "matter-device-7",
        };

        await adapter.ExecuteCommandAsync(device, new DeviceControlDto
        {
            Command = "TurnOn",
        });

        Assert.True(device.EstePornit);
        Assert.Single(bridgeClient.Calls);
        Assert.Equal("TurnOn", bridgeClient.Calls[0].Request.Command);
        Assert.Equal("matter-device-7", bridgeClient.Calls[0].Device.ExternalDeviceId);
    }

    private sealed class RecordingMatterBridgeClient : IMatterBridgeClient
    {
        public List<(Device Device, MatterDeviceCommandRequest Request)> Calls { get; } = [];

        public Task<IReadOnlyList<MatterDiscoveredDevice>> DiscoverDevicesAsync(
            BridgeConnectionOverride? connectionOverride = null,
            CancellationToken cancellationToken = default)
        {
            return Task.FromResult<IReadOnlyList<MatterDiscoveredDevice>>(Array.Empty<MatterDiscoveredDevice>());
        }

        public Task<MatterPairingResult> PairDeviceAsync(
            MatterPairingRequest request,
            BridgeConnectionOverride? connectionOverride = null,
            CancellationToken cancellationToken = default)
        {
            return Task.FromResult(new MatterPairingResult
            {
                ExternalDeviceId = "paired-device",
                Transport = DeviceIntegrationConstants.Wifi,
                IsReachable = true,
            });
        }

        public Task TestConnectionAsync(BridgeConnectionOverride? connectionOverride = null, CancellationToken cancellationToken = default)
        {
            return Task.CompletedTask;
        }

        public Task SendCommandAsync(Device device, MatterDeviceCommandRequest request, CancellationToken cancellationToken = default)
        {
            Calls.Add((device, request));
            return Task.CompletedTask;
        }
    }
}
