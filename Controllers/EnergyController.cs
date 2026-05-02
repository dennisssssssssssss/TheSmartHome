using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartHomeManager.Dtos;
using SmartHomeManager.Extensions;
using SmartHomeManager.Services;

namespace SmartHomeManager.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class EnergyController : ControllerBase
    {
        private readonly IEnergyService _energyService;

        public EnergyController(IEnergyService energyService)
        {
            _energyService = energyService;
        }

        [HttpGet("assets")]
        public async Task<ActionResult<IEnumerable<EnergyAssetDto>>> GetAssets()
        {
            var result = await _energyService.GetAssetsAsync(HttpContext.RequestAborted);
            return Ok(result.Data);
        }

        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary()
        {
            var result = await _energyService.GetSummaryAsync(HttpContext.RequestAborted);
            if (result.IsSuccess && result.Data != null)
            {
                return Ok(result.Data);
            }

            return StatusCode(500, new { message = result.Message ?? "Unexpected service failure." });
        }

        [HttpGet("overview")]
        public async Task<ActionResult<EnergyOverviewResponseDto>> GetOverview()
        {
            var result = await _energyService.GetOverviewAsync(HttpContext.RequestAborted);
            return this.ToActionResult(result);
        }

        [HttpPost("telemetry")]
        public async Task<IActionResult> IngestTelemetry([FromBody] EnergyTelemetryIngestDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _energyService.IngestTelemetryAsync(request, HttpContext.RequestAborted);
            if (!result.IsSuccess)
            {
                return result.Status switch
                {
                    SmartHomeManager.Common.ServiceResultStatus.NotFound => NotFound(new { message = result.Message }),
                    SmartHomeManager.Common.ServiceResultStatus.Conflict => Conflict(new { message = result.Message }),
                    SmartHomeManager.Common.ServiceResultStatus.ValidationError => BadRequest(new { message = result.Message, errors = result.Errors }),
                    SmartHomeManager.Common.ServiceResultStatus.Unauthorized => Unauthorized(new { message = result.Message }),
                    _ => StatusCode(500, new { message = result.Message ?? "Unexpected service failure." }),
                };
            }

            return Accepted(new { id = result.Data });
        }
    }
}
