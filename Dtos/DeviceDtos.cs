using System.ComponentModel.DataAnnotations;

using System;

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

        [StringLength(100, ErrorMessage = "Categoria nu poate depăși 100 caractere.")]
        public string? Category { get; set; }

        [StringLength(50, ErrorMessage = "Protocolul nu poate depăși 50 caractere.")]
        public string? IntegrationProtocol { get; set; }

        [StringLength(50, ErrorMessage = "Transportul nu poate depăși 50 caractere.")]
        public string? Transport { get; set; }

        [StringLength(200, ErrorMessage = "Identificatorul extern nu poate depăși 200 caractere.")]
        public string? ExternalDeviceId { get; set; }

        [StringLength(500, ErrorMessage = "Endpoint-ul nu poate depăși 500 caractere.")]
        public string? Endpoint { get; set; }

        [StringLength(150, ErrorMessage = "Producătorul nu poate depăși 150 caractere.")]
        public string? Manufacturer { get; set; }

        [StringLength(150, ErrorMessage = "Modelul nu poate depăși 150 caractere.")]
        public string? Model { get; set; }
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
        public string Category { get; set; } = string.Empty;
        public string IntegrationProtocol { get; set; } = "simulated";
        public string? Transport { get; set; }
        public string? ExternalDeviceId { get; set; }
        public string? Endpoint { get; set; }
        public string? Manufacturer { get; set; }
        public string? Model { get; set; }
        public DateTime? LastSeenUtc { get; set; }

        // Newly added sensor properties
        public double? SensorValue { get; set; }
        public string? SensorUnit { get; set; }
    }

    public class DeviceIntegrationOptionDto
    {
        public string Code { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string RecommendedFor { get; set; } = string.Empty;
        public string[] Transports { get; set; } = Array.Empty<string>();
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
