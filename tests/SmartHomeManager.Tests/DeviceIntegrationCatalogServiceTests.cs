using SmartHomeManager.Services.Integrations;

namespace SmartHomeManager.Tests;

public sealed class DeviceIntegrationCatalogServiceTests
{
    [Fact]
    public void GetOptions_ShouldExposeMatterAndModbusAsBetaPaths()
    {
        var service = new DeviceIntegrationCatalogService();

        var options = service.GetOptions();

        Assert.Contains(options, option => option.Code == DeviceIntegrationConstants.Matter && option.Status == "beta");
        Assert.Contains(options, option => option.Code == DeviceIntegrationConstants.Modbus && option.Status == "beta");
        Assert.Contains(options, option => option.Code == DeviceIntegrationConstants.Simulated && option.Status == "ready");
    }
}
