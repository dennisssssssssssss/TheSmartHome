namespace SmartHomeManager.Services.Integrations;

public interface IModbusTelemetryImportService
{
    Task<ModbusTelemetrySyncResult> SyncAsync(
        BridgeConnectionOverride? connectionOverride = null,
        CancellationToken cancellationToken = default);
}
