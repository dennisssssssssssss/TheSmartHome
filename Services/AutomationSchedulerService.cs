using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;
using SmartHomeManager.Data;
using SmartHomeManager.Dtos;
using SmartHomeManager.Models;

namespace SmartHomeManager.Services
{
    // Runs once per minute, finds due automation rules and executes them.
    public class AutomationSchedulerService : BackgroundService
    {
        private readonly IServiceProvider _services;
        private readonly ILogger<AutomationSchedulerService> _logger;
        private readonly TimeSpan _pollInterval = TimeSpan.FromMinutes(1);

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

                    // Compare in UTC because rules use NextRunUtc
                    var nowUtc = DateTime.UtcNow;

                    var dueRules = await db.AutomationRules
                        .Where(r => r.Enabled && r.NextRunUtc <= nowUtc)
                        .ToListAsync(stoppingToken);

                    foreach (var rule in dueRules)
                    {
                        var exec = new AutomationExecution
                        {
                            AutomationRuleId = rule.Id,
                            RuleName = rule.Name,
                            ExecutedAtUtc = DateTime.UtcNow
                        };

                        var targetedDeviceIds = new List<int>();
                        var success = true;

                        try
                        {
                            // Determine targets: device or all devices in a room
                            List<Device> targets = new();

                            if (rule.DeviceId.HasValue)
                            {
                                var device = await db.Devices.FirstOrDefaultAsync(d => d.Id == rule.DeviceId.Value, stoppingToken);
                                if (device != null) targets.Add(device);
                            }
                            else if (rule.RoomId.HasValue)
                            {
                                targets = await db.Devices
                                    .Where(d => d.RoomId == rule.RoomId.Value)
                                    .ToListAsync(stoppingToken);
                            }
                            else
                            {
                                _logger.LogWarning("Automation {RuleId} has no DeviceId or RoomId target", rule.Id);
                                success = false;
                            }

                            if (targets.Count == 0 && success)
                            {
                                _logger.LogWarning("Automation {RuleId} found no target devices", rule.Id);
                                success = false;
                            }

                            // Execute for each targeted device
                            foreach (var device in targets)
                            {
                                targetedDeviceIds.Add(device.Id);

                                var cmd = new DeviceControlDto
                                {
                                    Command = rule.Action,
                                    Value = rule.Value
                                };

                                await deviceControl.ExecuteCommandAsync(device, cmd);

                                // persist device state (DeviceControlService updates the entity but not SaveChanges)
                                db.Devices.Update(device);
                            }

                            // update rule metadata
                            rule.LastRunUtc = DateTime.UtcNow;
                            if (rule.IntervalMinutes > 0)
                            {
                                // compute next run based on the previous NextRunUtc to keep schedule stable
                                rule.NextRunUtc = rule.NextRunUtc.AddMinutes(rule.IntervalMinutes);
                            }
                            else
                            {
                                rule.Enabled = false; // one-shot
                            }

                            db.AutomationRules.Update(rule);

                            // create execution log
                            exec.Successful = success;
                            exec.Details = $"TargetDevices=[{string.Join(",", targetedDeviceIds)}]; Action={rule.Action}; Value={rule.Value}";

                            db.AutomationExecutions.Add(exec);

                            await db.SaveChangesAsync(stoppingToken);

                            _logger.LogInformation("Executed automation {RuleId} for targets {Targets}", rule.Id, exec.Details);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Failed executing automation {RuleId}", rule.Id);
                            exec.Successful = false;
                            exec.Details += $" Exception: {ex.Message}";
                            try
                            {
                                db.AutomationExecutions.Add(exec);
                                await db.SaveChangesAsync(stoppingToken);
                            }
                            catch (Exception inner)
                            {
                                _logger.LogError(inner, "Failed saving automation execution log for rule {RuleId}", rule.Id);
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error in automation poll loop");
                }

                try
                {
                    // Așteaptă până la următoarea verificare
                    await Task.Delay(_pollInterval, stoppingToken);
                }
                catch (TaskCanceledException)
                {
                    // Ignorăm eroarea. Asta înseamnă pur și simplu că aplicația se închide.
                    _logger.LogInformation("Serviciul de fundal a fost oprit elegant.");
                    break;
                }
            }

            _logger.LogInformation("Automation scheduler stopping");
        }
    }
}