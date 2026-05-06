namespace SmartHomeManager.Services.Integrations;

public interface IProtectedSecretService
{
    string Protect(string value);
    string? UnprotectOrFallback(string? value);
}
