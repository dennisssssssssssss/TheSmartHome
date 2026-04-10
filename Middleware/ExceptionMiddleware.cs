using System;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace SmartHomeManager.Middleware
{
    /// <summary>
    /// Global exception handling middleware.
    /// Catches unhandled exceptions, logs them and returns a clean JSON response to the client.
    /// </summary>
    public class ExceptionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ExceptionMiddleware> _logger;

        /// <summary>
        /// Constructor - RequestDelegate and ILogger are injected by DI.
        /// </summary>
        public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        /// <summary>
        /// InvokeAsync wraps the next middleware in a try/catch to capture unhandled exceptions.
        /// </summary>
        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                // Invoke the next middleware in the pipeline
                await _next(context);
            }
            catch (Exception ex)
            {
                // Log full exception (including stack trace) for diagnostics
                _logger.LogError(ex, "An unexpected error occurred.");

                // Format and write a friendly JSON error response
                await HandleExceptionAsync(context, ex);
            }
        }

        /// <summary>
        /// Builds a JSON response with StatusCode, Message and Details and writes it to the response stream.
        /// </summary>
        private static Task HandleExceptionAsync(HttpContext context, Exception ex)
        {
            // Ensure response is JSON and use 500 status code for server errors
            context.Response.ContentType = "application/json";
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;

            var payload = new
            {
                StatusCode = context.Response.StatusCode,
                Message = "Internal Server Error.",
                Details = ex.Message
            };

            // Use camelCase for JSON property names
            var options = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

            var json = JsonSerializer.Serialize(payload, options);

            return context.Response.WriteAsync(json);
        }
    }
}