namespace SmartHomeManager.Options;

public class SecurityHeadersOptions
{
    public bool Enabled { get; set; } = true;
    public string ContentSecurityPolicy { get; set; } =
        "default-src 'self'; " +
        "base-uri 'self'; " +
        "object-src 'none'; " +
        "frame-ancestors 'none'; " +
        "img-src 'self' data: blob:; " +
        "font-src 'self' https://fonts.gstatic.com data:; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
        "script-src 'self'; " +
        "connect-src 'self' ws: wss:; " +
        "manifest-src 'self'; " +
        "worker-src 'self' blob:;";
    public string ReferrerPolicy { get; set; } = "strict-origin-when-cross-origin";
    public string PermissionsPolicy { get; set; } =
        "camera=(), microphone=(), geolocation=(), payment=(), usb=()";
    public string FrameOptions { get; set; } = "DENY";
    public string ContentTypeOptions { get; set; } = "nosniff";
    public string CrossOriginOpenerPolicy { get; set; } = "same-origin";
    public string CrossOriginResourcePolicy { get; set; } = "same-site";
    public string XPermittedCrossDomainPolicies { get; set; } = "none";
}
