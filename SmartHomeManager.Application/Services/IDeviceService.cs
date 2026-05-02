using SmartHomeManager.Common;
using SmartHomeManager.Dtos;

namespace SmartHomeManager.Services
{
    public interface IDeviceService
    {
        Task<IReadOnlyList<DeviceIntegrationOptionDto>> GetIntegrationOptionsAsync(CancellationToken cancellationToken = default);
        Task<ServiceResult<MatterPairingResponseDto>> PairMatterDeviceAsync(MatterPairingRequestDto request, CancellationToken cancellationToken = default);
        Task<ServiceResult<IReadOnlyList<DeviceReadDto>>> GetDevicesAsync(CancellationToken cancellationToken = default);
        Task<ServiceResult<DeviceReadDto>> GetDeviceAsync(int id, CancellationToken cancellationToken = default);
        Task<ServiceResult<DeviceReadDto>> CreateDeviceAsync(DeviceCreateDto dto, CancellationToken cancellationToken = default);
        Task<ServiceResult<DeviceReadDto>> UpdateDeviceAsync(int id, DeviceCreateDto dto, CancellationToken cancellationToken = default);
        Task<ServiceResult> ControlDeviceAsync(int id, DeviceControlDto command, CancellationToken cancellationToken = default);
        Task<ServiceResult> DeleteDeviceAsync(int id, CancellationToken cancellationToken = default);
    }
}
