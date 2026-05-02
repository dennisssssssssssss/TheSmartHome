using SmartHomeManager.Common;
using SmartHomeManager.Dtos;

namespace SmartHomeManager.Services
{
    public interface IIntegrationService
    {
        Task<ServiceResult<IntegrationOverviewDto>> GetOverviewAsync(CancellationToken cancellationToken = default);
        Task<ServiceResult<IReadOnlyList<IntegrationConnectionDto>>> GetConnectionsAsync(CancellationToken cancellationToken = default);
        Task<ServiceResult<IntegrationConnectionDto>> GetConnectionAsync(string protocol, CancellationToken cancellationToken = default);
        Task<ServiceResult<IntegrationConnectionDto>> UpsertConnectionAsync(string protocol, IntegrationConnectionUpsertDto request, CancellationToken cancellationToken = default);
        Task<ServiceResult<IntegrationConnectionTestResultDto>> TestConnectionAsync(string protocol, IntegrationConnectionTestDto? request, CancellationToken cancellationToken = default);
        Task<ServiceResult<IReadOnlyList<IntegrationDiscoveredDeviceDto>>> DiscoverDevicesAsync(string protocol, IntegrationConnectionTestDto? request, CancellationToken cancellationToken = default);
        Task<ServiceResult<ModbusTelemetrySyncResultDto>> SyncModbusTelemetryAsync(IntegrationConnectionTestDto? request, CancellationToken cancellationToken = default);
    }
}
