using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartHomeManager.Common;
using SmartHomeManager.Dtos;
using SmartHomeManager.Services;

namespace SmartHomeManager.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class RoomsController : ControllerBase
    {
        private readonly IRoomService _roomService;

        public RoomsController(IRoomService roomService)
        {
            _roomService = roomService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<RoomReadDto>>> GetRooms()
        {
            var result = await _roomService.GetRoomsAsync(HttpContext.RequestAborted);
            return Ok(result.Data);
        }

        [HttpGet("{id}", Name = "GetRoom")]
        public async Task<ActionResult<RoomReadDto>> GetRoom(int id)
        {
            var result = await _roomService.GetRoomAsync(id, HttpContext.RequestAborted);
            return ToActionResult(result);
        }

        [HttpPost]
        public async Task<ActionResult<RoomReadDto>> CreateRoom([FromBody] RoomCreateDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var result = await _roomService.CreateRoomAsync(dto, HttpContext.RequestAborted);
            if (!result.IsSuccess || result.Data == null)
            {
                return ToActionResult(result);
            }

            return CreatedAtRoute("GetRoom", new { id = result.Data.Id }, result.Data);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateRoom(int id, [FromBody] RoomCreateDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var result = await _roomService.UpdateRoomAsync(id, dto, HttpContext.RequestAborted);
            return ToActionResult(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRoom(int id)
        {
            var result = await _roomService.DeleteRoomAsync(id, HttpContext.RequestAborted);
            return ToActionResult(result);
        }

        private IActionResult ToActionResult(ServiceResult result)
        {
            return result.Status switch
            {
                ServiceResultStatus.Success => NoContent(),
                ServiceResultStatus.NotFound => NotFound(new { message = result.Message }),
                ServiceResultStatus.Conflict => Conflict(new { message = result.Message }),
                ServiceResultStatus.ValidationError => BadRequest(new { message = result.Message, errors = result.Errors }),
                ServiceResultStatus.Unauthorized => Unauthorized(new { message = result.Message }),
                _ => StatusCode(500, new { message = result.Message ?? "Unexpected service failure." }),
            };
        }

        private ActionResult<RoomReadDto> ToActionResult(ServiceResult<RoomReadDto> result)
        {
            return result.Status switch
            {
                ServiceResultStatus.Success when result.Data != null => Ok(result.Data),
                ServiceResultStatus.NotFound => NotFound(new { message = result.Message }),
                ServiceResultStatus.Conflict => Conflict(new { message = result.Message }),
                ServiceResultStatus.ValidationError => BadRequest(new { message = result.Message, errors = result.Errors }),
                ServiceResultStatus.Unauthorized => Unauthorized(new { message = result.Message }),
                _ => StatusCode(500, new { message = result.Message ?? "Unexpected service failure." }),
            };
        }
    }
}
