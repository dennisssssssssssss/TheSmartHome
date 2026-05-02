using SmartHomeManager.Common;
using SmartHomeManager.Dtos;

namespace SmartHomeManager.Services
{
    public interface IEnergyService
    {
        Task<ServiceResult<IReadOnlyList<EnergyAssetDto>>> GetAssetsAsync(CancellationToken cancellationToken = default);
        Task<ServiceResult<EnergySummaryResponseDto>> GetSummaryAsync(CancellationToken cancellationToken = default);
        Task<ServiceResult<EnergyOverviewResponseDto>> GetOverviewAsync(CancellationToken cancellationToken = default);
        Task<ServiceResult<int>> IngestTelemetryAsync(EnergyTelemetryIngestDto request, CancellationToken cancellationToken = default);
    }
}
