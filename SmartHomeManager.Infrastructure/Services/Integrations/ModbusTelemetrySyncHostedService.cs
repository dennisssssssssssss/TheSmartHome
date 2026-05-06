using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace SmartHomeManager.Services.Integrations;

public sealed class ModbusTelemetrySyncHostedService : BackgroundService
{
    private static readonly TimeSpan PollInterval = TimeSpan.FromMinutes(1);

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<ModbusTelemetrySyncHostedService> _logger;

    public ModbusTelemetrySyncHostedService(
        IServiceScopeFactory scopeFactory,
        ILogger<ModbusTelemetrySyncHostedService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(PollInterval);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await SyncIfDueAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Automatic Modbus telemetry sync failed.");
            }

            try
            {
                if (!await timer.WaitForNextTickAsync(stoppingToken))
                {
                    break;
                }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
        }
    }

    private async Task SyncIfDueAsync(CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var connectionService = scope.ServiceProvider.GetRequiredService<IIntegrationConnectionService>();
        var importer = scope.ServiceProvider.GetRequiredService<IModbusTelemetryImportService>();

        var settings = await connectionService.GetResolvedSettingsAsync(DeviceIntegrationConstants.Modbus, cancellationToken: cancellationToken);
        if (!settings.TelemetrySyncEnabled || !settings.IsConfigured)
        {
            return;
        }

        var interval = TimeSpan.FromMinutes(Math.Max(settings.TelemetrySyncIntervalMinutes, 1));
        var now = DateTime.UtcNow;
        if (settings.LastTelemetrySyncUtc.HasValue && now - settings.LastTelemetrySyncUtc.Value < interval)
        {
            return;
        }

        try
        {
            await importer.SyncAsync(cancellationToken: cancellationToken);
        }
        catch (Exception ex)
        {
            await connectionService.MarkTelemetrySyncAsync(
                DeviceIntegrationConstants.Modbus,
                settings.LastTelemetrySyncUtc,
                $"Failed: {ex.Message}",
                cancellationToken);
            throw;
        }
    }
}
