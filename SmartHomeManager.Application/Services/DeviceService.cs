using AutoMapper;
using SmartHomeManager.Common;
using SmartHomeManager.Dtos;
using SmartHomeManager.Models;
using SmartHomeManager.Repositories;
using SmartHomeManager.Services.Integrations;

namespace SmartHomeManager.Services
{
    public class DeviceService : IDeviceService
    {
        private readonly IDeviceRepository _devices;
        private readonly IRoomRepository _rooms;
        private readonly IActivityLogRepository _activityLogs;
        private readonly IMapper _mapper;
        private readonly IDeviceControlService _deviceControlService;
        private readonly ISecurityNotificationService _securityNotificationService;
        private readonly IRealtimeEventPublisher _realtimeEventPublisher;
        private readonly IDeviceIntegrationCatalogService _integrationCatalog;
        private readonly IMatterBridgeClient _matterBridgeClient;

        public DeviceService(
            IDeviceRepository devices,
            IRoomRepository rooms,
            IActivityLogRepository activityLogs,
            IMapper mapper,
            IDeviceControlService deviceControlService,
            ISecurityNotificationService securityNotificationService,
            IRealtimeEventPublisher realtimeEventPublisher,
            IDeviceIntegrationCatalogService integrationCatalog,
            IMatterBridgeClient matterBridgeClient)
        {
            _devices = devices;
            _rooms = rooms;
            _activityLogs = activityLogs;
            _mapper = mapper;
            _deviceControlService = deviceControlService;
            _securityNotificationService = securityNotificationService;
            _realtimeEventPublisher = realtimeEventPublisher;
            _integrationCatalog = integrationCatalog;
            _matterBridgeClient = matterBridgeClient;
        }

        public Task<IReadOnlyList<DeviceIntegrationOptionDto>> GetIntegrationOptionsAsync(CancellationToken cancellationToken = default)
        {
            var options = _integrationCatalog.GetOptions()
                .Select(option => new DeviceIntegrationOptionDto
                {
                    Code = option.Code,
                    Label = option.Label,
                    Status = option.Status,
                    Description = option.Description,
                    RecommendedFor = option.RecommendedFor,
                    Transports = option.Transports,
                })
                .ToList();

            return Task.FromResult<IReadOnlyList<DeviceIntegrationOptionDto>>(options);
        }

        public async Task<ServiceResult<MatterPairingResponseDto>> PairMatterDeviceAsync(MatterPairingRequestDto request, CancellationToken cancellationToken = default)
        {
            var result = await _matterBridgeClient.PairDeviceAsync(
                new MatterPairingRequest
                {
                    PairingCode = request.PairingCode.Trim(),
                    SuggestedName = string.IsNullOrWhiteSpace(request.Name) ? null : request.Name.Trim(),
                    SuggestedType = string.IsNullOrWhiteSpace(request.Type) ? null : request.Type.Trim(),
                    Transport = DeviceIntegrationConstants.NormalizeTransport(request.Transport) ?? DeviceIntegrationConstants.Wifi,
                },
                string.IsNullOrWhiteSpace(request.BridgeBaseUrl)
                    ? null
                    : new BridgeConnectionOverride { BaseUrl = request.BridgeBaseUrl },
                cancellationToken);

            return ServiceResult<MatterPairingResponseDto>.Success(new MatterPairingResponseDto
            {
                ExternalDeviceId = result.ExternalDeviceId,
                SuggestedName = result.SuggestedName,
                SuggestedType = result.SuggestedType,
                Manufacturer = result.Manufacturer,
                Model = result.Model,
                Endpoint = result.Endpoint,
                Transport = result.Transport,
                Protocol = DeviceIntegrationConstants.Matter,
                IsReachable = result.IsReachable,
            });
        }

