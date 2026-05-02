using Microsoft.AspNetCore.Mvc;
using SmartHomeManager.Common;

namespace SmartHomeManager.Extensions
{
    public static class ControllerResultExtensions
    {
        public static IActionResult ToActionResult(this ControllerBase controller, ServiceResult result)
        {
            return result.Status switch
            {
                ServiceResultStatus.Success => controller.NoContent(),
                ServiceResultStatus.NotFound => controller.NotFound(new { message = result.Message }),
                ServiceResultStatus.Conflict => controller.Conflict(new { message = result.Message }),
                ServiceResultStatus.ValidationError => controller.BadRequest(new { message = result.Message, errors = result.Errors }),
                ServiceResultStatus.Unauthorized => controller.Unauthorized(new { message = result.Message }),
                _ => controller.StatusCode(500, new { message = result.Message ?? "Unexpected service failure." }),
            };
        }

        public static ActionResult<T> ToActionResult<T>(this ControllerBase controller, ServiceResult<T> result)
        {
            return result.Status switch
            {
                ServiceResultStatus.Success when result.Data != null => controller.Ok(result.Data),
                ServiceResultStatus.NotFound => controller.NotFound(new { message = result.Message }),
                ServiceResultStatus.Conflict => controller.Conflict(new { message = result.Message }),
                ServiceResultStatus.ValidationError => controller.BadRequest(new { message = result.Message, errors = result.Errors }),
                ServiceResultStatus.Unauthorized => controller.Unauthorized(new { message = result.Message }),
                _ => controller.StatusCode(500, new { message = result.Message ?? "Unexpected service failure." }),
            };
        }
    }
}
