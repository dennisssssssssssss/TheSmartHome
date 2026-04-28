using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using SmartHomeManager.Hubs;
using SmartHomeManager.Services;

namespace SmartHomeManager.Tests.Infrastructure;

internal sealed class TestAutomationSchedulerService : AutomationSchedulerService
{
    public TestAutomationSchedulerService(
        IServiceProvider services,
        ILogger<AutomationSchedulerService> logger,
        IHubContext<SmartHomeHub> hubContext)
        : base(services, logger, hubContext)
    {
    }

    public Task RunUntilCancelledAsync(CancellationToken cancellationToken)
    {
        return ExecuteAsync(cancellationToken);
    }
}
