using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartHomeManager.Data;
using SmartHomeManager.Dtos;

namespace SmartHomeManager.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class EnergyController : ControllerBase
    {
        private readonly AppDbContext _db;

        public EnergyController(AppDbContext db)
        {
            _db = db;
        }

        [HttpGet("assets")]
        public async Task<ActionResult<IEnumerable<EnergyAssetDto>>> GetAssets()
        {
            var assets = await _db.EnergyAssets
                .AsNoTracking()
                .Include(asset => asset.TelemetrySamples.OrderByDescending(sample => sample.TimestampUtc).Take(1))
                .OrderBy(asset => asset.Kind)
                .ThenBy(asset => asset.Name)
                .ToListAsync();

            return Ok(assets.Select(asset =>
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
            }));
        }

        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary()
        {
            var usages = await _db.DeviceEnergyUsages
                .AsNoTracking()
                .OrderBy(e => e.TimestampUtc)
                .ToListAsync();

            if (usages.Count == 0)
            {
                return Ok(new
                {
                    data = Array.Empty<object>(),
                    total = 0.0
                });
            }

            var data = usages.Select(e => new
            {
                id = e.Id,
                device_id = e.DeviceId,
                consumption = e.ConsumptionWh,
                cost = Math.Round(e.ConsumptionWh * 0.15, 2),
                date = e.TimestampUtc.ToString("o")
            }).ToList();

            return Ok(new
            {
                data,
                total = Math.Round(data.Sum(d => d.consumption), 2)
            });
        }

        [HttpGet("overview")]
        public async Task<ActionResult<EnergyOverviewResponseDto>> GetOverview()
        {
            var now = DateTime.UtcNow;
            var since = now.AddHours(-24);

            var samples = await _db.EnergyTelemetrySamples
                .AsNoTracking()
                .Where(sample => sample.TimestampUtc >= since)
                .OrderBy(sample => sample.TimestampUtc)
                .ToListAsync();

            if (samples.Count == 0)
            {
                return Ok(new EnergyOverviewResponseDto());
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

            return Ok(new EnergyOverviewResponseDto
            {
                Current = current,
                Today = today,
                Timeline = timeline,
            });
        }

        [HttpPost("telemetry")]
        public async Task<IActionResult> IngestTelemetry([FromBody] EnergyTelemetryIngestDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var sample = new Models.EnergyTelemetrySample
            {
                SourceType = request.SourceType.Trim().ToLowerInvariant(),
                TimestampUtc = request.TimestampUtc ?? DateTime.UtcNow,
                PowerWatts = request.PowerWatts,
                EnergyDeltaWh = request.EnergyDeltaWh,
                Voltage = request.Voltage,
                CurrentAmps = request.CurrentAmps,
                StateOfChargePercent = request.StateOfChargePercent,
            };

            _db.EnergyTelemetrySamples.Add(sample);
            await _db.SaveChangesAsync();

            return Accepted(new { sample.Id });
        }
    }
}
