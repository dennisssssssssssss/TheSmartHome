namespace SmartHomeManager.Services.Integrations;

public sealed class ModbusDeviceCommandRequest
{
    public string Command { get; set; } = string.Empty;
    public double? Value { get; set; }
}

public sealed class ModbusTelemetrySnapshot
{
    public DateTime? SampledAtUtc { get; set; }
    public IReadOnlyList<ModbusTelemetryPoint> Sources { get; set; } = Array.Empty<ModbusTelemetryPoint>();
}

public sealed class ModbusTelemetryPoint
{
    public string SourceType { get; set; } = string.Empty;
    public double PowerWatts { get; set; }
    public double EnergyDeltaWh { get; set; }
    public double? Voltage { get; set; }
    public double? CurrentAmps { get; set; }
    public double? StateOfChargePercent { get; set; }
    public string? ExternalDeviceId { get; set; }
    public string? AssetName { get; set; }
    public string? AssetKind { get; set; }
    public string? Manufacturer { get; set; }
    public string? Model { get; set; }
}

public sealed class ModbusDiscoveredDevice
{
    public string ExternalDeviceId { get; set; } = string.Empty;
    public string? Name { get; set; }
    public string? Kind { get; set; }
    public string? Manufacturer { get; set; }
    public string? Model { get; set; }
    public string Transport { get; set; } = DeviceIntegrationConstants.Rs485;
    public bool IsReachable { get; set; }
}
