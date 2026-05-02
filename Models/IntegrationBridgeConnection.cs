namespace SmartHomeManager.Models;

public sealed class IntegrationBridgeConnection : BaseEntity
{
    public string Protocol { get; set; } = string.Empty;
    public string? BaseUrl { get; set; }
    public string? ApiKey { get; set; }
    public bool TelemetrySyncEnabled { get; set; }
    public int TelemetrySyncIntervalMinutes { get; set; } = 15;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? LastTelemetrySyncUtc { get; set; }
    public string? LastTelemetrySyncStatus { get; set; }
}
