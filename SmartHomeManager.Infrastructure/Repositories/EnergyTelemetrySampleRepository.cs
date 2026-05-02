using Microsoft.EntityFrameworkCore;
using SmartHomeManager.Data;
using SmartHomeManager.Models;
using SmartHomeManager.Repositories;

namespace SmartHomeManager.Infrastructure.Repositories
{
    public class EnergyTelemetrySampleRepository : Repository<EnergyTelemetrySample>, IEnergyTelemetrySampleRepository
    {
        public EnergyTelemetrySampleRepository(AppDbContext dbContext)
            : base(dbContext)
        {
        }

        public async Task<IReadOnlyList<EnergyTelemetrySample>> GetSinceAsync(DateTime sinceUtc, CancellationToken cancellationToken = default)
        {
            return await DbContext.EnergyTelemetrySamples
                .AsNoTracking()
                .Where(sample => sample.TimestampUtc >= sinceUtc)
                .OrderBy(sample => sample.TimestampUtc)
                .ToListAsync(cancellationToken);
        }

        public async Task<IReadOnlyList<(string SourceType, int SampleCount, DateTime? LastUpdatedUtc)>> GetSourceSummariesAsync(CancellationToken cancellationToken = default)
        {
            return await DbContext.EnergyTelemetrySamples
                .AsNoTracking()
                .GroupBy(sample => sample.SourceType)
                .Select(group => new ValueTuple<string, int, DateTime?>(
                    group.Key,
                    group.Count(),
                    group.Max(sample => (DateTime?)sample.TimestampUtc)))
                .ToListAsync(cancellationToken);
        }
    }
}
