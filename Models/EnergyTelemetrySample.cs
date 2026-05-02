namespace SmartHomeManager.Models
{
    public class EnergyTelemetrySample : BaseEntity
    {
        public int? EnergyAssetId { get; set; }
        public string SourceType { get; set; } = string.Empty;
        public DateTime TimestampUtc { get; set; } = DateTime.UtcNow;
        public double PowerWatts { get; set; }
        public double EnergyDeltaWh { get; set; }
        public double? Voltage { get; set; }
        public double? CurrentAmps { get; set; }
        public double? StateOfChargePercent { get; set; }
        public EnergyAsset? EnergyAsset { get; set; }
    }
}
