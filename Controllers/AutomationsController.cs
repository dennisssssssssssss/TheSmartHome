using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartHomeManager.Data;
using SmartHomeManager.Models;

namespace SmartHomeManager.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AutomationsController : ControllerBase
    {
        private readonly AppDbContext _db;

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
            _db.AutomationRules.Add(rule);
            await _db.SaveChangesAsync();
            return CreatedAtAction(nameof(Get), new { id = rule.Id }, rule);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] AutomationRule dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var rule = await _db.AutomationRules.FindAsync(id);
            if (rule == null) return NotFound();
            _db.Entry(rule).CurrentValues.SetValues(dto);
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