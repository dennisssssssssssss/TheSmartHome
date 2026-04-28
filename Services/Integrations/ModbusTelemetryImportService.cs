using SmartHomeManager.Data;
using SmartHomeManager.Models;

namespace SmartHomeManager.Services.Integrations;

public sealed class ModbusTelemetryImportService : IModbusTelemetryImportService
{
    private readonly AppDbContext _db;
    private readonly IModbusBridgeClient _bridgeClient;
    private readonly IIntegrationConnectionService _connectionService;
    private readonly ILogger<ModbusTelemetryImportService> _logger;

    public ModbusTelemetryImportService(
        AppDbContext db,
        IModbusBridgeClient bridgeClient,
        IIntegrationConnectionService connectionService,
        ILogger<ModbusTelemetryImportService> logger)
    {
        _db = db;
        _bridgeClient = bridgeClient;
        _connectionService = connectionService;
        _logger = logger;
    }

    public async Task<ModbusTelemetrySyncResult> SyncAsync(
        BridgeConnectionOverride? connectionOverride = null,
        CancellationToken cancellationToken = default)
    {
        var snapshot = await _bridgeClient.GetTelemetrySnapshotAsync(connectionOverride, cancellationToken);
        var syncedAtUtc = snapshot.SampledAtUtc ?? DateTime.UtcNow;
        var importedSamples = new List<EnergyTelemetrySample>();
        var sourceTypes = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var externalIds = snapshot.Sources
            .Where(source => !string.IsNullOrWhiteSpace(source.ExternalDeviceId))
            .Select(source => source.ExternalDeviceId!)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();
        var devicesByExternalId = _db.Devices
            .Where(device => device.ExternalDeviceId != null && externalIds.Contains(device.ExternalDeviceId))
            .ToList()
            .ToDictionary(device => device.ExternalDeviceId!, StringComparer.OrdinalIgnoreCase);
        var energyAssets = _db.EnergyAssets
            .Where(asset => asset.IntegrationProtocol == DeviceIntegrationConstants.Modbus)
            .ToList();
        var assetsByExternalId = energyAssets
            .Where(asset => !string.IsNullOrWhiteSpace(asset.ExternalAssetId))
            .ToDictionary(asset => asset.ExternalAssetId!, StringComparer.OrdinalIgnoreCase);

        foreach (var source in snapshot.Sources)
        {
            if (string.IsNullOrWhiteSpace(source.SourceType))
            {
                continue;
            }

            var normalizedSourceType = source.SourceType.Trim().ToLowerInvariant();
            sourceTypes.Add(normalizedSourceType);

            var assetExternalId = !string.IsNullOrWhiteSpace(source.ExternalDeviceId)
                ? source.ExternalDeviceId!
                : normalizedSourceType;
            if (!assetsByExternalId.TryGetValue(assetExternalId, out var asset))
            {
                asset = new EnergyAsset
                {
                    IntegrationProtocol = DeviceIntegrationConstants.Modbus,
                    ExternalAssetId = assetExternalId,
                    CreatedAtUtc = syncedAtUtc,
                };
                _db.EnergyAssets.Add(asset);
                assetsByExternalId[assetExternalId] = asset;
            }

            asset.Name = source.AssetName?.Trim() ?? source.ExternalDeviceId?.Trim() ?? normalizedSourceType;
            asset.Kind = source.AssetKind?.Trim().ToLowerInvariant() ?? normalizedSourceType;
            asset.SourceType = normalizedSourceType;
            asset.Manufacturer = string.IsNullOrWhiteSpace(source.Manufacturer) ? asset.Manufacturer : source.Manufacturer.Trim();
            asset.Model = string.IsNullOrWhiteSpace(source.Model) ? asset.Model : source.Model.Trim();
            asset.IsActive = true;
            asset.UpdatedAtUtc = syncedAtUtc;

            importedSamples.Add(new EnergyTelemetrySample
            {
                EnergyAsset = asset,
                SourceType = normalizedSourceType,
                TimestampUtc = syncedAtUtc,
                PowerWatts = source.PowerWatts,
                EnergyDeltaWh = source.EnergyDeltaWh,
                Voltage = source.Voltage,
                CurrentAmps = source.CurrentAmps,
                StateOfChargePercent = source.StateOfChargePercent,
            });

            if (!string.IsNullOrWhiteSpace(source.ExternalDeviceId) &&
                devicesByExternalId.TryGetValue(source.ExternalDeviceId, out var device))
            {
                device.LastSeenUtc = syncedAtUtc;
            }
        }

        if (importedSamples.Count > 0)
        {
            _db.EnergyTelemetrySamples.AddRange(importedSamples);
        }

        await _db.SaveChangesAsync(cancellationToken);
        await _connectionService.MarkTelemetrySyncAsync(
            DeviceIntegrationConstants.Modbus,
            syncedAtUtc,
            $"Imported {importedSamples.Count} samples",
            cancellationToken);

        _logger.LogInformation(
            "Imported {SampleCount} Modbus telemetry samples at {SyncedAtUtc}",
            importedSamples.Count,
            syncedAtUtc);

        return new ModbusTelemetrySyncResult
        {
            ImportedSamples = importedSamples.Count,
            SourceTypes = sourceTypes.OrderBy(source => source).ToArray(),
            SyncedAtUtc = syncedAtUtc,
        };
    }
}
