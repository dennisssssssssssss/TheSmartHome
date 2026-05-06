using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using SmartHomeManager.Data;
using SmartHomeManager.Models;

namespace SmartHomeManager.Services.Integrations;

public sealed class IntegrationConnectionService : IIntegrationConnectionService
{
    private readonly AppDbContext _db;
    private readonly MatterBridgeOptions _matterOptions;
    private readonly ModbusBridgeOptions _modbusOptions;
    private readonly IProtectedSecretService _protectedSecretService;

    public IntegrationConnectionService(
        AppDbContext db,
        IOptions<MatterBridgeOptions> matterOptions,
        IOptions<ModbusBridgeOptions> modbusOptions,
        IProtectedSecretService protectedSecretService)
    {
        _db = db;
        _matterOptions = matterOptions.Value;
        _modbusOptions = modbusOptions.Value;
        _protectedSecretService = protectedSecretService;
    }

    public async Task<IReadOnlyList<IntegrationBridgeConnection>> GetConnectionsAsync(CancellationToken cancellationToken = default)
    {
        return await _db.IntegrationBridgeConnections
            .AsNoTracking()
            .OrderBy(connection => connection.Protocol)
            .ToListAsync(cancellationToken);
    }

    public async Task<IntegrationBridgeConnection?> GetConnectionAsync(string protocol, CancellationToken cancellationToken = default)
    {
        var normalizedProtocol = DeviceIntegrationConstants.NormalizeProtocol(protocol);
        return await _db.IntegrationBridgeConnections
            .FirstOrDefaultAsync(connection => connection.Protocol == normalizedProtocol, cancellationToken);
    }

    public async Task<ResolvedIntegrationConnectionSettings> GetResolvedSettingsAsync(
        string protocol,
        BridgeConnectionOverride? connectionOverride = null,
        CancellationToken cancellationToken = default)
    {
        var normalizedProtocol = DeviceIntegrationConstants.NormalizeProtocol(protocol);
        var storedConnection = await GetConnectionAsync(normalizedProtocol, cancellationToken);

        var fallbackBaseUrl = normalizedProtocol switch
        {
            DeviceIntegrationConstants.Matter => _matterOptions.BaseUrl,
            DeviceIntegrationConstants.Modbus => _modbusOptions.BaseUrl,
            _ => null,
        };

        var fallbackApiKey = normalizedProtocol switch
        {
            DeviceIntegrationConstants.Matter => _matterOptions.ApiKey,
            DeviceIntegrationConstants.Modbus => _modbusOptions.ApiKey,
            _ => null,
        };

        return new ResolvedIntegrationConnectionSettings
        {
            Protocol = normalizedProtocol,
            BaseUrl = FirstNonEmpty(connectionOverride?.BaseUrl, storedConnection?.BaseUrl, fallbackBaseUrl),
            ApiKey = FirstNonEmpty(
                connectionOverride?.ApiKey,
                _protectedSecretService.UnprotectOrFallback(storedConnection?.ApiKey),
                fallbackApiKey),
            TelemetrySyncEnabled = storedConnection?.TelemetrySyncEnabled ?? false,
            TelemetrySyncIntervalMinutes = Math.Max(storedConnection?.TelemetrySyncIntervalMinutes ?? 15, 1),
            UpdatedAtUtc = storedConnection?.UpdatedAtUtc,
            LastTelemetrySyncUtc = storedConnection?.LastTelemetrySyncUtc,
            LastTelemetrySyncStatus = storedConnection?.LastTelemetrySyncStatus,
        };
    }

    public async Task<IntegrationBridgeConnection> UpsertAsync(
        string protocol,
        IntegrationConnectionUpsertRequest request,
        CancellationToken cancellationToken = default)
    {
        var normalizedProtocol = DeviceIntegrationConstants.NormalizeProtocol(protocol);
        var connection = await GetConnectionAsync(normalizedProtocol, cancellationToken);

        if (connection is null)
        {
            connection = new IntegrationBridgeConnection
            {
                Protocol = normalizedProtocol,
                CreatedAtUtc = DateTime.UtcNow,
            };

            _db.IntegrationBridgeConnections.Add(connection);
        }

        connection.BaseUrl = string.IsNullOrWhiteSpace(request.BaseUrl) ? null : request.BaseUrl.Trim();

        if (request.ClearApiKey)
        {
            connection.ApiKey = null;
        }
        else if (!string.IsNullOrWhiteSpace(request.ApiKey))
        {
            connection.ApiKey = _protectedSecretService.Protect(request.ApiKey);
        }
        else if (!request.PreserveExistingApiKey)
        {
            connection.ApiKey = null;
        }

        connection.TelemetrySyncEnabled = request.TelemetrySyncEnabled;
        connection.TelemetrySyncIntervalMinutes = Math.Max(request.TelemetrySyncIntervalMinutes, 1);
        connection.UpdatedAtUtc = DateTime.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);
        return connection;
    }

    public async Task MarkTelemetrySyncAsync(
        string protocol,
        DateTime? syncedAtUtc,
        string status,
        CancellationToken cancellationToken = default)
    {
        var normalizedProtocol = DeviceIntegrationConstants.NormalizeProtocol(protocol);
        var connection = await GetConnectionAsync(normalizedProtocol, cancellationToken);

        if (connection is null)
        {
            connection = new IntegrationBridgeConnection
            {
                Protocol = normalizedProtocol,
                CreatedAtUtc = DateTime.UtcNow,
            };

            _db.IntegrationBridgeConnections.Add(connection);
        }

        connection.LastTelemetrySyncUtc = syncedAtUtc;
        connection.LastTelemetrySyncStatus = string.IsNullOrWhiteSpace(status) ? null : status.Trim();
        connection.UpdatedAtUtc = DateTime.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);
    }

    private static string? FirstNonEmpty(params string?[] values)
    {
        return values.FirstOrDefault(value => !string.IsNullOrWhiteSpace(value))?.Trim();
    }
}
