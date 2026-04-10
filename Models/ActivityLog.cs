using System;

namespace SmartHomeManager.Models
{
    /// <summary>
    /// Represents an audit / activity log entry produced by actions in the system.
    /// </summary>
    public class ActivityLog
    {
        /// <summary>Primary key</summary>
        public int Id { get; set; }

        /// <summary>UTC timestamp when the action occurred</summary>
        public DateTime TimestampUtc { get; set; } = DateTime.UtcNow;

        /// <summary>Short description of the action (e.g. "DeviceCreated", "DeviceToggled")</summary>
        public string Action { get; set; } = string.Empty;

        /// <summary>Detailed information about the action (IDs, names, parameters)</summary>
        public string Details { get; set; } = string.Empty;
    }
}