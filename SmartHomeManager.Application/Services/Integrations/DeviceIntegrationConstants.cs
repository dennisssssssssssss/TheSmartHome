namespace SmartHomeManager.Services.Integrations;

public static class DeviceIntegrationConstants
{
    public const string Simulated = "simulated";
    public const string Matter = "matter";
    public const string Modbus = "modbus";
    public const string Mqtt = "mqtt";

    public const string Wifi = "wifi";
    public const string Thread = "thread";
    public const string Ethernet = "ethernet";
    public const string Rs485 = "rs485";
    public const string BluetoothLowEnergy = "ble";

    public static string NormalizeProtocol(string? protocol)
    {
        return string.IsNullOrWhiteSpace(protocol)
            ? Simulated
            : protocol.Trim().ToLowerInvariant();
    }

    public static string? NormalizeTransport(string? transport)
    {
        return string.IsNullOrWhiteSpace(transport)
            ? null
            : transport.Trim().ToLowerInvariant();
    }
}
