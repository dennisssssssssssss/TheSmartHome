namespace SmartHomeManager.Services.Integrations;

public sealed class DeviceIntegrationDescriptor
{
    public string Code { get; init; } = string.Empty;
    public string Label { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public string RecommendedFor { get; init; } = string.Empty;
    public string[] Transports { get; init; } = Array.Empty<string>();
}
