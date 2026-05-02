using SmartHomeManager.Common;
using SmartHomeManager.Dtos;

namespace SmartHomeManager.Services
{
    public interface IAutomationService
    {
        Task<ServiceResult<IReadOnlyList<AutomationReadDto>>> GetAllAsync(CancellationToken cancellationToken = default);
        Task<ServiceResult<AutomationReadDto>> GetAsync(int id, CancellationToken cancellationToken = default);
        Task<ServiceResult<AutomationReadDto>> CreateAsync(AutomationUpsertDto dto, CancellationToken cancellationToken = default);
        Task<ServiceResult> UpdateAsync(int id, AutomationUpsertDto dto, CancellationToken cancellationToken = default);
        Task<ServiceResult> DeleteAsync(int id, CancellationToken cancellationToken = default);
    }
}
