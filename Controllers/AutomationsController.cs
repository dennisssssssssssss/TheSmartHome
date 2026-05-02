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
    public class AutomationsController : ControllerBase
    {
        private readonly IAutomationService _automationService;

        public AutomationsController(IAutomationService automationService)
        {
            _automationService = automationService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<AutomationReadDto>>> GetAll()
        {
            var result = await _automationService.GetAllAsync(HttpContext.RequestAborted);
            return Ok(result.Data);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<AutomationReadDto>> Get(int id)
        {
            var result = await _automationService.GetAsync(id, HttpContext.RequestAborted);
            return this.ToActionResult(result);
        }

        [HttpPost]
        public async Task<ActionResult<AutomationReadDto>> Create([FromBody] AutomationUpsertDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _automationService.CreateAsync(dto, HttpContext.RequestAborted);
            if (!result.IsSuccess || result.Data == null)
            {
                return this.ToActionResult(result);
            }

            return CreatedAtAction(nameof(Get), new { id = result.Data.Id }, result.Data);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] AutomationUpsertDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _automationService.UpdateAsync(id, dto, HttpContext.RequestAborted);
            return this.ToActionResult(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _automationService.DeleteAsync(id, HttpContext.RequestAborted);
            return this.ToActionResult(result);
        }
    }
}
