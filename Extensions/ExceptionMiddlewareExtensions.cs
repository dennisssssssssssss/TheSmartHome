using Microsoft.AspNetCore.Builder;
using SmartHomeManager.Middleware;

namespace SmartHomeManager.Extensions
{
    public static class ExceptionMiddlewareExtensions
    {
        public static IApplicationBuilder UseGlobalExceptionHandler(this IApplicationBuilder app)
        {
            return app.UseMiddleware<GlobalExceptionMiddleware>();
        }
    }
}