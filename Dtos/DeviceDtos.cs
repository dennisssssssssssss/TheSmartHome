using System.ComponentModel.DataAnnotations;

namespace SmartHomeManager.Dtos
{
    public class DeviceCreateDto
    {
        [Required]
        public string Name { get; set; } = string.Empty;
        [Required]
        public string Type { get; set; } = string.Empty;
        public bool IsOn { get; set; }
        public double Value { get; set; }
        public int? RoomId { get; set; }
    }

    public class DeviceReadDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public bool IsOn { get; set; }
        public double Value { get; set; }
        public int? RoomId { get; set; }
        public string? RoomName { get; set; }
    }

    public class DeviceControlDto
    {
        // e.g. "TurnOn", "TurnOff", "SetValue"
        [Required]
        public string Command { get; set; } = string.Empty;
        public double? Value { get; set; }
    }
}