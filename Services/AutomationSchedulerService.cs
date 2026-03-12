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

                    var nowUtc = DateTime.UtcNow;

                    // find enabled rules that are due now (or earlier)
                    var dueRules = await db.AutomationRules
                        .Where(r => r.Enabled && r.NextRunUtc <= nowUtc)
                        .ToListAsync(stoppingToken);

                    foreach (var rule in dueRules)
                    {
                        try
                        {
                            if (rule.DeviceId.HasValue)
                            {
                                var device = await db.Devices.FirstOrDefaultAsync(d => d.Id == rule.DeviceId.Value, stoppingToken);
                                if (device != null)
                                {
                                    // Apply requested action by directly setting the device state
                                    if (string.Equals(rule.Action, "TurnOn", StringComparison.OrdinalIgnoreCase) ||
                                        string.Equals(rule.Action, "On", StringComparison.OrdinalIgnoreCase))
                                    {
                                        device.EstePornit = true;
                                    }
                                    else if (string.Equals(rule.Action, "TurnOff", StringComparison.OrdinalIgnoreCase) ||
                                             string.Equals(rule.Action, "Off", StringComparison.OrdinalIgnoreCase))
                                    {
                                        device.EstePornit = false;
                                    }
                                    else if (string.Equals(rule.Action, "SetValue", StringComparison.OrdinalIgnoreCase) && rule.Value.HasValue)
                                    {
                                        device.Valoare = rule.Value.Value;
                                    }
                                    else
                                    {
                                        _logger.LogWarning("Automation {RuleId} has unsupported action {Action}", rule.Id, rule.Action);
                                    }

                                    // persist device change
                                    db.Devices.Update(device);
                                }
                                else
                                {
                                    _logger.LogWarning("Automation {RuleId} targets missing device {DeviceId}", rule.Id, rule.DeviceId);
                                }
                            }
                            else
                            {
                                _logger.LogWarning("Automation {RuleId} has no DeviceId and will be disabled to avoid repeated triggers", rule.Id);
                            }

                            // Mark the rule as finished (one-shot) to avoid re-execution every 5s
                            rule.Enabled = false;
                            rule.LastRunUtc = DateTime.UtcNow;
                            db.AutomationRules.Update(rule);

                            // Save both device state and rule changes
                            await db.SaveChangesAsync(stoppingToken);

                            // Notify front-end via SignalR
                            try { await _hubContext.Clients.All.SendAsync("UpdateUI", cancellationToken: stoppingToken); }
                            catch (Exception exNotify) { _logger.LogWarning(exNotify, "Failed sending SignalR update"); }

                            _logger.LogInformation("Executed automation {RuleId} (disabled after run).", rule.Id);
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