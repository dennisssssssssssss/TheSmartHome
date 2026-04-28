namespace SmartHomeManager.Services.Integrations;

public interface IDeviceIntegrationCatalogService
{
    IReadOnlyList<DeviceIntegrationDescriptor> GetOptions();
}
