using SmartHomeManager.Common;
using SmartHomeManager.Dtos;
using SmartHomeManager.Repositories;
using SmartHomeManager.Services.Integrations;

namespace SmartHomeManager.Services
{
    public class IntegrationService : IIntegrationService
    {
        private readonly IDeviceRepository _devices;
        private readonly IEnergyTelemetrySampleRepository _energyTelemetrySamples;
        private readonly IDeviceIntegrationCatalogService _catalog;
        private readonly IIntegrationConnectionService _connectionService;
        private readonly IMatterBridgeClient _matterBridgeClient;
        private readonly IModbusBridgeClient _modbusBridgeClient;
        private readonly IModbusTelemetryImportService _modbusTelemetryImportService;

        public IntegrationService(
            IDeviceRepository devices,
            IEnergyTelemetrySampleRepository energyTelemetrySamples,
            IDeviceIntegrationCatalogService catalog,
            IIntegrationConnectionService connectionService,
            IMatterBridgeClient matterBridgeClient,
            IModbusBridgeClient modbusBridgeClient,
            IModbusTelemetryImportService modbusTelemetryImportService)
        {
            _devices = devices;
            _energyTelemetrySamples = energyTelemetrySamples;
            _catalog = catalog;
            _connectionService = connectionService;
            _matterBridgeClient = matterBridgeClient;
            _modbusBridgeClient = modbusBridgeClient;
            _modbusTelemetryImportService = modbusTelemetryImportService;
        }

        public async Task<ServiceResult<IntegrationOverviewDto>> GetOverviewAsync(CancellationToken cancellationToken = default)
        {
            var devices = await _devices.ListAsync(cancellationToken);
            var deviceCounts = devices
                .GroupBy(device => device.IntegrationProtocol)
                .ToDictionary(group => group.Key, group => group.Count(), StringComparer.OrdinalIgnoreCase);

            var telemetrySources = (await _energyTelemetrySamples.GetSourceSummariesAsync(cancellationToken))
                .OrderBy(source => source.SourceType)
                .Select(source => new IntegrationTelemetrySourceDto
                {
                    SourceType = source.SourceType,
                    SampleCount = source.SampleCount,
                    LastUpdatedUtc = source.LastUpdatedUtc,
                })
                .ToList();

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
                    DeviceCount = deviceCounts.GetValueOrDefault(option.Code, 0),
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

            return ServiceResult<IntegrationOverviewDto>.Success(new IntegrationOverviewDto
            {
                Protocols = protocols,
                TelemetrySources = telemetrySources,
                TotalIntegratedDevices = protocols.Sum(protocol => protocol.DeviceCount),
            });
        }

        public async Task<ServiceResult<IReadOnlyList<IntegrationConnectionDto>>> GetConnectionsAsync(CancellationToken cancellationToken = default)
        {
            var items = new List<IntegrationConnectionDto>();
            foreach (var option in _catalog.GetOptions())
            {
                var settings = await _connectionService.GetResolvedSettingsAsync(option.Code, cancellationToken: cancellationToken);
                items.Add(MapConnection(settings));
            }

            return ServiceResult<IReadOnlyList<IntegrationConnectionDto>>.Success(items);
        }

        public async Task<ServiceResult<IntegrationConnectionDto>> GetConnectionAsync(string protocol, CancellationToken cancellationToken = default)
        {
            if (!IsSupportedProtocol(protocol))
            {
                return ServiceResult<IntegrationConnectionDto>.NotFound("Integration protocol was not found.");
            }

            var settings = await _connectionService.GetResolvedSettingsAsync(protocol, cancellationToken: cancellationToken);
            return ServiceResult<IntegrationConnectionDto>.Success(MapConnection(settings));
        }

        public async Task<ServiceResult<IntegrationConnectionDto>> UpsertConnectionAsync(string protocol, IntegrationConnectionUpsertDto request, CancellationToken cancellationToken = default)
        {
            if (!IsSupportedProtocol(protocol))
            {
                return ServiceResult<IntegrationConnectionDto>.NotFound("Integration protocol was not found.");
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
            return ServiceResult<IntegrationConnectionDto>.Success(MapConnection(settings));
        }

        public async Task<ServiceResult<IntegrationConnectionTestResultDto>> TestConnectionAsync(string protocol, IntegrationConnectionTestDto? request, CancellationToken cancellationToken = default)
        {
            if (!IsSupportedProtocol(protocol))
            {
                return ServiceResult<IntegrationConnectionTestResultDto>.NotFound("Integration protocol was not found.");
            }

            var connectionOverride = BuildConnectionOverride(request);

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
                        return ServiceResult<IntegrationConnectionTestResultDto>.Validation("This protocol does not expose a bridge test flow yet.");
                }

                return ServiceResult<IntegrationConnectionTestResultDto>.Success(new IntegrationConnectionTestResultDto
                {
                    IsReachable = true,
                    Message = "Bridge connection succeeded.",
                    CheckedAtUtc = DateTime.UtcNow,
                });
            }
            catch (Exception ex)
            {
                return ServiceResult<IntegrationConnectionTestResultDto>.Success(new IntegrationConnectionTestResultDto
                {
                    IsReachable = false,
                    Message = ex.Message,
                    CheckedAtUtc = DateTime.UtcNow,
                });
            }
        }

        public async Task<ServiceResult<IReadOnlyList<IntegrationDiscoveredDeviceDto>>> DiscoverDevicesAsync(string protocol, IntegrationConnectionTestDto? request, CancellationToken cancellationToken = default)
        {
            if (!IsSupportedProtocol(protocol))
            {
                return ServiceResult<IReadOnlyList<IntegrationDiscoveredDeviceDto>>.NotFound("Integration protocol was not found.");
            }

            var connectionOverride = BuildConnectionOverride(request);
            IReadOnlyList<IntegrationDiscoveredDeviceDto> devices = DeviceIntegrationConstants.NormalizeProtocol(protocol) switch
            {
                DeviceIntegrationConstants.Matter => (await _matterBridgeClient.DiscoverDevicesAsync(connectionOverride, cancellationToken))
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
                    .ToArray(),
                DeviceIntegrationConstants.Modbus => (await _modbusBridgeClient.DiscoverDevicesAsync(connectionOverride, cancellationToken))
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
                    .ToArray(),
                _ => Array.Empty<IntegrationDiscoveredDeviceDto>(),
            };

            return ServiceResult<IReadOnlyList<IntegrationDiscoveredDeviceDto>>.Success(devices);
        }

        public async Task<ServiceResult<ModbusTelemetrySyncResultDto>> SyncModbusTelemetryAsync(IntegrationConnectionTestDto? request, CancellationToken cancellationToken = default)
        {
            var connectionOverride = BuildConnectionOverride(request);
            var result = await _modbusTelemetryImportService.SyncAsync(connectionOverride, cancellationToken);

            return ServiceResult<ModbusTelemetrySyncResultDto>.Success(new ModbusTelemetrySyncResultDto
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

        private static BridgeConnectionOverride? BuildConnectionOverride(IntegrationConnectionTestDto? request)
        {
            return string.IsNullOrWhiteSpace(request?.BaseUrl) && string.IsNullOrWhiteSpace(request?.ApiKey)
                ? null
                : new BridgeConnectionOverride
                {
                    BaseUrl = request?.BaseUrl,
                    ApiKey = request?.ApiKey,
                };
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
}
