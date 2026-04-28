namespace SmartHomeManager.Services.Integrations;

public sealed class MatterBridgeOptions
{
    public string? BaseUrl { get; set; }
    public string? ApiKey { get; set; }
    public int TimeoutSeconds { get; set; } = 10;
}
