using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartHomeManager.Data;
using SmartHomeManager.Models;
using Microsoft.AspNetCore.Authorization;

namespace SmartHomeManager.Controllers
{
    /// <summary>
    /// Exposes read-only endpoints for activity logs.
    /// </summary>
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class LogsController : ControllerBase
    {
        private readonly AppDbContext _db;

        public LogsController(AppDbContext db)
        {
            _db = db;
        }

        /// <summary>
        /// GET /api/Logs
        /// Returns the latest 50 activity logs ordered by TimestampUtc descending.
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ActivityLog>>> GetLatest()
        {
            var logs = await _db.ActivityLogs
                .AsNoTracking()
                .OrderByDescending(l => l.TimestampUtc)
                .Take(50)
                .ToListAsync();

            return Ok(logs);
        }
    }
}