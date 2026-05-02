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
    public class DevicesController : ControllerBase
    {
        private readonly IDeviceService _deviceService;

        public DevicesController(IDeviceService deviceService)
        {
            _deviceService = deviceService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<DeviceReadDto>>> GetDevices()
        {
            var result = await _deviceService.GetDevicesAsync(HttpContext.RequestAborted);
            return Ok(result.Data);
        }

        [HttpGet("{id}", Name = "GetDevice")]
        public async Task<ActionResult<DeviceReadDto>> GetDevice(int id)
        {
            var result = await _deviceService.GetDeviceAsync(id, HttpContext.RequestAborted);
            return this.ToActionResult(result);
        }

        [HttpPost]
        public async Task<ActionResult<DeviceReadDto>> CreateDevice([FromBody] DeviceCreateDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _deviceService.CreateDeviceAsync(dto, HttpContext.RequestAborted);
            if (!result.IsSuccess || result.Data == null)
            {
                return this.ToActionResult(result);
            }

            return CreatedAtRoute("GetDevice", new { id = result.Data.Id }, result.Data);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<DeviceReadDto>> UpdateDevice(int id, [FromBody] DeviceCreateDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _deviceService.UpdateDeviceAsync(id, dto, HttpContext.RequestAborted);
            return this.ToActionResult(result);
        }

        [HttpGet("integration-options")]
        public async Task<ActionResult<IEnumerable<DeviceIntegrationOptionDto>>> GetIntegrationOptions()
        {
            var options = await _deviceService.GetIntegrationOptionsAsync(HttpContext.RequestAborted);
            return Ok(options);
        }

        [HttpPost("pair/matter")]
        public async Task<ActionResult<MatterPairingResponseDto>> PairMatterDevice([FromBody] MatterPairingRequestDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _deviceService.PairMatterDeviceAsync(request, HttpContext.RequestAborted);
            return this.ToActionResult(result);
        }

        [HttpPut("{id}/control")]
        public async Task<IActionResult> ControlDevice(int id, [FromBody] DeviceControlDto command)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _deviceService.ControlDeviceAsync(id, command, HttpContext.RequestAborted);
            return this.ToActionResult(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDevice(int id)
        {
            var result = await _deviceService.DeleteDeviceAsync(id, HttpContext.RequestAborted);
            return this.ToActionResult(result);
        }
    }
}
