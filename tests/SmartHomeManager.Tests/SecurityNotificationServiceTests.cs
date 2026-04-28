using Microsoft.EntityFrameworkCore;
using SmartHomeManager.Models;
using SmartHomeManager.Services;
using SmartHomeManager.Tests.Infrastructure;

namespace SmartHomeManager.Tests;

public sealed class SecurityNotificationServiceTests
{
    [Fact]
    public async Task PublishDeviceEventAsync_ShouldCreateNotification_AndBroadcastUpdate()
    {
        var (db, connection) = TestDbFactory.CreateContext();
        await using var _ = db;
        await using var __ = connection;
        var hubContext = new RecordingHubContext();
        var service = new SecurityNotificationService(db, hubContext);
        var lockDevice = new Device
        {
            Nume = "Front Door Lock",
            Tip = "Incuietoare",
            EstePornit = false,
            Valoare = 0,
        };

        var published = await service.PublishDeviceEventAsync(lockDevice, "TurnOff", source: "dashboard");

        Assert.True(published);

        var notification = await db.Notifications.SingleAsync();
        Assert.Equal("Lock Unsecured", notification.Title);
        Assert.Equal("alert", notification.Type);
        Assert.Contains("dashboard", notification.Message);
        Assert.Contains(hubContext.RecordingClients.AllProxy.Calls, call => call.Method == "NotificationUpdated");
    }
}
