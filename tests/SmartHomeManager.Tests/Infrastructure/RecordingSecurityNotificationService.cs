using SmartHomeManager.Models;
using SmartHomeManager.Services;

namespace SmartHomeManager.Tests.Infrastructure;

internal sealed class RecordingSecurityNotificationService : ISecurityNotificationService
{
    public List<(Device Device, string Action, double? Value, string? Source)> Calls { get; } = new();

    public Task<bool> PublishDeviceEventAsync(
        Device device,
        string action,
        double? value = null,
        string? source = null,
        CancellationToken cancellationToken = default)
    {
        Calls.Add((device, action, value, source));
        return Task.FromResult(true);
    }
}
