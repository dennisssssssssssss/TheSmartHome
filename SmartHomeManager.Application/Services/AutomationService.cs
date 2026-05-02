using AutoMapper;
using SmartHomeManager.Common;
using SmartHomeManager.Dtos;
using SmartHomeManager.Models;
using SmartHomeManager.Repositories;

namespace SmartHomeManager.Services
{
    public class AutomationService : IAutomationService
    {
        private readonly IAutomationRuleRepository _automations;
        private readonly IDeviceRepository _devices;
        private readonly IRoomRepository _rooms;
        private readonly IMapper _mapper;

        public AutomationService(
            IAutomationRuleRepository automations,
            IDeviceRepository devices,
            IRoomRepository rooms,
            IMapper mapper)
        {
            _automations = automations;
            _devices = devices;
            _rooms = rooms;
            _mapper = mapper;
        }

        public async Task<ServiceResult<IReadOnlyList<AutomationReadDto>>> GetAllAsync(CancellationToken cancellationToken = default)
        {
            var rules = await _automations.GetAllOrderedAsync(cancellationToken);
            return ServiceResult<IReadOnlyList<AutomationReadDto>>.Success(_mapper.Map<IReadOnlyList<AutomationReadDto>>(rules));
        }

        public async Task<ServiceResult<AutomationReadDto>> GetAsync(int id, CancellationToken cancellationToken = default)
        {
            var rule = await _automations.GetByIdAsync(id, cancellationToken);
            return rule == null
                ? ServiceResult<AutomationReadDto>.NotFound("Automation was not found.")
                : ServiceResult<AutomationReadDto>.Success(_mapper.Map<AutomationReadDto>(rule));
        }

        public async Task<ServiceResult<AutomationReadDto>> CreateAsync(AutomationUpsertDto dto, CancellationToken cancellationToken = default)
        {
            var validation = await ValidateTargetAsync(dto.DeviceId, dto.RoomId, cancellationToken);
            if (!validation.IsSuccess)
            {
                return ServiceResult<AutomationReadDto>.Validation(validation.Message ?? "Automation target is invalid.");
            }

            var rule = new AutomationRule
            {
                Name = dto.Name.Trim(),
                DeviceId = NormalizeOptionalId(dto.DeviceId),
                RoomId = NormalizeOptionalId(dto.RoomId),
                Action = dto.Action.Trim(),
                Value = dto.Value,
                NextRunUtc = NormalizeUtc(dto.NextRunUtc),
                IntervalMinutes = Math.Max(0, dto.IntervalMinutes),
                Enabled = dto.Enabled,
            };

            await _automations.AddAsync(rule, cancellationToken);
            await _automations.SaveChangesAsync(cancellationToken);
            return ServiceResult<AutomationReadDto>.Success(_mapper.Map<AutomationReadDto>(rule));
        }

        public async Task<ServiceResult> UpdateAsync(int id, AutomationUpsertDto dto, CancellationToken cancellationToken = default)
        {
            var rule = await _automations.GetByIdAsync(id, cancellationToken);
            if (rule == null)
            {
                return ServiceResult.NotFound("Automation was not found.");
            }

            var validation = await ValidateTargetAsync(dto.DeviceId, dto.RoomId, cancellationToken);
            if (!validation.IsSuccess)
            {
                return validation;
            }

            rule.Name = dto.Name.Trim();
            rule.DeviceId = NormalizeOptionalId(dto.DeviceId);
            rule.RoomId = NormalizeOptionalId(dto.RoomId);
            rule.Action = dto.Action.Trim();
            rule.Value = dto.Value;
            rule.NextRunUtc = NormalizeUtc(dto.NextRunUtc);
            rule.IntervalMinutes = Math.Max(0, dto.IntervalMinutes);
            rule.Enabled = dto.Enabled;

            _automations.Update(rule);
            await _automations.SaveChangesAsync(cancellationToken);
            return ServiceResult.Success();
        }

        public async Task<ServiceResult> DeleteAsync(int id, CancellationToken cancellationToken = default)
        {
            var rule = await _automations.GetByIdAsync(id, cancellationToken);
            if (rule == null)
            {
                return ServiceResult.NotFound("Automation was not found.");
            }

            _automations.Delete(rule);
            await _automations.SaveChangesAsync(cancellationToken);
            return ServiceResult.Success();
        }

        private async Task<ServiceResult> ValidateTargetAsync(int? deviceId, int? roomId, CancellationToken cancellationToken)
        {
            deviceId = NormalizeOptionalId(deviceId);
            roomId = NormalizeOptionalId(roomId);

            if (!deviceId.HasValue && !roomId.HasValue)
            {
                return ServiceResult.Validation("Automation must target a device or a room.");
            }

            if (deviceId.HasValue && await _devices.GetByIdAsync(deviceId.Value, cancellationToken) == null)
            {
                return ServiceResult.Validation("Selected device was not found.");
            }

            if (roomId.HasValue && await _rooms.GetByIdAsync(roomId.Value, cancellationToken) == null)
            {
                return ServiceResult.Validation("Selected room was not found.");
            }

            return ServiceResult.Success();
        }

        private static int? NormalizeOptionalId(int? value) =>
            value.GetValueOrDefault() > 0 ? value : null;

        private static DateTime NormalizeUtc(DateTime value)
        {
            return value.Kind switch
            {
                DateTimeKind.Utc => value,
                DateTimeKind.Local => value.ToUniversalTime(),
                _ => DateTime.SpecifyKind(value, DateTimeKind.Local).ToUniversalTime(),
            };
        }
    }
}
