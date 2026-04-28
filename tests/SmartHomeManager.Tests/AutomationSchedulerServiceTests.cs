using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using SmartHomeManager.Data;
using SmartHomeManager.Models;
using SmartHomeManager.Services;
using SmartHomeManager.Tests.Infrastructure;

namespace SmartHomeManager.Tests;

public sealed class AutomationSchedulerServiceTests
{
    [Fact]
    public async Task ExecuteAsync_ShouldRunDueRecurringRule_AndScheduleNextRun()
    {
        var (seedContext, connection) = TestDbFactory.CreateContext();
        await using var _ = connection;

        await using (seedContext)
        {
            var room = new Room { Name = "Living Room" };
            seedContext.Rooms.Add(room);
            await seedContext.SaveChangesAsync();

            var device = new Device
            {
                Nume = "Living Room Lamp",
                Tip = "Lampa",
                EstePornit = false,
                Valoare = 0,
                RoomId = room.Id,
            };

            seedContext.Devices.Add(device);
            await seedContext.SaveChangesAsync();

            seedContext.AutomationRules.Add(new AutomationRule
            {
                Name = "Morning Lights",
                DeviceId = device.Id,
                Action = "TurnOn",
                Enabled = true,
                IntervalMinutes = 15,
                NextRunUtc = DateTime.UtcNow.AddMinutes(-1),
            });
            await seedContext.SaveChangesAsync();
        }

        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(options => options.UseSqlite(connection));

        var securityNotifications = new RecordingSecurityNotificationService();
        services.AddScoped<ISecurityNotificationService>(_ => securityNotifications);

        var hubContext = new RecordingHubContext();
        await using var provider = services.BuildServiceProvider();
        var scheduler = new TestAutomationSchedulerService(provider, NullLogger<AutomationSchedulerService>.Instance, hubContext);
        using var cancellationSource = new CancellationTokenSource(TimeSpan.FromMilliseconds(150));

        await scheduler.RunUntilCancelledAsync(cancellationSource.Token);

        await using var verificationScope = provider.CreateAsyncScope();
        var verificationDb = verificationScope.ServiceProvider.GetRequiredService<AppDbContext>();
        var deviceAfterRun = await verificationDb.Devices.SingleAsync();
        var ruleAfterRun = await verificationDb.AutomationRules.SingleAsync();
        var logAfterRun = await verificationDb.ActivityLogs.SingleAsync();

        Assert.True(deviceAfterRun.EstePornit);
        Assert.True(ruleAfterRun.Enabled);
        Assert.NotNull(ruleAfterRun.LastRunUtc);
        Assert.True(ruleAfterRun.NextRunUtc > ruleAfterRun.LastRunUtc);
        Assert.Contains("Automation:TurnOn", logAfterRun.Action);
        Assert.Single(securityNotifications.Calls);
        Assert.Contains(hubContext.RecordingClients.AllProxy.Calls, call => call.Method == "UpdateUI");
    }
}