        public async Task<ServiceResult<IReadOnlyList<DeviceReadDto>>> GetDevicesAsync(CancellationToken cancellationToken = default)
        {
            var devices = await _devices.GetAllWithRoomAsync(cancellationToken);
            return ServiceResult<IReadOnlyList<DeviceReadDto>>.Success(_mapper.Map<IReadOnlyList<DeviceReadDto>>(devices));
        }

        public async Task<ServiceResult<DeviceReadDto>> GetDeviceAsync(int id, CancellationToken cancellationToken = default)
        {
            var device = await _devices.GetByIdWithRoomAsync(id, asNoTracking: true, cancellationToken: cancellationToken);
            return device == null
                ? ServiceResult<DeviceReadDto>.NotFound("Device was not found.")
                : ServiceResult<DeviceReadDto>.Success(_mapper.Map<DeviceReadDto>(device));
        }

        public async Task<ServiceResult<DeviceReadDto>> CreateDeviceAsync(DeviceCreateDto dto, CancellationToken cancellationToken = default)
        {
            Room? room = null;
            if (dto.RoomId.HasValue)
            {
                room = await _rooms.GetByIdAsync(dto.RoomId.Value, cancellationToken);
                if (room == null)
                {
                    return ServiceResult<DeviceReadDto>.Validation("Selected room was not found.");
                }
            }

            var device = new Device
            {
                Nume = dto.Name.Trim(),
                Tip = dto.Type.Trim(),
                Category = DeviceTaxonomy.ResolveCategory(dto.Category, dto.Type),
                IntegrationProtocol = DeviceIntegrationConstants.NormalizeProtocol(dto.IntegrationProtocol),
                Transport = DeviceIntegrationConstants.NormalizeTransport(dto.Transport),
                ExternalDeviceId = string.IsNullOrWhiteSpace(dto.ExternalDeviceId) ? null : dto.ExternalDeviceId.Trim(),
                Endpoint = string.IsNullOrWhiteSpace(dto.Endpoint) ? null : dto.Endpoint.Trim(),
                Manufacturer = string.IsNullOrWhiteSpace(dto.Manufacturer) ? null : dto.Manufacturer.Trim(),
                Model = string.IsNullOrWhiteSpace(dto.Model) ? null : dto.Model.Trim(),
                EstePornit = dto.IsOn,
                Valoare = dto.Value,
                RoomId = dto.RoomId,
                Room = room,
            };

            await _devices.AddAsync(device, cancellationToken);
            await _devices.SaveChangesAsync(cancellationToken);

            await RecordActivityAsync(
                "DeviceCreated",
                $"DeviceId={device.Id}; Name='{device.Nume}'; RoomId={device.RoomId}",
                cancellationToken);

            return ServiceResult<DeviceReadDto>.Success(_mapper.Map<DeviceReadDto>(device));
        }

        public async Task<ServiceResult<DeviceReadDto>> UpdateDeviceAsync(int id, DeviceCreateDto dto, CancellationToken cancellationToken = default)
        {
            var device = await _devices.GetByIdWithRoomAsync(id, cancellationToken: cancellationToken);
            if (device == null)
            {
                return ServiceResult<DeviceReadDto>.NotFound("Device was not found.");
            }

            Room? room = null;
            if (dto.RoomId.HasValue)
            {
                room = await _rooms.GetByIdAsync(dto.RoomId.Value, cancellationToken);
                if (room == null)
                {
                    return ServiceResult<DeviceReadDto>.Validation("Selected room was not found.");
                }
            }

            device.Nume = dto.Name.Trim();
            device.Tip = dto.Type.Trim();
            device.Category = DeviceTaxonomy.ResolveCategory(dto.Category, dto.Type);
            device.IntegrationProtocol = DeviceIntegrationConstants.NormalizeProtocol(dto.IntegrationProtocol);
            device.Transport = DeviceIntegrationConstants.NormalizeTransport(dto.Transport);
            device.ExternalDeviceId = string.IsNullOrWhiteSpace(dto.ExternalDeviceId) ? null : dto.ExternalDeviceId.Trim();
            device.Endpoint = string.IsNullOrWhiteSpace(dto.Endpoint) ? null : dto.Endpoint.Trim();
            device.Manufacturer = string.IsNullOrWhiteSpace(dto.Manufacturer) ? null : dto.Manufacturer.Trim();
            device.Model = string.IsNullOrWhiteSpace(dto.Model) ? null : dto.Model.Trim();
            device.EstePornit = dto.IsOn;
            device.Valoare = dto.Value;
            device.RoomId = dto.RoomId;
            device.Room = room;

            _devices.Update(device);
            await _devices.SaveChangesAsync(cancellationToken);

            await RecordActivityAsync(
                "DeviceUpdated",
                $"DeviceId={device.Id}; Name='{device.Nume}'; IsOn={device.EstePornit}; RoomId={device.RoomId}",
                cancellationToken);

            return ServiceResult<DeviceReadDto>.Success(_mapper.Map<DeviceReadDto>(device));
        }

