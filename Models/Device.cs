namespace SmartHomeManager.Models
{
    public class Device
    {
        public int Id { get; set; }
        public string Nume { get; set; } = string.Empty;
        public string Tip { get; set; } = string.Empty;
        public bool EstePornit { get; set; }
        public double Valoare { get; set; }

        public double? SensorValue { get; set; }
        public string? SensorUnit { get; set; }

        public int? RoomId { get; set; }
        public Room? Room { get; set; }
    }
}