namespace SmartHomeManager.Models;

public sealed class IntegrationBridgeConnection : AuditableEntity
{
    public string Protocol { get; set; } = string.Empty;
    public string? BaseUrl { get; set; }
    public string? ApiKey { get; set; }
    public bool TelemetrySyncEnabled { get; set; }
    public int TelemetrySyncIntervalMinutes { get; set; } = 15;
    public DateTime? LastTelemetrySyncUtc { get; set; }
    public string? LastTelemetrySyncStatus { get; set; }
}
