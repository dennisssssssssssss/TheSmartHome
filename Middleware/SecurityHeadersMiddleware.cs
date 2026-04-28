using Microsoft.Extensions.Options;
using SmartHomeManager.Options;

namespace SmartHomeManager.Middleware;

public class SecurityHeadersMiddleware
{
    private readonly RequestDelegate _next;
    private readonly SecurityHeadersOptions _options;

    public SecurityHeadersMiddleware(RequestDelegate next, IOptions<SecurityHeadersOptions> options)
    {
        _next = next;
        _options = options.Value;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (_options.Enabled)
        {
            context.Response.OnStarting(() =>
            {
                SetHeaderIfMissing(context, "Content-Security-Policy", _options.ContentSecurityPolicy);
                SetHeaderIfMissing(context, "Referrer-Policy", _options.ReferrerPolicy);
                SetHeaderIfMissing(context, "Permissions-Policy", _options.PermissionsPolicy);
                SetHeaderIfMissing(context, "X-Frame-Options", _options.FrameOptions);
                SetHeaderIfMissing(context, "X-Content-Type-Options", _options.ContentTypeOptions);
                SetHeaderIfMissing(context, "Cross-Origin-Opener-Policy", _options.CrossOriginOpenerPolicy);
                SetHeaderIfMissing(context, "Cross-Origin-Resource-Policy", _options.CrossOriginResourcePolicy);
                SetHeaderIfMissing(context, "X-Permitted-Cross-Domain-Policies", _options.XPermittedCrossDomainPolicies);
                return Task.CompletedTask;
            });
        }

        await _next(context);
    }

    private static void SetHeaderIfMissing(HttpContext context, string key, string value)
    {
        if (!string.IsNullOrWhiteSpace(value) && !context.Response.Headers.ContainsKey(key))
        {
            context.Response.Headers[key] = value;
        }
    }
}