        public async Task<ServiceResult> ControlDeviceAsync(int id, DeviceControlDto command, CancellationToken cancellationToken = default)
        {
            var device = await _devices.GetByIdWithRoomAsync(id, cancellationToken: cancellationToken);
            if (device == null)
            {
                return ServiceResult.NotFound("Device was not found.");
            }

            await _deviceControlService.ExecuteCommandAsync(device, command);
            await _devices.SaveChangesAsync(cancellationToken);

            var action = command.Command ?? "Unknown";
            var details = BuildControlDetails(device, action, command.Value);

            await RecordActivityAsync($"Control:{action}", details, cancellationToken);

            try
            {
                await _securityNotificationService.PublishDeviceEventAsync(device, action, command.Value, "manual control", cancellationToken);
            }
            catch
            {
                // Security notifications are best-effort and should not block device control.
            }

            return ServiceResult.Success();
        }

        public async Task<ServiceResult> DeleteDeviceAsync(int id, CancellationToken cancellationToken = default)
        {
            var device = await _devices.GetByIdAsync(id, cancellationToken);
            if (device == null)
            {
                return ServiceResult.NotFound("Device was not found.");
            }

            _devices.Delete(device);
            await _devices.SaveChangesAsync(cancellationToken);

            await RecordActivityAsync(
                "DeviceDeleted",
                $"DeviceId={device.Id}; Name='{device.Nume}'",
                cancellationToken);

            return ServiceResult.Success();
        }

        private async Task RecordActivityAsync(string action, string details, CancellationToken cancellationToken)
        {
            var log = new ActivityLog
            {
                TimestampUtc = DateTime.UtcNow,
                Action = action,
                Details = details,
            };

            await _activityLogs.AddAsync(log, cancellationToken);
            await _activityLogs.SaveChangesAsync(cancellationToken);

            await _realtimeEventPublisher.PublishUiUpdatedAsync(cancellationToken);
            await _realtimeEventPublisher.PublishLogAsync(log, cancellationToken);
        }

        private static string BuildControlDetails(Device device, string action, double? value)
        {
            if (action.Equals("TurnOn", StringComparison.OrdinalIgnoreCase) ||
                action.Equals("On", StringComparison.OrdinalIgnoreCase))
            {
                return $"DeviceId={device.Id}; Name='{device.Nume}' turned ON";
            }

            if (action.Equals("TurnOff", StringComparison.OrdinalIgnoreCase) ||
                action.Equals("Off", StringComparison.OrdinalIgnoreCase))
            {
                return $"DeviceId={device.Id}; Name='{device.Nume}' turned OFF";
            }

            if (action.Equals("SetValue", StringComparison.OrdinalIgnoreCase) && value.HasValue)
            {
                return $"DeviceId={device.Id}; Name='{device.Nume}' set value {value.Value}";
            }

            return $"DeviceId={device.Id}; Name='{device.Nume}' action={action}";
        }
    }
}
