using Microsoft.AspNetCore.SignalR;
using SmartHomeManager.Data;
using SmartHomeManager.Hubs;
using SmartHomeManager.Models;

namespace SmartHomeManager.Services
{
    public class SecurityNotificationService : ISecurityNotificationService
    {
        private readonly AppDbContext _db;
        private readonly IHubContext<SmartHomeHub> _hubContext;

        public SecurityNotificationService(AppDbContext db, IHubContext<SmartHomeHub> hubContext)
        {
            _db = db;
            _hubContext = hubContext;
        }

        public async Task<bool> PublishDeviceEventAsync(
            Device device,
            string action,
            double? value = null,
            string? source = null,
            CancellationToken cancellationToken = default)
        {
            var notification = BuildNotification(device, action, value, source);
            if (notification == null)
            {
                return false;
            }

            _db.Notifications.Add(notification);
            await _db.SaveChangesAsync(cancellationToken);

            await _hubContext.Clients.All.SendAsync("NotificationUpdated", cancellationToken: cancellationToken);
            return true;
        }

        private static Notification? BuildNotification(Device device, string action, double? value, string? source)
        {
            var deviceType = NormalizeDeviceType(device.Tip);
            var normalizedAction = (action ?? string.Empty).Trim().ToLowerInvariant();
            var sourceSuffix = string.IsNullOrWhiteSpace(source) ? string.Empty : $" via {source}";

            return deviceType switch
            {
                "lock" => BuildLockNotification(device, normalizedAction, sourceSuffix),
                "camera" => BuildCameraNotification(device, normalizedAction, sourceSuffix),
                "sensor" => BuildSensorNotification(device, normalizedAction, value, sourceSuffix),
                _ => null,
            };
        }

        private static Notification? BuildLockNotification(Device device, string action, string sourceSuffix)
        {
            return action switch
            {
                "turnon" or "on" => new Notification
                {
                    Title = "Lock Secured",
                    Message = $"{device.Nume} was secured{sourceSuffix}.",
                    Type = "info",
                },
                "turnoff" or "off" => new Notification
                {
                    Title = "Lock Unsecured",
                    Message = $"{device.Nume} was unlocked{sourceSuffix}.",
                    Type = "alert",
                },
                _ => null,
            };
        }

        private static Notification? BuildCameraNotification(Device device, string action, string sourceSuffix)
        {
            return action switch
            {
                "turnon" or "on" => new Notification
                {
                    Title = "Camera Online",
                    Message = $"{device.Nume} is online{sourceSuffix}.",
                    Type = "info",
                },
                "turnoff" or "off" => new Notification
                {
                    Title = "Camera Offline",
                    Message = $"{device.Nume} went offline{sourceSuffix}.",
                    Type = "warning",
                },
                _ => null,
            };
        }

        private static Notification? BuildSensorNotification(Device device, string action, double? value, string sourceSuffix)
        {
            return action switch
            {
                "turnon" or "on" => new Notification
                {
                    Title = "Sensor Armed",
                    Message = $"{device.Nume} monitoring is active{sourceSuffix}.",
                    Type = "info",
                },
                "turnoff" or "off" => new Notification
                {
                    Title = "Sensor Disabled",
                    Message = $"{device.Nume} monitoring was disabled{sourceSuffix}.",
                    Type = "warning",
                },
                "setvalue" when value.HasValue => new Notification
                {
                    Title = "Sensor Threshold Updated",
                    Message = $"{device.Nume} value was set to {value.Value}{sourceSuffix}.",
                    Type = "info",
                },
                _ => null,
            };
        }

        private static string NormalizeDeviceType(string? type)
        {
            var normalized = (type ?? string.Empty).Trim().ToLowerInvariant();

            return normalized switch
            {
                "incuietoare" => "lock",
                "camera" => "camera",
                "senzor" => "sensor",
                _ => normalized,
            };
        }
    }
}
