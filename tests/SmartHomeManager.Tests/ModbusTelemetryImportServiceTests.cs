using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using SmartHomeManager.Data;
using SmartHomeManager.Models;
using SmartHomeManager.Services.Integrations;

namespace SmartHomeManager.Tests;

public sealed class ModbusTelemetryImportServiceTests
{
    [Fact]
    public async Task SyncAsync_ShouldPersistTelemetrySamples_AndUpdateMatchingDevices()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(connection)
            .Options;

        await using var db = new AppDbContext(options);
        await db.Database.EnsureCreatedAsync();

        db.Devices.AddRange(
            new Device { Nume = "Solar Meter", Tip = "Priza", ExternalDeviceId = "solar-1" },
            new Device { Nume = "Battery Meter", Tip = "Priza", ExternalDeviceId = "battery-1" });
        await db.SaveChangesAsync();

        var bridgeClient = new RecordingModbusBridgeClient();
        var connectionService = new RecordingIntegrationConnectionService();
        var service = new ModbusTelemetryImportService(
            db,
            bridgeClient,
            connectionService,
            NullLogger<ModbusTelemetryImportService>.Instance);

        var result = await service.SyncAsync();

        Assert.Equal(2, result.ImportedSamples);
        Assert.Equal(2, await db.EnergyTelemetrySamples.CountAsync());
        Assert.All(await db.Devices.ToListAsync(), device => Assert.NotNull(device.LastSeenUtc));
        Assert.Equal(DeviceIntegrationConstants.Modbus, connectionService.LastProtocol);
        Assert.Contains("Imported 2 samples", connectionService.LastStatus ?? string.Empty);
    }

    private sealed class RecordingModbusBridgeClient : IModbusBridgeClient
    {
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
            return Task.FromResult(new ModbusTelemetrySnapshot
            {
                SampledAtUtc = DateTime.UtcNow,
                Sources =
                [
                    new ModbusTelemetryPoint
                    {
                        SourceType = "solar",
                        PowerWatts = 2100,
                        EnergyDeltaWh = 350,
                        ExternalDeviceId = "solar-1",
                    },
                    new ModbusTelemetryPoint
                    {
                        SourceType = "battery",
                        PowerWatts = -480,
                        EnergyDeltaWh = 120,
                        StateOfChargePercent = 62,
                        ExternalDeviceId = "battery-1",
                    },
                ],
            });
        }

        public Task SendCommandAsync(Device device, ModbusDeviceCommandRequest request, CancellationToken cancellationToken = default)
        {
            return Task.CompletedTask;
        }
    }

    private sealed class RecordingIntegrationConnectionService : IIntegrationConnectionService
    {
        public string? LastProtocol { get; private set; }
        public string? LastStatus { get; private set; }

        public Task<IReadOnlyList<IntegrationBridgeConnection>> GetConnectionsAsync(CancellationToken cancellationToken = default)
        {
            return Task.FromResult<IReadOnlyList<IntegrationBridgeConnection>>(Array.Empty<IntegrationBridgeConnection>());
        }

        public Task<IntegrationBridgeConnection?> GetConnectionAsync(string protocol, CancellationToken cancellationToken = default)
        {
            return Task.FromResult<IntegrationBridgeConnection?>(null);
        }

        public Task<ResolvedIntegrationConnectionSettings> GetResolvedSettingsAsync(
            string protocol,
            BridgeConnectionOverride? connectionOverride = null,
            CancellationToken cancellationToken = default)
        {
            return Task.FromResult(new ResolvedIntegrationConnectionSettings
            {
                Protocol = protocol,
                BaseUrl = "http://bridge.local",
            });
        }

        public Task<IntegrationBridgeConnection> UpsertAsync(
            string protocol,
            IntegrationConnectionUpsertRequest request,
            CancellationToken cancellationToken = default)
        {
            return Task.FromResult(new IntegrationBridgeConnection { Protocol = protocol });
        }

        public Task MarkTelemetrySyncAsync(
            string protocol,
            DateTime? syncedAtUtc,
            string status,
            CancellationToken cancellationToken = default)
        {
            LastProtocol = protocol;
            LastStatus = status;
            return Task.CompletedTask;
        }
    }
}
