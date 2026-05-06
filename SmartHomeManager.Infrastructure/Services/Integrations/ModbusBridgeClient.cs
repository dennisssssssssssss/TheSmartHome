using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.Extensions.Options;
using SmartHomeManager.Models;

namespace SmartHomeManager.Services.Integrations;

public sealed class ModbusBridgeClient : IModbusBridgeClient
{
    private readonly HttpClient _httpClient;
    private readonly ModbusBridgeOptions _options;
    private readonly IIntegrationConnectionService _connectionService;

    public ModbusBridgeClient(
        HttpClient httpClient,
        IOptions<ModbusBridgeOptions> options,
        IIntegrationConnectionService connectionService)
    {
        _httpClient = httpClient;
        _options = options.Value;
        _connectionService = connectionService;
        _httpClient.Timeout = TimeSpan.FromSeconds(Math.Max(_options.TimeoutSeconds, 2));
    }

    public async Task<IReadOnlyList<ModbusDiscoveredDevice>> DiscoverDevicesAsync(
        BridgeConnectionOverride? connectionOverride = null,
        CancellationToken cancellationToken = default)
    {
        var settings = await _connectionService.GetResolvedSettingsAsync(
            DeviceIntegrationConstants.Modbus,
            connectionOverride,
            cancellationToken);
        var baseUri = ResolveBaseUri(settings.BaseUrl);
        using var httpRequest = new HttpRequestMessage(HttpMethod.Get, new Uri(baseUri, "api/v1/discovery/devices"));
        ApplyApiKey(httpRequest, settings.ApiKey);

        using var response = await _httpClient.SendAsync(httpRequest, cancellationToken);
        response.EnsureSuccessStatusCode();

        var devices = await response.Content.ReadFromJsonAsync<List<ModbusDiscoveredDevice>>(cancellationToken: cancellationToken);
        return devices ?? [];
    }

    public async Task TestConnectionAsync(BridgeConnectionOverride? connectionOverride = null, CancellationToken cancellationToken = default)
    {
        var settings = await _connectionService.GetResolvedSettingsAsync(
            DeviceIntegrationConstants.Modbus,
            connectionOverride,
            cancellationToken);
        var baseUri = ResolveBaseUri(settings.BaseUrl);
        using var httpRequest = new HttpRequestMessage(HttpMethod.Get, new Uri(baseUri, "api/v1/health"));
        ApplyApiKey(httpRequest, settings.ApiKey);

        using var response = await _httpClient.SendAsync(httpRequest, cancellationToken);
        response.EnsureSuccessStatusCode();
    }

    public async Task<ModbusTelemetrySnapshot> GetTelemetrySnapshotAsync(
        BridgeConnectionOverride? connectionOverride = null,
        CancellationToken cancellationToken = default)
    {
        var settings = await _connectionService.GetResolvedSettingsAsync(
            DeviceIntegrationConstants.Modbus,
            connectionOverride,
            cancellationToken);
        var baseUri = ResolveBaseUri(settings.BaseUrl);
        using var httpRequest = new HttpRequestMessage(HttpMethod.Get, new Uri(baseUri, "api/v1/telemetry/latest"));
        ApplyApiKey(httpRequest, settings.ApiKey);

        using var response = await _httpClient.SendAsync(httpRequest, cancellationToken);
        response.EnsureSuccessStatusCode();

        var snapshot = await response.Content.ReadFromJsonAsync<ModbusTelemetrySnapshot>(cancellationToken: cancellationToken);
        return snapshot ?? new ModbusTelemetrySnapshot();
    }

    public async Task SendCommandAsync(Device device, ModbusDeviceCommandRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(device.ExternalDeviceId))
        {
            throw new InvalidOperationException("Modbus devices require an external device identifier before they can be controlled.");
        }

        var settings = await _connectionService.GetResolvedSettingsAsync(
            DeviceIntegrationConstants.Modbus,
            string.IsNullOrWhiteSpace(device.Endpoint)
                ? null
                : new BridgeConnectionOverride { BaseUrl = device.Endpoint },
            cancellationToken);
        var baseUri = ResolveBaseUri(settings.BaseUrl);
        var relativePath = $"api/v1/devices/{Uri.EscapeDataString(device.ExternalDeviceId)}/commands";
        using var httpRequest = new HttpRequestMessage(HttpMethod.Post, new Uri(baseUri, relativePath))
        {
            Content = JsonContent.Create(new
            {
                command = request.Command,
                value = request.Value,
            })
        };

        ApplyApiKey(httpRequest, settings.ApiKey);

        using var response = await _httpClient.SendAsync(httpRequest, cancellationToken);
        response.EnsureSuccessStatusCode();
    }

    private static Uri ResolveBaseUri(string? baseUrl)
    {
        if (string.IsNullOrWhiteSpace(baseUrl) || !Uri.TryCreate(baseUrl, UriKind.Absolute, out var baseUri))
        {
            throw new InvalidOperationException(
                "Modbus bridge is not configured. Set ModbusBridge:BaseUrl or provide a bridge URL on the device.");
        }

        return baseUri.AbsoluteUri.EndsWith("/", StringComparison.Ordinal)
            ? baseUri
            : new Uri($"{baseUri.AbsoluteUri}/");
    }

    private static void ApplyApiKey(HttpRequestMessage request, string? apiKey)
    {
        if (!string.IsNullOrWhiteSpace(apiKey))
        {
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
        }
    }
}
