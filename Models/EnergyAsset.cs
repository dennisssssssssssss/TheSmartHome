namespace SmartHomeManager.Models;

public sealed class EnergyAsset
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Kind { get; set; } = string.Empty;
    public string SourceType { get; set; } = string.Empty;
    public string IntegrationProtocol { get; set; } = string.Empty;
    public string? ExternalAssetId { get; set; }
    public string? Manufacturer { get; set; }
    public string? Model { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;

    public ICollection<EnergyTelemetrySample> TelemetrySamples { get; set; } = new List<EnergyTelemetrySample>();
}
