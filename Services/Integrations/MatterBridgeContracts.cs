namespace SmartHomeManager.Services.Integrations;

public sealed class MatterPairingRequest
{
    public string PairingCode { get; set; } = string.Empty;
    public string? Transport { get; set; }
    public string? SuggestedName { get; set; }
    public string? SuggestedType { get; set; }
}

public sealed class MatterPairingResult
{
    public string ExternalDeviceId { get; set; } = string.Empty;
    public string? SuggestedName { get; set; }
    public string? SuggestedType { get; set; }
    public string? Manufacturer { get; set; }
    public string? Model { get; set; }
    public string? Endpoint { get; set; }
    public string Transport { get; set; } = DeviceIntegrationConstants.Wifi;
    public bool IsReachable { get; set; }
}

public sealed class MatterDiscoveredDevice
{
    public string ExternalDeviceId { get; set; } = string.Empty;
    public string? Name { get; set; }
    public string? Type { get; set; }
    public string? Manufacturer { get; set; }
    public string? Model { get; set; }
    public string Transport { get; set; } = DeviceIntegrationConstants.Wifi;
    public bool IsReachable { get; set; }
}

public sealed class MatterDeviceCommandRequest
{
    public string Command { get; set; } = string.Empty;
    public double? Value { get; set; }
}
