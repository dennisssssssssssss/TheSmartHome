using System.ComponentModel.DataAnnotations;

namespace SmartHomeManager.Models
{
    public class AutomationRule
    {
        public int Id { get; set; }

        [Required]
        public string Name { get; set; } = string.Empty;

        // Target: either a specific device or a room. Make both nullable to allow room-wide rules.
        public int? DeviceId { get; set; }

        public int? RoomId { get; set; }

        // Action to perform: e.g. "TurnOn", "TurnOff", "SetValue"
        [Required]
        public string Action { get; set; } = string.Empty;

        // Optional value for the action (e.g. temperature)
        public double? Value { get; set; }

        // Scheduling: next run time and interval in minutes for recurrence.
        public DateTime NextRunUtc { get; set; } = DateTime.UtcNow;
        public int IntervalMinutes { get; set; } = 0; // 0 means one-shot

        public bool Enabled { get; set; } = true;

        public DateTime? LastRunUtc { get; set; }
    }
}