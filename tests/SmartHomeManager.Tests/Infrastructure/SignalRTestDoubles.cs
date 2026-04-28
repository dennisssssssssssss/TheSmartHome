using Microsoft.AspNetCore.SignalR;
using SmartHomeManager.Hubs;

namespace SmartHomeManager.Tests.Infrastructure;

internal sealed class RecordingHubContext : IHubContext<SmartHomeHub>
{
    public RecordingHubClients RecordingClients { get; } = new();

    public IHubClients Clients => RecordingClients;

    public IGroupManager Groups { get; } = new NullGroupManager();
}

internal sealed class RecordingHubClients : IHubClients
{
    public RecordingClientProxy AllProxy { get; } = new();

    public IClientProxy All => AllProxy;

    public IClientProxy AllExcept(IReadOnlyList<string> excludedConnectionIds) => AllProxy;

    public IClientProxy Client(string connectionId) => AllProxy;

    public IClientProxy Clients(IReadOnlyList<string> connectionIds) => AllProxy;

    public IClientProxy Group(string groupName) => AllProxy;

    public IClientProxy GroupExcept(string groupName, IReadOnlyList<string> excludedConnectionIds) => AllProxy;

    public IClientProxy Groups(IReadOnlyList<string> groupNames) => AllProxy;

    public IClientProxy User(string userId) => AllProxy;

    public IClientProxy Users(IReadOnlyList<string> userIds) => AllProxy;
}

internal sealed class RecordingClientProxy : IClientProxy
{
    public List<(string Method, object?[] Args)> Calls { get; } = new();

    public Task SendCoreAsync(string method, object?[] args, CancellationToken cancellationToken = default)
    {
        Calls.Add((method, args));
        return Task.CompletedTask;
    }
}

internal sealed class NullGroupManager : IGroupManager
{
    public Task AddToGroupAsync(string connectionId, string groupName, CancellationToken cancellationToken = default)
        => Task.CompletedTask;

    public Task RemoveFromGroupAsync(string connectionId, string groupName, CancellationToken cancellationToken = default)
        => Task.CompletedTask;
}
