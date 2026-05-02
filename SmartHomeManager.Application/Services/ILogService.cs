using SmartHomeManager.Common;
using SmartHomeManager.Dtos;

namespace SmartHomeManager.Services
{
    public interface ILogService
    {
        Task<ServiceResult<IReadOnlyList<ActivityLogReadDto>>> GetLatestAsync(CancellationToken cancellationToken = default);
    }
}
