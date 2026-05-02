using Microsoft.EntityFrameworkCore;
using SmartHomeManager.Data;
using SmartHomeManager.Models;
using SmartHomeManager.Repositories;

namespace SmartHomeManager.Infrastructure.Repositories
{
    public class AutomationRuleRepository : Repository<AutomationRule>, IAutomationRuleRepository
    {
        public AutomationRuleRepository(AppDbContext dbContext)
            : base(dbContext)
        {
        }

        public async Task<IReadOnlyList<AutomationRule>> GetAllOrderedAsync(CancellationToken cancellationToken = default)
        {
            return await DbContext.AutomationRules
                .AsNoTracking()
                .OrderBy(rule => rule.NextRunUtc)
                .ThenBy(rule => rule.Name)
                .ToListAsync(cancellationToken);
        }
    }
}
