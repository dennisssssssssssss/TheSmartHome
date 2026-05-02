using SmartHomeManager.Models;

namespace SmartHomeManager.Repositories
{
    public interface IAutomationRuleRepository : IRepository<AutomationRule>
    {
        Task<IReadOnlyList<AutomationRule>> GetAllOrderedAsync(CancellationToken cancellationToken = default);
    }
}
