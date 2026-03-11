using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;
using SmartHomeManager.Data;
using SmartHomeManager.Dtos;
using SmartHomeManager.Models;

namespace SmartHomeManager.Services
{
    // Background service that polls automation rules and executes due ones.
    public class AutomationSchedulerService : BackgroundService
    {
        private readonly IServiceProvider _services;
        private readonly ILogger<AutomationSchedulerService> _logger;
        private readonly TimeSpan _pollInterval = TimeSpan.FromSeconds(30);

        public AutomationSchedulerService(IServiceProvider services, ILogger<AutomationSchedulerService> logger)
        {
            _services = services;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Automation scheduler starting");
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _services.CreateScope();
                    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                    var deviceControl = scope.ServiceProvider.GetRequiredService<IDeviceControlService>();

                    var now = DateTime.UtcNow;
                    var dueRules = await db.AutomationRules
                        .Where(r => r.Enabled && r.NextRunUtc <= now)
                        .ToListAsync(stoppingToken);

                    foreach (var rule in dueRules)
                    {
                        try
                        {
                            var device = await db.Devices.FirstOrDefaultAsync(d => d.Id == rule.DeviceId, stoppingToken);
                            if (device == null)
                            {
                                _logger.LogWarning("Automation {RuleId} targets missing device {DeviceId}", rule.Id, rule.DeviceId);
                                // disable or skip — keep as-is here
                                rule.Enabled = false;
                                db.AutomationRules.Update(rule);
                                continue;
                            }

                            var cmd = new DeviceControlDto
                            {
                                Command = rule.Action,
                                Value = rule.Value
                            };

                            await deviceControl.ExecuteCommandAsync(device, cmd);

                            // update rule metadata
                            rule.LastRunUtc = DateTime.UtcNow;
                            if (rule.IntervalMinutes > 0)
                            {
                                rule.NextRunUtc = rule.NextRunUtc.AddMinutes(rule.IntervalMinutes);
                            }
                            else
                            {
                                rule.Enabled = false; // one-shot
                            }

                            db.Devices.Update(device);
                            db.AutomationRules.Update(rule);
                            await db.SaveChangesAsync(stoppingToken);
                            _logger.LogInformation("Executed automation {RuleId} for device {DeviceId}", rule.Id, device.Id);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Failed executing automation {RuleId}", rule.Id);
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error in automation poll loop");
                }

                await Task.Delay(_pollInterval, stoppingToken);
            }

            _logger.LogInformation("Automation scheduler stopping");
        }
    }
}