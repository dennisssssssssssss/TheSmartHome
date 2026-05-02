using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartHomeManager.Dtos;
using SmartHomeManager.Services;

namespace SmartHomeManager.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class LogsController : ControllerBase
    {
        private readonly ILogService _logService;

        public LogsController(ILogService logService)
        {
            _logService = logService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ActivityLogReadDto>>> GetLatest()
        {
            var result = await _logService.GetLatestAsync(HttpContext.RequestAborted);
            return Ok(result.Data);
        }
    }
}
