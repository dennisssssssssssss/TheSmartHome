namespace SmartHomeManager.Models
{
    public class DeviceEnergyUsage
    {
        public int Id { get; set; }
        public int DeviceId { get; set; }
        public DateTime TimestampUtc { get; set; } = DateTime.UtcNow;
        // consumption in watt-hours for a measurement interval
        public double ConsumptionWh { get; set; }
    }
}