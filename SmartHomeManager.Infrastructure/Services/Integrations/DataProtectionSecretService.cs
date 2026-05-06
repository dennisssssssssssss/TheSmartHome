using Microsoft.AspNetCore.DataProtection;

namespace SmartHomeManager.Services.Integrations;

public sealed class DataProtectionSecretService : IProtectedSecretService
{
    private readonly IDataProtector _protector;

    public DataProtectionSecretService(IDataProtectionProvider provider)
    {
        _protector = provider.CreateProtector("SmartHomeManager.Integrations.ApiKeys.v1");
    }

    public string Protect(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new ArgumentException("Secret value cannot be empty.", nameof(value));
        }

        return _protector.Protect(value.Trim());
    }

    public string? UnprotectOrFallback(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        try
        {
            return _protector.Unprotect(value);
        }
        catch
        {
            return value;
        }
    }
}
