using SmartHomeManager.Models;

namespace SmartHomeManager.Services.Integrations;

public interface IIntegrationConnectionService
{
    Task<IReadOnlyList<IntegrationBridgeConnection>> GetConnectionsAsync(CancellationToken cancellationToken = default);
    Task<IntegrationBridgeConnection?> GetConnectionAsync(string protocol, CancellationToken cancellationToken = default);
    Task<ResolvedIntegrationConnectionSettings> GetResolvedSettingsAsync(
        string protocol,
        BridgeConnectionOverride? connectionOverride = null,
        CancellationToken cancellationToken = default);
    Task<IntegrationBridgeConnection> UpsertAsync(
        string protocol,
        IntegrationConnectionUpsertRequest request,
        CancellationToken cancellationToken = default);
    Task MarkTelemetrySyncAsync(
        string protocol,
        DateTime? syncedAtUtc,
        string status,
        CancellationToken cancellationToken = default);
}
