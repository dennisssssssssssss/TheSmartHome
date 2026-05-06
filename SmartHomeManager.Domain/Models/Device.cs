namespace SmartHomeManager.Models
{
    public class Device : AuditableEntity
    {
        public string Nume { get; set; } = string.Empty;
        public string Tip { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string IntegrationProtocol { get; set; } = "simulated";
        public string? Transport { get; set; }
        public string? ExternalDeviceId { get; set; }
        public string? Endpoint { get; set; }
        public string? Manufacturer { get; set; }
        public string? Model { get; set; }
        public DateTime? LastSeenUtc { get; set; }
        public bool EstePornit { get; set; }
        public double Valoare { get; set; }

        public double? SensorValue { get; set; }
        public string? SensorUnit { get; set; }

        public int? RoomId { get; set; }
        public Room? Room { get; set; }
    }
}
