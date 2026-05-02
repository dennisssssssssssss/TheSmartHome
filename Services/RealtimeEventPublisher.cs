using Microsoft.AspNetCore.SignalR;
using SmartHomeManager.Hubs;
using SmartHomeManager.Models;

namespace SmartHomeManager.Services
{
    public class RealtimeEventPublisher : IRealtimeEventPublisher
    {
        private readonly IHubContext<SmartHomeHub> _hubContext;
        private readonly ILogger<RealtimeEventPublisher> _logger;

        public RealtimeEventPublisher(IHubContext<SmartHomeHub> hubContext, ILogger<RealtimeEventPublisher> logger)
        {
            _hubContext = hubContext;
            _logger = logger;
        }

        public async Task PublishUiUpdatedAsync(CancellationToken cancellationToken = default)
        {
            await SafeSendAsync("UpdateUI", cancellationToken);
        }

        public async Task PublishLogAsync(ActivityLog log, CancellationToken cancellationToken = default)
        {
            await SafeSendAsync("ReceiveLog", cancellationToken, log);
        }

        public async Task PublishNotificationsUpdatedAsync(CancellationToken cancellationToken = default)
        {
            await SafeSendAsync("NotificationUpdated", cancellationToken);
        }

        private async Task SafeSendAsync(string methodName, CancellationToken cancellationToken, params object[] args)
        {
            try
            {
                await _hubContext.Clients.All.SendCoreAsync(methodName, args, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to publish realtime event {MethodName}.", methodName);
            }
        }
    }
}
