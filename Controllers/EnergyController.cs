using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartHomeManager.Data;

namespace SmartHomeManager.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class EnergyController : ControllerBase
    {
        private readonly AppDbContext _db;

        public EnergyController(AppDbContext db)
        {
            _db = db;
        }

        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary()
        {
            var usages = await _db.DeviceEnergyUsages
                .AsNoTracking()
                .OrderBy(e => e.TimestampUtc)
                .ToListAsync();

            if (usages.Count == 0)
            {
                return Ok(new
                {
                    data = Array.Empty<object>(),
                    total = 0.0
                });
            }

            var data = usages.Select(e => new
            {
                id = e.Id,
                device_id = e.DeviceId,
                consumption = e.ConsumptionWh,
                cost = Math.Round(e.ConsumptionWh * 0.15, 2),
                date = e.TimestampUtc.ToString("o")
            }).ToList();

            return Ok(new
            {
                data,
                total = Math.Round(data.Sum(d => d.consumption), 2)
            });
        }
    }
}
