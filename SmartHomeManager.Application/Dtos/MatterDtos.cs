using System.ComponentModel.DataAnnotations;

namespace SmartHomeManager.Dtos;

public sealed class MatterPairingRequestDto
{
    [Required]
    public string PairingCode { get; set; } = string.Empty;

    public string? BridgeBaseUrl { get; set; }

    public string? Transport { get; set; }

    public string? Name { get; set; }

    public string? Type { get; set; }
}

public sealed class MatterPairingResponseDto
{
    public string ExternalDeviceId { get; set; } = string.Empty;
    public string? SuggestedName { get; set; }
    public string? SuggestedType { get; set; }
    public string? Manufacturer { get; set; }
    public string? Model { get; set; }
    public string? Endpoint { get; set; }
    public string Transport { get; set; } = string.Empty;
    public string Protocol { get; set; } = "matter";
    public bool IsReachable { get; set; }
}
