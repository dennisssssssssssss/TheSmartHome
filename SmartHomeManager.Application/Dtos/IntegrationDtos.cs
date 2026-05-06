using System.ComponentModel.DataAnnotations;

namespace SmartHomeManager.Dtos;

public sealed class IntegrationOverviewDto
{
    public IReadOnlyList<IntegrationProtocolOverviewDto> Protocols { get; set; } = Array.Empty<IntegrationProtocolOverviewDto>();
    public IReadOnlyList<IntegrationTelemetrySourceDto> TelemetrySources { get; set; } = Array.Empty<IntegrationTelemetrySourceDto>();
    public int TotalIntegratedDevices { get; set; }
}

public sealed class IntegrationProtocolOverviewDto
{
    public string Code { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string RecommendedFor { get; set; } = string.Empty;
    public string[] Transports { get; set; } = Array.Empty<string>();
    public int DeviceCount { get; set; }
    public bool IsConfigured { get; set; }
    public string? BaseUrl { get; set; }
    public bool HasApiKey { get; set; }
    public bool TelemetrySyncEnabled { get; set; }
    public int TelemetrySyncIntervalMinutes { get; set; } = 15;
    public DateTime? ConnectionUpdatedUtc { get; set; }
    public DateTime? LastTelemetrySyncUtc { get; set; }
    public string? LastTelemetrySyncStatus { get; set; }
}

public sealed class IntegrationTelemetrySourceDto
{
    public string SourceType { get; set; } = string.Empty;
    public int SampleCount { get; set; }
    public DateTime? LastUpdatedUtc { get; set; }
}

public sealed class IntegrationConnectionDto
{
    public string Protocol { get; set; } = string.Empty;
    public string? BaseUrl { get; set; }
    public bool HasApiKey { get; set; }
    public bool TelemetrySyncEnabled { get; set; }
    public int TelemetrySyncIntervalMinutes { get; set; } = 15;
    public DateTime? UpdatedAtUtc { get; set; }
    public DateTime? LastTelemetrySyncUtc { get; set; }
    public string? LastTelemetrySyncStatus { get; set; }
}

public sealed class IntegrationConnectionUpsertDto
{
    [Url]
    public string? BaseUrl { get; set; }

    public string? ApiKey { get; set; }

    public bool PreserveExistingApiKey { get; set; } = true;

    public bool ClearApiKey { get; set; }

    public bool TelemetrySyncEnabled { get; set; }

    [Range(1, 1440)]
    public int TelemetrySyncIntervalMinutes { get; set; } = 15;
}

public sealed class IntegrationConnectionTestDto
{
    [Url]
    public string? BaseUrl { get; set; }

    public string? ApiKey { get; set; }
}

public sealed class IntegrationConnectionTestResultDto
{
    public bool IsReachable { get; set; }
    public string Message { get; set; } = string.Empty;
    public DateTime CheckedAtUtc { get; set; } = DateTime.UtcNow;
}

public sealed class IntegrationDiscoveredDeviceDto
{
    public string ExternalDeviceId { get; set; } = string.Empty;
    public string? Name { get; set; }
    public string? Type { get; set; }
    public string? Manufacturer { get; set; }
    public string? Model { get; set; }
    public string? Transport { get; set; }
    public string? SourceType { get; set; }
    public bool IsReachable { get; set; }
}

public sealed class ModbusTelemetrySyncResultDto
{
    public int ImportedSamples { get; set; }
    public string[] SourceTypes { get; set; } = Array.Empty<string>();
    public DateTime SyncedAtUtc { get; set; }
}
