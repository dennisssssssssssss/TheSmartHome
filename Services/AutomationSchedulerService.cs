using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;
using Microsoft.AspNetCore.SignalR;
using SmartHomeManager.Data;
using SmartHomeManager.Dtos;
using SmartHomeManager.Models;
using SmartHomeManager.Hubs;

namespace SmartHomeManager.Services
{
    // Runs frequently to execute due automation rules.
    public class AutomationSchedulerService : BackgroundService
    {
        private readonly IServiceProvider _services;
        private readonly ILogger<AutomationSchedulerService> _logger;
        private readonly IHubContext<SmartHomeHub> _hubContext;
        // Precision: poll every 5 seconds
        private readonly TimeSpan _pollInterval = TimeSpan.FromSeconds(5);

        public AutomationSchedulerService(IServiceProvider services, ILogger<AutomationSchedulerService> logger, IHubContext<SmartHomeHub> hubContext)
        {
            _services = services;
            _logger = logger;
            _hubContext = hubContext;
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
                    var securityNotificationService = scope.ServiceProvider.GetRequiredService<ISecurityNotificationService>();

                    var nowUtc = DateTime.UtcNow;

                    // find enabled rules that are due now (or earlier)
                    var dueRules = await db.AutomationRules
                        .Where(r => r.Enabled && r.NextRunUtc <= nowUtc)
                        .ToListAsync(stoppingToken);

                    foreach (var rule in dueRules)
                    {
                        try
                        {
                            var executedAtUtc = DateTime.UtcNow;
                            var targetHandled = false;
                            var affectedDevices = new List<Device>();
                            var executionLogs = new List<ActivityLog>();

                            void ApplyRule(Device targetDevice)
                            {
                                if (string.Equals(rule.Action, "TurnOn", StringComparison.OrdinalIgnoreCase) ||
                                    string.Equals(rule.Action, "On", StringComparison.OrdinalIgnoreCase))
                                {
                                    targetDevice.EstePornit = true;
                                }
                                else if (string.Equals(rule.Action, "TurnOff", StringComparison.OrdinalIgnoreCase) ||
                                         string.Equals(rule.Action, "Off", StringComparison.OrdinalIgnoreCase))
                                {
                                    targetDevice.EstePornit = false;
                                }
                                else if (string.Equals(rule.Action, "SetValue", StringComparison.OrdinalIgnoreCase) && rule.Value.HasValue)
                                {
                                    targetDevice.Valoare = rule.Value.Value;
                                }
                                else
                                {
                                    _logger.LogWarning("Automation {RuleId} has unsupported action {Action}", rule.Id, rule.Action);
                                }

                                db.Devices.Update(targetDevice);
                                affectedDevices.Add(targetDevice);
                                executionLogs.Add(new ActivityLog
                                {
                                    TimestampUtc = executedAtUtc,
                                    Action = $"Automation:{rule.Action}",
                                    Details = $"Rule='{rule.Name}'; DeviceId={targetDevice.Id}; Name='{targetDevice.Nume}'"
                                });
                            }

                            if (rule.DeviceId.HasValue)
                            {
                                var device = await db.Devices.FirstOrDefaultAsync(d => d.Id == rule.DeviceId.Value, stoppingToken);
                                if (device != null)
                                {
                                    ApplyRule(device);
                                    targetHandled = true;
                                }
                                else
                                {
                                    _logger.LogWarning("Automation {RuleId} targets missing device {DeviceId}", rule.Id, rule.DeviceId);
                                }
                            }
                            else if (rule.RoomId.HasValue)
                            {
                                var roomDevices = await db.Devices
                                    .Where(d => d.RoomId == rule.RoomId.Value)
                                    .ToListAsync(stoppingToken);

                                if (roomDevices.Count == 0)
                                {
                                    _logger.LogWarning("Automation {RuleId} targets missing room devices for RoomId {RoomId}", rule.Id, rule.RoomId);
                                }
                                else
                                {
                                    foreach (var roomDevice in roomDevices)
                                    {
                                        ApplyRule(roomDevice);
                                    }

                                    targetHandled = true;
                                }
                            }
                            else
                            {
                                _logger.LogWarning("Automation {RuleId} has no DeviceId and will be disabled to avoid repeated triggers", rule.Id);
                            }

                            rule.LastRunUtc = executedAtUtc;
                            if (executionLogs.Count > 0)
                            {
                                db.ActivityLogs.AddRange(executionLogs);
                            }

                            if (targetHandled && rule.IntervalMinutes > 0)
                            {
                                rule.NextRunUtc = executedAtUtc.AddMinutes(rule.IntervalMinutes);
                                rule.Enabled = true;
                            }
                            else
                            {
                                rule.Enabled = false;
                            }

                            db.AutomationRules.Update(rule);

                            // Save both device state and rule changes
                            await db.SaveChangesAsync(stoppingToken);

                            // Notify front-end via SignalR
                            try { await _hubContext.Clients.All.SendAsync("UpdateUI", cancellationToken: stoppingToken); }
                            catch (Exception exNotify) { _logger.LogWarning(exNotify, "Failed sending SignalR update"); }

                            foreach (var affectedDevice in affectedDevices)
                            {
                                try
                                {
                                    await securityNotificationService.PublishDeviceEventAsync(
                                        affectedDevice,
                                        rule.Action,
                                        rule.Value,
                                        $"automation '{rule.Name}'",
                                        stoppingToken);
                                }
                                catch (Exception exNotify)
                                {
                                    _logger.LogWarning(exNotify, "Failed creating security notification for automation {RuleId}", rule.Id);
                                }
                            }

                            _logger.LogInformation("Executed automation {RuleId}. Next run: {NextRunUtc}; enabled: {Enabled}", rule.Id, rule.NextRunUtc, rule.Enabled);
                        }
                        catch (Exception exRule)
                        {
                            _logger.LogError(exRule, "Failed executing automation {RuleId}", rule.Id);
                            try
                            {
                                // attempt to disable problematic rule to avoid tight-failing loop
                                rule.Enabled = false;
                                db.AutomationRules.Update(rule);
                                await db.SaveChangesAsync(stoppingToken);
                            }
                            catch (Exception ex2)
                            {
                                _logger.LogError(ex2, "Failed disabling automation {RuleId} after error", rule.Id);
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
                    await Task.Delay(_pollInterval, stoppingToken);
                }
                catch (TaskCanceledException)
                {
                    _logger.LogInformation("Automation scheduler stopping due to cancellation");
                    break;
                }
            }

            _logger.LogInformation("Automation scheduler stopped");
        }
    }
}
