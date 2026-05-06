namespace SmartHomeManager.Services.Integrations;

public static class DeviceTaxonomy
{
    public static string ResolveCategory(string? requestedCategory, string? deviceType)
    {
        if (!string.IsNullOrWhiteSpace(requestedCategory))
        {
            return requestedCategory.Trim();
        }

        var normalizedType = deviceType?.Trim().ToLowerInvariant() ?? string.Empty;

        return normalizedType switch
        {
            "lampa" => "lighting",
            "priza" => "energy",
            "termostat" => "climate",
            "aer conditionat" => "climate",
            "tv" => "entertainment",
            "boxa" => "entertainment",
            "camera" => "security",
            "incuietoare" => "access",
            "senzor" => "sensing",
            "jaluzele" => "comfort",
            _ => "general",
        };
    }
}
