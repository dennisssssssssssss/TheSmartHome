using System.ComponentModel.DataAnnotations;

namespace SmartHomeManager.Dtos
{
    public class DeviceCreateDto
    {
        [Required(ErrorMessage = "Numele dispozitivului este obligatoriu.")]
        [StringLength(100, MinimumLength = 2, ErrorMessage = "Numele trebuie să aibă între 2 și 100 caractere.")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "Tipul dispozitivului este obligatoriu.")]
        [StringLength(50, MinimumLength = 2, ErrorMessage = "Tipul trebuie să aibă între 2 și 50 caractere.")]
        public string Type { get; set; } = string.Empty;

        public bool IsOn { get; set; }

        // Optionally validate a reasonable numeric range for device value
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

        // Newly added sensor properties
        public double? SensorValue { get; set; }
        public string? SensorUnit { get; set; }
    }

    public class DeviceControlDto
    {
        // e.g. "TurnOn", "TurnOff", "SetValue"
        [Required(ErrorMessage = "Comanda este obligatorie.")]
        public string Command { get; set; } = string.Empty;

        public double? Value { get; set; }

        public bool IsOn { get; set; } // Added property

        public string StatusText => IsOn ? "Pornit" : "Oprit";
    }
}