using SmartHomeManager.Common;
using SmartHomeManager.Dtos;
using SmartHomeManager.Models;
using SmartHomeManager.Repositories;

namespace SmartHomeManager.Services
{
    public class EnergyService : IEnergyService
    {
        private readonly IEnergyAssetRepository _energyAssets;
        private readonly IDeviceEnergyUsageRepository _deviceEnergyUsages;
        private readonly IEnergyTelemetrySampleRepository _energyTelemetrySamples;

        public EnergyService(
            IEnergyAssetRepository energyAssets,
            IDeviceEnergyUsageRepository deviceEnergyUsages,
            IEnergyTelemetrySampleRepository energyTelemetrySamples)
        {
            _energyAssets = energyAssets;
            _deviceEnergyUsages = deviceEnergyUsages;
            _energyTelemetrySamples = energyTelemetrySamples;
        }

        public async Task<ServiceResult<IReadOnlyList<EnergyAssetDto>>> GetAssetsAsync(CancellationToken cancellationToken = default)
        {
            var assets = await _energyAssets.GetAllWithTelemetryAsync(cancellationToken);
            var result = assets.Select(asset =>
            {
                var latestSample = asset.TelemetrySamples
                    .OrderByDescending(sample => sample.TimestampUtc)
                    .FirstOrDefault();

                return new EnergyAssetDto
                {
                    Id = asset.Id,
                    Name = asset.Name,
                    Kind = asset.Kind,
                    SourceType = asset.SourceType,
                    IntegrationProtocol = asset.IntegrationProtocol,
                    ExternalAssetId = asset.ExternalAssetId,
                    Manufacturer = asset.Manufacturer,
                    Model = asset.Model,
                    IsActive = asset.IsActive,
                    LastTelemetryUtc = latestSample?.TimestampUtc,
                    CurrentPowerWatts = latestSample?.PowerWatts,
                    StateOfChargePercent = latestSample?.StateOfChargePercent,
                };
            }).ToList();

            return ServiceResult<IReadOnlyList<EnergyAssetDto>>.Success(result);
        }

        public async Task<ServiceResult<EnergySummaryResponseDto>> GetSummaryAsync(CancellationToken cancellationToken = default)
        {
            var usages = await _deviceEnergyUsages.GetAllOrderedAsync(cancellationToken);
            if (usages.Count == 0)
            {
                return ServiceResult<EnergySummaryResponseDto>.Success(new EnergySummaryResponseDto());
            }

            var data = usages.Select(usage => new EnergySummaryItemDto
            {
                Id = usage.Id,
                DeviceId = usage.DeviceId,
                ConsumptionWh = usage.ConsumptionWh,
                Cost = Math.Round(usage.ConsumptionWh * 0.15, 2),
                Date = usage.TimestampUtc.ToString("o"),
            }).ToList();

            return ServiceResult<EnergySummaryResponseDto>.Success(new EnergySummaryResponseDto
            {
                Data = data,
                Total = Math.Round(data.Sum(item => item.ConsumptionWh), 2),
            });
        }

        public async Task<ServiceResult<EnergyOverviewResponseDto>> GetOverviewAsync(CancellationToken cancellationToken = default)
        {
            var now = DateTime.UtcNow;
            var since = now.AddHours(-24);
            var samples = await _energyTelemetrySamples.GetSinceAsync(since, cancellationToken);

            if (samples.Count == 0)
            {
                return ServiceResult<EnergyOverviewResponseDto>.Success(new EnergyOverviewResponseDto());
            }

            var latestBySource = samples
                .GroupBy(sample => sample.SourceType.Trim().ToLowerInvariant())
                .ToDictionary(group => group.Key, group => group.Last());

            var current = new EnergyOverviewCurrentDto
            {
                SolarPowerWatts = latestBySource.GetValueOrDefault("solar")?.PowerWatts ?? 0,
                HomeLoadWatts = latestBySource.GetValueOrDefault("home")?.PowerWatts ?? 0,
                GridPowerWatts = latestBySource.GetValueOrDefault("grid")?.PowerWatts ?? 0,
                BatteryPowerWatts = latestBySource.GetValueOrDefault("battery")?.PowerWatts ?? 0,
                BatteryStateOfChargePercent = latestBySource.GetValueOrDefault("battery")?.StateOfChargePercent,
                LastUpdatedUtc = latestBySource.Values.Max(sample => sample.TimestampUtc),
            };

            var today = new EnergyOverviewTodayDto();
            foreach (var sample in samples.Where(sample => sample.TimestampUtc.Date == now.Date))
            {
                switch (sample.SourceType.Trim().ToLowerInvariant())
                {
                    case "solar":
                        today.SolarWh += sample.EnergyDeltaWh;
                        break;
                    case "home":
                        today.HomeWh += sample.EnergyDeltaWh;
                        break;
                    case "grid":
                        if (sample.PowerWatts >= 0)
                        {
                            today.GridImportWh += sample.EnergyDeltaWh;
                        }
                        else
                        {
                            today.GridExportWh += sample.EnergyDeltaWh;
                        }
                        break;
                    case "battery":
                        if (sample.PowerWatts >= 0)
                        {
                            today.BatteryDischargeWh += sample.EnergyDeltaWh;
                        }
                        else
                        {
                            today.BatteryChargeWh += sample.EnergyDeltaWh;
                        }
                        break;
                }
            }

            var timeline = samples
                .GroupBy(sample => new DateTime(sample.TimestampUtc.Year, sample.TimestampUtc.Month, sample.TimestampUtc.Day, sample.TimestampUtc.Hour, 0, 0, DateTimeKind.Utc))
                .Select(group =>
                {
                    var groupedBySource = group.ToDictionary(item => item.SourceType.Trim().ToLowerInvariant(), item => item);
                    return new EnergyOverviewPointDto
                    {
                        TimestampUtc = group.Key.ToString("o"),
                        SolarPowerWatts = groupedBySource.GetValueOrDefault("solar")?.PowerWatts ?? 0,
                        HomeLoadWatts = groupedBySource.GetValueOrDefault("home")?.PowerWatts ?? 0,
                        GridPowerWatts = groupedBySource.GetValueOrDefault("grid")?.PowerWatts ?? 0,
                        BatteryPowerWatts = groupedBySource.GetValueOrDefault("battery")?.PowerWatts ?? 0,
                        BatteryStateOfChargePercent = groupedBySource.GetValueOrDefault("battery")?.StateOfChargePercent,
                    };
                })
                .OrderBy(point => point.TimestampUtc)
                .ToList();

            return ServiceResult<EnergyOverviewResponseDto>.Success(new EnergyOverviewResponseDto
            {
                Current = current,
                Today = today,
                Timeline = timeline,
            });
        }

        public async Task<ServiceResult<int>> IngestTelemetryAsync(EnergyTelemetryIngestDto request, CancellationToken cancellationToken = default)
        {
            var sample = new EnergyTelemetrySample
            {
                SourceType = request.SourceType.Trim().ToLowerInvariant(),
                TimestampUtc = request.TimestampUtc ?? DateTime.UtcNow,
                PowerWatts = request.PowerWatts,
                EnergyDeltaWh = request.EnergyDeltaWh,
                Voltage = request.Voltage,
                CurrentAmps = request.CurrentAmps,
                StateOfChargePercent = request.StateOfChargePercent,
            };

            await _energyTelemetrySamples.AddAsync(sample, cancellationToken);
            await _energyTelemetrySamples.SaveChangesAsync(cancellationToken);
            return ServiceResult<int>.Success(sample.Id);
        }
    }
}
