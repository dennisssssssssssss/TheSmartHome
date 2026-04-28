using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartHomeManager.Data;
using SmartHomeManager.Dtos;
using SmartHomeManager.Services.Integrations;

namespace SmartHomeManager.Controllers;

[Authorize]
[Route("api/[controller]")]
[ApiController]
public sealed class IntegrationsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IDeviceIntegrationCatalogService _catalog;
    private readonly IIntegrationConnectionService _connectionService;
    private readonly IMatterBridgeClient _matterBridgeClient;
    private readonly IModbusBridgeClient _modbusBridgeClient;
    private readonly IModbusTelemetryImportService _modbusTelemetryImportService;

    public IntegrationsController(
        AppDbContext db,
        IDeviceIntegrationCatalogService catalog,
        IIntegrationConnectionService connectionService,
        IMatterBridgeClient matterBridgeClient,
        IModbusBridgeClient modbusBridgeClient,
        IModbusTelemetryImportService modbusTelemetryImportService)
    {
        _db = db;
        _catalog = catalog;
        _connectionService = connectionService;
        _matterBridgeClient = matterBridgeClient;
        _modbusBridgeClient = modbusBridgeClient;
        _modbusTelemetryImportService = modbusTelemetryImportService;
    }

    [HttpGet("overview")]
    public async Task<ActionResult<IntegrationOverviewDto>> GetOverview(CancellationToken cancellationToken)
    {
        var deviceCounts = await _db.Devices
            .AsNoTracking()
            .GroupBy(device => device.IntegrationProtocol)
            .Select(group => new
            {
                Protocol = group.Key,
                Count = group.Count(),
            })
            .ToListAsync(cancellationToken);

        var telemetrySources = await _db.EnergyTelemetrySamples
            .AsNoTracking()
            .GroupBy(sample => sample.SourceType)
            .Select(group => new IntegrationTelemetrySourceDto
            {
                SourceType = group.Key,
                SampleCount = group.Count(),
                LastUpdatedUtc = group.Max(sample => sample.TimestampUtc),
            })
            .OrderBy(source => source.SourceType)
            .ToListAsync(cancellationToken);

        var protocols = new List<IntegrationProtocolOverviewDto>();
        foreach (var option in _catalog.GetOptions())
        {
            var settings = await _connectionService.GetResolvedSettingsAsync(option.Code, cancellationToken: cancellationToken);
            protocols.Add(new IntegrationProtocolOverviewDto
            {
                Code = option.Code,
                Label = option.Label,
                Status = option.Status,
                Description = option.Description,
                RecommendedFor = option.RecommendedFor,
                Transports = option.Transports,
                DeviceCount = deviceCounts.FirstOrDefault(item => string.Equals(item.Protocol, option.Code, StringComparison.OrdinalIgnoreCase))?.Count ?? 0,
                IsConfigured = settings.IsConfigured,
                BaseUrl = settings.BaseUrl,
                HasApiKey = settings.HasApiKey,
                TelemetrySyncEnabled = settings.TelemetrySyncEnabled,
                TelemetrySyncIntervalMinutes = settings.TelemetrySyncIntervalMinutes,
                ConnectionUpdatedUtc = settings.UpdatedAtUtc,
                LastTelemetrySyncUtc = settings.LastTelemetrySyncUtc,
                LastTelemetrySyncStatus = settings.LastTelemetrySyncStatus,
            });
        }

        return Ok(new IntegrationOverviewDto
        {
            Protocols = protocols,
            TelemetrySources = telemetrySources,
            TotalIntegratedDevices = protocols.Sum(protocol => protocol.DeviceCount),
        });
    }

    [HttpGet("connections")]
    public async Task<ActionResult<IReadOnlyList<IntegrationConnectionDto>>> GetConnections(CancellationToken cancellationToken)
    {
        var items = new List<IntegrationConnectionDto>();
        foreach (var option in _catalog.GetOptions())
        {
            var settings = await _connectionService.GetResolvedSettingsAsync(option.Code, cancellationToken: cancellationToken);
            items.Add(MapConnection(settings));
        }

        return Ok(items);
    }

    [HttpGet("connections/{protocol}")]
    public async Task<ActionResult<IntegrationConnectionDto>> GetConnection(string protocol, CancellationToken cancellationToken)
    {
        if (!IsSupportedProtocol(protocol))
        {
            return NotFound();
        }

        var settings = await _connectionService.GetResolvedSettingsAsync(protocol, cancellationToken: cancellationToken);
        return Ok(MapConnection(settings));
    }

    [HttpPut("connections/{protocol}")]
    public async Task<ActionResult<IntegrationConnectionDto>> UpsertConnection(
        string protocol,
        [FromBody] IntegrationConnectionUpsertDto request,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        if (!IsSupportedProtocol(protocol))
        {
            return NotFound();
        }

        await _connectionService.UpsertAsync(
            protocol,
            new IntegrationConnectionUpsertRequest
            {
                BaseUrl = request.BaseUrl,
                ApiKey = request.ApiKey,
                PreserveExistingApiKey = request.PreserveExistingApiKey,
                ClearApiKey = request.ClearApiKey,
                TelemetrySyncEnabled = request.TelemetrySyncEnabled,
                TelemetrySyncIntervalMinutes = request.TelemetrySyncIntervalMinutes,
            },
            cancellationToken);

        var settings = await _connectionService.GetResolvedSettingsAsync(protocol, cancellationToken: cancellationToken);
        return Ok(MapConnection(settings));
    }

    [HttpPost("connections/{protocol}/test")]
    public async Task<ActionResult<IntegrationConnectionTestResultDto>> TestConnection(
        string protocol,
        [FromBody] IntegrationConnectionTestDto? request,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        if (!IsSupportedProtocol(protocol))
        {
            return NotFound();
        }

        var connectionOverride = string.IsNullOrWhiteSpace(request?.BaseUrl) && string.IsNullOrWhiteSpace(request?.ApiKey)
            ? null
            : new BridgeConnectionOverride
            {
                BaseUrl = request?.BaseUrl,
                ApiKey = request?.ApiKey,
            };

        try
        {
            switch (DeviceIntegrationConstants.NormalizeProtocol(protocol))
            {
                case DeviceIntegrationConstants.Matter:
                    await _matterBridgeClient.TestConnectionAsync(connectionOverride, cancellationToken);
                    break;
                case DeviceIntegrationConstants.Modbus:
                    await _modbusBridgeClient.TestConnectionAsync(connectionOverride, cancellationToken);
                    break;
                default:
                    return BadRequest(new IntegrationConnectionTestResultDto
                    {
                        IsReachable = false,
                        Message = "This protocol does not expose a bridge test flow yet.",
                    });
            }

            return Ok(new IntegrationConnectionTestResultDto
            {
                IsReachable = true,
                Message = "Bridge connection succeeded.",
                CheckedAtUtc = DateTime.UtcNow,
            });
        }
        catch (Exception ex)
        {
            return Ok(new IntegrationConnectionTestResultDto
            {
                IsReachable = false,
                Message = ex.Message,
                CheckedAtUtc = DateTime.UtcNow,
            });
        }
    }

    [HttpPost("{protocol}/discover-devices")]
    public async Task<ActionResult<IReadOnlyList<IntegrationDiscoveredDeviceDto>>> DiscoverDevices(
        string protocol,
        [FromBody] IntegrationConnectionTestDto? request,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        if (!IsSupportedProtocol(protocol))
        {
            return NotFound();
        }

        var connectionOverride = string.IsNullOrWhiteSpace(request?.BaseUrl) && string.IsNullOrWhiteSpace(request?.ApiKey)
            ? null
            : new BridgeConnectionOverride
            {
                BaseUrl = request?.BaseUrl,
                ApiKey = request?.ApiKey,
            };

        return DeviceIntegrationConstants.NormalizeProtocol(protocol) switch
        {
            DeviceIntegrationConstants.Matter => Ok((await _matterBridgeClient.DiscoverDevicesAsync(connectionOverride, cancellationToken))
                .Select(device => new IntegrationDiscoveredDeviceDto
                {
                    ExternalDeviceId = device.ExternalDeviceId,
                    Name = device.Name,
                    Type = device.Type,
                    Manufacturer = device.Manufacturer,
                    Model = device.Model,
                    Transport = device.Transport,
                    IsReachable = device.IsReachable,
                })
                .ToArray()),
            DeviceIntegrationConstants.Modbus => Ok((await _modbusBridgeClient.DiscoverDevicesAsync(connectionOverride, cancellationToken))
                .Select(device => new IntegrationDiscoveredDeviceDto
                {
                    ExternalDeviceId = device.ExternalDeviceId,
                    Name = device.Name,
                    Type = device.Kind,
                    Manufacturer = device.Manufacturer,
                    Model = device.Model,
                    Transport = device.Transport,
                    SourceType = device.Kind,
                    IsReachable = device.IsReachable,
                })
                .ToArray()),
            _ => BadRequest(Array.Empty<IntegrationDiscoveredDeviceDto>()),
        };
    }

    [HttpPost("modbus/sync-telemetry")]
    public async Task<ActionResult<ModbusTelemetrySyncResultDto>> SyncModbusTelemetry(
        [FromBody] IntegrationConnectionTestDto? request,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var connectionOverride = string.IsNullOrWhiteSpace(request?.BaseUrl) && string.IsNullOrWhiteSpace(request?.ApiKey)
            ? null
            : new BridgeConnectionOverride
            {
                BaseUrl = request?.BaseUrl,
                ApiKey = request?.ApiKey,
            };

        var result = await _modbusTelemetryImportService.SyncAsync(connectionOverride, cancellationToken);
        return Ok(new ModbusTelemetrySyncResultDto
        {
            ImportedSamples = result.ImportedSamples,
            SourceTypes = result.SourceTypes.ToArray(),
            SyncedAtUtc = result.SyncedAtUtc,
        });
    }

    private bool IsSupportedProtocol(string protocol)
    {
        var normalizedProtocol = DeviceIntegrationConstants.NormalizeProtocol(protocol);
        return _catalog.GetOptions().Any(option => option.Code == normalizedProtocol);
    }

    private static IntegrationConnectionDto MapConnection(ResolvedIntegrationConnectionSettings settings)
    {
        return new IntegrationConnectionDto
        {
            Protocol = settings.Protocol,
            BaseUrl = settings.BaseUrl,
            HasApiKey = settings.HasApiKey,
            TelemetrySyncEnabled = settings.TelemetrySyncEnabled,
            TelemetrySyncIntervalMinutes = settings.TelemetrySyncIntervalMinutes,
            UpdatedAtUtc = settings.UpdatedAtUtc,
            LastTelemetrySyncUtc = settings.LastTelemetrySyncUtc,
            LastTelemetrySyncStatus = settings.LastTelemetrySyncStatus,
        };
    }
}
