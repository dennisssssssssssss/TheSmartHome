using System.ComponentModel.DataAnnotations;

namespace SmartHomeManager.Dtos;

public sealed class EnergyTelemetryIngestDto
{
    [Required]
    public string SourceType { get; set; } = string.Empty;

    public DateTime? TimestampUtc { get; set; }

    public double PowerWatts { get; set; }

    public double EnergyDeltaWh { get; set; }

    public double? Voltage { get; set; }

    public double? CurrentAmps { get; set; }

    public double? StateOfChargePercent { get; set; }
}

public sealed class EnergyAssetDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Kind { get; set; } = string.Empty;
    public string SourceType { get; set; } = string.Empty;
    public string IntegrationProtocol { get; set; } = string.Empty;
    public string? ExternalAssetId { get; set; }
    public string? Manufacturer { get; set; }
    public string? Model { get; set; }
    public bool IsActive { get; set; }
    public DateTime? LastTelemetryUtc { get; set; }
    public double? CurrentPowerWatts { get; set; }
    public double? StateOfChargePercent { get; set; }
}

public sealed class EnergyOverviewResponseDto
{
    public EnergyOverviewCurrentDto Current { get; set; } = new();
    public EnergyOverviewTodayDto Today { get; set; } = new();
    public IReadOnlyList<EnergyOverviewPointDto> Timeline { get; set; } = Array.Empty<EnergyOverviewPointDto>();
}

public sealed class EnergyOverviewCurrentDto
{
    public double SolarPowerWatts { get; set; }
    public double HomeLoadWatts { get; set; }
    public double GridPowerWatts { get; set; }
    public double BatteryPowerWatts { get; set; }
    public double? BatteryStateOfChargePercent { get; set; }
    public DateTime? LastUpdatedUtc { get; set; }
}

public sealed class EnergyOverviewTodayDto
{
    public double SolarWh { get; set; }
    public double HomeWh { get; set; }
    public double GridImportWh { get; set; }
    public double GridExportWh { get; set; }
    public double BatteryChargeWh { get; set; }
    public double BatteryDischargeWh { get; set; }
}

public sealed class EnergyOverviewPointDto
{
    public string TimestampUtc { get; set; } = string.Empty;
    public double SolarPowerWatts { get; set; }
    public double HomeLoadWatts { get; set; }
    public double GridPowerWatts { get; set; }
    public double BatteryPowerWatts { get; set; }
    public double? BatteryStateOfChargePercent { get; set; }
}
