using AutoMapper;
using SmartHomeManager.Common;
using SmartHomeManager.Dtos;
using SmartHomeManager.Repositories;

namespace SmartHomeManager.Services
{
    public class LogService : ILogService
    {
        private readonly IActivityLogRepository _activityLogs;
        private readonly IMapper _mapper;

        public LogService(IActivityLogRepository activityLogs, IMapper mapper)
        {
            _activityLogs = activityLogs;
            _mapper = mapper;
        }

        public async Task<ServiceResult<IReadOnlyList<ActivityLogReadDto>>> GetLatestAsync(CancellationToken cancellationToken = default)
        {
            var logs = await _activityLogs.GetLatestAsync(cancellationToken: cancellationToken);
            return ServiceResult<IReadOnlyList<ActivityLogReadDto>>.Success(
                _mapper.Map<IReadOnlyList<ActivityLogReadDto>>(logs));
        }
    }
}
