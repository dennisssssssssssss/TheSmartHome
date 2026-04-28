using Microsoft.Extensions.Logging.Abstractions;
using SmartHomeManager.Dtos;
using SmartHomeManager.Models;
using SmartHomeManager.Services.Integrations;

namespace SmartHomeManager.Tests;

public sealed class ModbusDeviceIntegrationAdapterTests
{
    [Fact]
    public async Task ExecuteCommandAsync_ShouldForwardCommand_AndSyncLocalState()
    {
        var bridgeClient = new RecordingModbusBridgeClient();
        var adapter = new ModbusDeviceIntegrationAdapter(bridgeClient, NullLogger<ModbusDeviceIntegrationAdapter>.Instance);
        var device = new Device
        {
            Id = 11,
            Nume = "Grid Meter",
            Tip = "Priza",
            IntegrationProtocol = DeviceIntegrationConstants.Modbus,
            ExternalDeviceId = "meter-11",
            Valoare = 12,
        };

        await adapter.ExecuteCommandAsync(device, new DeviceControlDto
        {
            Command = "SetValue",
            Value = 48.5,
        });

        Assert.Equal(48.5, device.Valoare);
        Assert.Single(bridgeClient.Calls);
        Assert.Equal("SetValue", bridgeClient.Calls[0].Request.Command);
        Assert.Equal(48.5, bridgeClient.Calls[0].Request.Value);
        Assert.Equal("meter-11", bridgeClient.Calls[0].Device.ExternalDeviceId);
    }

    private sealed class RecordingModbusBridgeClient : IModbusBridgeClient
    {
        public List<(Device Device, ModbusDeviceCommandRequest Request)> Calls { get; } = [];

        public Task<IReadOnlyList<ModbusDiscoveredDevice>> DiscoverDevicesAsync(BridgeConnectionOverride? connectionOverride = null, CancellationToken cancellationToken = default)
        {
            return Task.FromResult<IReadOnlyList<ModbusDiscoveredDevice>>(Array.Empty<ModbusDiscoveredDevice>());
        }

        public Task TestConnectionAsync(BridgeConnectionOverride? connectionOverride = null, CancellationToken cancellationToken = default)
        {
            return Task.CompletedTask;
        }

        public Task<ModbusTelemetrySnapshot> GetTelemetrySnapshotAsync(BridgeConnectionOverride? connectionOverride = null, CancellationToken cancellationToken = default)
        {
            return Task.FromResult(new ModbusTelemetrySnapshot());
        }

        public Task SendCommandAsync(Device device, ModbusDeviceCommandRequest request, CancellationToken cancellationToken = default)
        {
            Calls.Add((device, request));
            return Task.CompletedTask;
        }
    }
}
