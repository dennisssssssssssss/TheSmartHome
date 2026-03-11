using System.ComponentModel.DataAnnotations;

namespace SmartHomeManager.Dtos
{
    public class AutomationCreateDto
    {
        [Required]
        public string Name { get; set; } = string.Empty;
        [Required]
        public int DeviceId { get; set; }
        [Required]
        public string Action { get; set; } = string.Empty;
        public double? Value { get; set; }
        public DateTime NextRunUtc { get; set; } = DateTime.UtcNow;
        public int IntervalMinutes { get; set; } = 0;
        public bool Enabled { get; set; } = true;
    }

    public class AutomationReadDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int DeviceId { get; set; }
        public string Action { get; set; } = string.Empty;
        public double? Value { get; set; }
        public DateTime NextRunUtc { get; set; }
        public int IntervalMinutes { get; set; }
        public bool Enabled { get; set; }
        public DateTime? LastRunUtc { get; set; }
    }
}