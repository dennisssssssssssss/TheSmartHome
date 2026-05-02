using SmartHomeManager.Models;

namespace SmartHomeManager.Repositories
{
    public interface IEnergyTelemetrySampleRepository : IRepository<EnergyTelemetrySample>
    {
        Task<IReadOnlyList<EnergyTelemetrySample>> GetSinceAsync(DateTime sinceUtc, CancellationToken cancellationToken = default);
        Task<IReadOnlyList<(string SourceType, int SampleCount, DateTime? LastUpdatedUtc)>> GetSourceSummariesAsync(CancellationToken cancellationToken = default);
    }
}
