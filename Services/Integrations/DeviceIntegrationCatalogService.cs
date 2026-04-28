namespace SmartHomeManager.Services.Integrations;

public sealed class DeviceIntegrationCatalogService : IDeviceIntegrationCatalogService
{
    private static readonly IReadOnlyList<DeviceIntegrationDescriptor> Options =
    [
        new()
        {
            Code = DeviceIntegrationConstants.Simulated,
            Label = "Simulated",
            Status = "ready",
            Description = "Local software-only device used for demos, UI flows, and automated tests.",
            RecommendedFor = "Product demos, onboarding, and development without real hardware.",
            Transports = [DeviceIntegrationConstants.Wifi]
        },
        new()
        {
            Code = DeviceIntegrationConstants.Matter,
            Label = "Matter",
            Status = "beta",
            Description = "Bridge-based Matter connector for interoperable smart-home devices across major ecosystems.",
            RecommendedFor = "Lights, plugs, thermostats, blinds, sensors, and future home automation devices.",
            Transports = [DeviceIntegrationConstants.Thread, DeviceIntegrationConstants.Wifi, DeviceIntegrationConstants.Ethernet, DeviceIntegrationConstants.BluetoothLowEnergy]
        },
        new()
        {
            Code = DeviceIntegrationConstants.Modbus,
            Label = "Modbus",
            Status = "beta",
            Description = "Bridge-based Modbus connector for meters, inverters, and industrial-style energy hardware.",
            RecommendedFor = "Solar inverters, energy meters, battery controllers, and power monitoring.",
            Transports = [DeviceIntegrationConstants.Rs485, DeviceIntegrationConstants.Ethernet]
        },
        new()
        {
            Code = DeviceIntegrationConstants.Mqtt,
            Label = "MQTT Bridge",
            Status = "planned",
            Description = "Bridge layer for custom devices and vendor APIs that do not speak Matter directly.",
            RecommendedFor = "ESP32 projects, DIY gateways, and custom integrations managed by your backend.",
            Transports = [DeviceIntegrationConstants.Wifi, DeviceIntegrationConstants.Ethernet]
        }
    ];

    public IReadOnlyList<DeviceIntegrationDescriptor> GetOptions() => Options;
}
