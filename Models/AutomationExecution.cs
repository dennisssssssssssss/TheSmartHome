using System;
using System.ComponentModel.DataAnnotations;

namespace SmartHomeManager.Models
{
    public class AutomationExecution
    {
        public int Id { get; set; }

        [Required]
        public int AutomationRuleId { get; set; }

        public string RuleName { get; set; } = string.Empty;

        public DateTime ExecutedAtUtc { get; set; } = DateTime.UtcNow;

        public bool Successful { get; set; }

        public string Details { get; set; } = string.Empty;
    }
}