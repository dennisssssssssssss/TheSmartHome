using Microsoft.EntityFrameworkCore;
using SmartHomeManager.Data;
using SmartHomeManager.Models;
using SmartHomeManager.Repositories;

namespace SmartHomeManager.Infrastructure.Repositories
{
    public class ActivityLogRepository : Repository<ActivityLog>, IActivityLogRepository
    {
        public ActivityLogRepository(AppDbContext dbContext)
            : base(dbContext)
        {
        }

        public async Task<IReadOnlyList<ActivityLog>> GetLatestAsync(int take = 50, CancellationToken cancellationToken = default)
        {
            return await DbContext.ActivityLogs
                .AsNoTracking()
                .OrderByDescending(log => log.TimestampUtc)
                .Take(take)
                .ToListAsync(cancellationToken);
        }
    }
}
