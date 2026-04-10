using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartHomeManager.Data;
using SmartHomeManager.Models;
using Microsoft.AspNetCore.Authorization;


namespace SmartHomeManager.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class AutomationsController : ControllerBase
    {
        private readonly AppDbContext _db;

        private static DateTime NormalizeUtc(DateTime value)
        {
            return value.Kind switch
            {
                DateTimeKind.Utc => value,
                DateTimeKind.Local => value.ToUniversalTime(),
                _ => DateTime.SpecifyKind(value, DateTimeKind.Local).ToUniversalTime()
            };
        }

        public AutomationsController(AppDbContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<AutomationRule>>> GetAll()
        {
            var rules = await _db.AutomationRules.AsNoTracking().ToListAsync();
            return Ok(rules);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<AutomationRule>> Get(int id)
        {
            var rule = await _db.AutomationRules.AsNoTracking().FirstOrDefaultAsync(r => r.Id == id);
            if (rule == null) return NotFound();
            return Ok(rule);
        }

        [HttpPost]
        public async Task<ActionResult<AutomationRule>> Create([FromBody] AutomationRule rule)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            rule.DeviceId = rule.DeviceId > 0 ? rule.DeviceId : null;
            rule.RoomId = rule.RoomId > 0 ? rule.RoomId : null;
            rule.IntervalMinutes = Math.Max(0, rule.IntervalMinutes);
            rule.NextRunUtc = NormalizeUtc(rule.NextRunUtc);

            if (!rule.DeviceId.HasValue && !rule.RoomId.HasValue)
            {
                return BadRequest(new { message = "Automation must target a device or a room." });
            }

            _db.AutomationRules.Add(rule);
            await _db.SaveChangesAsync();
            return CreatedAtAction(nameof(Get), new { id = rule.Id }, rule);
        }

        // Explicit PUT to update allowed fields
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] AutomationRule dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var rule = await _db.AutomationRules.FindAsync(id);
            if (rule == null) return NotFound();

            // Update only the specified fields to avoid accidental overwrites
            rule.Name = dto.Name;
            rule.DeviceId = dto.DeviceId > 0 ? dto.DeviceId : null;
            rule.RoomId = dto.RoomId > 0 ? dto.RoomId : null;
            rule.Action = dto.Action;
            rule.NextRunUtc = NormalizeUtc(dto.NextRunUtc);
            rule.Enabled = dto.Enabled;
            // Optional: allow updating Value and IntervalMinutes if provided
            rule.Value = dto.Value;
            rule.IntervalMinutes = Math.Max(0, dto.IntervalMinutes);

            if (!rule.DeviceId.HasValue && !rule.RoomId.HasValue)
            {
                return BadRequest(new { message = "Automation must target a device or a room." });
            }

            _db.AutomationRules.Update(rule);
            await _db.SaveChangesAsync();

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var rule = await _db.AutomationRules.FindAsync(id);
            if (rule == null) return NotFound();
            _db.AutomationRules.Remove(rule);
            await _db.SaveChangesAsync();
            return NoContent();
        }
    }
}
