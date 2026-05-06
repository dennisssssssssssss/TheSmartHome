namespace SmartHomeManager.Services.Integrations;

public sealed class BridgeConnectionOverride
{
    public string? BaseUrl { get; init; }
    public string? ApiKey { get; init; }
}

public sealed class ResolvedIntegrationConnectionSettings
{
    public string Protocol { get; init; } = string.Empty;
    public string? BaseUrl { get; init; }
    public string? ApiKey { get; init; }
    public bool TelemetrySyncEnabled { get; init; }
    public int TelemetrySyncIntervalMinutes { get; init; } = 15;
    public DateTime? UpdatedAtUtc { get; init; }
    public DateTime? LastTelemetrySyncUtc { get; init; }
    public string? LastTelemetrySyncStatus { get; init; }

    public bool IsConfigured => !string.IsNullOrWhiteSpace(BaseUrl);
    public bool HasApiKey => !string.IsNullOrWhiteSpace(ApiKey);
}

public sealed class IntegrationConnectionUpsertRequest
{
    public string? BaseUrl { get; init; }
    public string? ApiKey { get; init; }
    public bool PreserveExistingApiKey { get; init; } = true;
    public bool ClearApiKey { get; init; }
    public bool TelemetrySyncEnabled { get; init; }
    public int TelemetrySyncIntervalMinutes { get; init; } = 15;
}

public sealed class ModbusTelemetrySyncResult
{
    public int ImportedSamples { get; init; }
    public IReadOnlyList<string> SourceTypes { get; init; } = Array.Empty<string>();
    public DateTime SyncedAtUtc { get; init; } = DateTime.UtcNow;
}
