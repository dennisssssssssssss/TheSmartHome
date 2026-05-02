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
    public sealed class IntegrationsController : ControllerBase
    {
        private readonly IIntegrationService _integrationService;

        public IntegrationsController(IIntegrationService integrationService)
        {
            _integrationService = integrationService;
        }

        [HttpGet("overview")]
        public async Task<ActionResult<IntegrationOverviewDto>> GetOverview(CancellationToken cancellationToken)
        {
            var result = await _integrationService.GetOverviewAsync(cancellationToken);
            return this.ToActionResult(result);
        }

        [HttpGet("connections")]
        public async Task<ActionResult<IReadOnlyList<IntegrationConnectionDto>>> GetConnections(CancellationToken cancellationToken)
        {
            var result = await _integrationService.GetConnectionsAsync(cancellationToken);
            return this.ToActionResult(result);
        }

        [HttpGet("connections/{protocol}")]
        public async Task<ActionResult<IntegrationConnectionDto>> GetConnection(string protocol, CancellationToken cancellationToken)
        {
            var result = await _integrationService.GetConnectionAsync(protocol, cancellationToken);
            return this.ToActionResult(result);
        }

        [HttpPut("connections/{protocol}")]
        public async Task<ActionResult<IntegrationConnectionDto>> UpsertConnection(
            string protocol,
            [FromBody] IntegrationConnectionUpsertDto request,
            CancellationToken cancellationToken)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _integrationService.UpsertConnectionAsync(protocol, request, cancellationToken);
            return this.ToActionResult(result);
        }

        [HttpPost("connections/{protocol}/test")]
        public async Task<ActionResult<IntegrationConnectionTestResultDto>> TestConnection(
            string protocol,
            [FromBody] IntegrationConnectionTestDto? request,
            CancellationToken cancellationToken)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _integrationService.TestConnectionAsync(protocol, request, cancellationToken);
            return this.ToActionResult(result);
        }

        [HttpPost("{protocol}/discover-devices")]
        public async Task<ActionResult<IReadOnlyList<IntegrationDiscoveredDeviceDto>>> DiscoverDevices(
            string protocol,
            [FromBody] IntegrationConnectionTestDto? request,
            CancellationToken cancellationToken)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _integrationService.DiscoverDevicesAsync(protocol, request, cancellationToken);
            return this.ToActionResult(result);
        }

        [HttpPost("modbus/sync-telemetry")]
        public async Task<ActionResult<ModbusTelemetrySyncResultDto>> SyncModbusTelemetry(
            [FromBody] IntegrationConnectionTestDto? request,
            CancellationToken cancellationToken)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _integrationService.SyncModbusTelemetryAsync(request, cancellationToken);
            return this.ToActionResult(result);
        }
    }
}
