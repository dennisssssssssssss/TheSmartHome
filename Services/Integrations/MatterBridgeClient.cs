using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.Extensions.Options;
using SmartHomeManager.Models;

namespace SmartHomeManager.Services.Integrations;

public sealed class MatterBridgeClient : IMatterBridgeClient
{
    private readonly HttpClient _httpClient;
    private readonly MatterBridgeOptions _options;
    private readonly IIntegrationConnectionService _connectionService;

    public MatterBridgeClient(
        HttpClient httpClient,
        IOptions<MatterBridgeOptions> options,
        IIntegrationConnectionService connectionService)
    {
        _httpClient = httpClient;
        _options = options.Value;
        _connectionService = connectionService;
        _httpClient.Timeout = TimeSpan.FromSeconds(Math.Max(_options.TimeoutSeconds, 2));
    }

    public async Task<IReadOnlyList<MatterDiscoveredDevice>> DiscoverDevicesAsync(
        BridgeConnectionOverride? connectionOverride = null,
        CancellationToken cancellationToken = default)
    {
        var settings = await _connectionService.GetResolvedSettingsAsync(
            DeviceIntegrationConstants.Matter,
            connectionOverride,
            cancellationToken);
        var baseUri = ResolveBaseUri(settings.BaseUrl);
        using var httpRequest = new HttpRequestMessage(HttpMethod.Get, new Uri(baseUri, "api/v1/discovery/devices"));
        ApplyApiKey(httpRequest, settings.ApiKey);

        using var response = await _httpClient.SendAsync(httpRequest, cancellationToken);
        response.EnsureSuccessStatusCode();

        var devices = await response.Content.ReadFromJsonAsync<List<MatterDiscoveredDevice>>(cancellationToken: cancellationToken);
        return devices ?? [];
    }

    public async Task<MatterPairingResult> PairDeviceAsync(
        MatterPairingRequest request,
        BridgeConnectionOverride? connectionOverride = null,
        CancellationToken cancellationToken = default)
    {
        var settings = await _connectionService.GetResolvedSettingsAsync(
            DeviceIntegrationConstants.Matter,
            connectionOverride,
            cancellationToken);
        var baseUri = ResolveBaseUri(settings.BaseUrl);
        using var httpRequest = new HttpRequestMessage(HttpMethod.Post, new Uri(baseUri, "api/v1/pairings"))
        {
            Content = JsonContent.Create(new
            {
                pairingCode = request.PairingCode,
                transport = request.Transport,
                suggestedName = request.SuggestedName,
                suggestedType = request.SuggestedType,
            })
        };

        ApplyApiKey(httpRequest, settings.ApiKey);

        using var response = await _httpClient.SendAsync(httpRequest, cancellationToken);
        response.EnsureSuccessStatusCode();

        var result = await response.Content.ReadFromJsonAsync<MatterPairingResult>(cancellationToken: cancellationToken);
        return result ?? throw new InvalidOperationException("Matter bridge returned an empty pairing response.");
    }

    public async Task TestConnectionAsync(BridgeConnectionOverride? connectionOverride = null, CancellationToken cancellationToken = default)
    {
        var settings = await _connectionService.GetResolvedSettingsAsync(
            DeviceIntegrationConstants.Matter,
            connectionOverride,
            cancellationToken);
        var baseUri = ResolveBaseUri(settings.BaseUrl);
        using var httpRequest = new HttpRequestMessage(HttpMethod.Get, new Uri(baseUri, "api/v1/health"));
        ApplyApiKey(httpRequest, settings.ApiKey);

        using var response = await _httpClient.SendAsync(httpRequest, cancellationToken);
        response.EnsureSuccessStatusCode();
    }

    public async Task SendCommandAsync(Device device, MatterDeviceCommandRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(device.ExternalDeviceId))
        {
            throw new InvalidOperationException("Matter devices require an external device identifier before they can be controlled.");
        }

        var settings = await _connectionService.GetResolvedSettingsAsync(
            DeviceIntegrationConstants.Matter,
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
                "Matter bridge is not configured. Set MatterBridge:BaseUrl or provide a bridge URL during pairing.");
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
