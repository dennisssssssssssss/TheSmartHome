namespace SmartHomeManager.Options;

public class AppRateLimitingOptions
{
    public RateLimitPolicyOptions Global { get; set; } = new();
    public RateLimitPolicyOptions Auth { get; set; } = new()
    {
        PermitLimit = 10,
        WindowSeconds = 60,
        QueueLimit = 0,
    };
}

public class RateLimitPolicyOptions
{
    public int PermitLimit { get; set; } = 240;
    public int WindowSeconds { get; set; } = 60;
    public int QueueLimit { get; set; } = 0;
}
