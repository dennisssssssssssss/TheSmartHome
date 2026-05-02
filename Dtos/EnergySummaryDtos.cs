using System.Text.Json.Serialization;

namespace SmartHomeManager.Dtos
{
    public class EnergySummaryItemDto
    {
        public int Id { get; set; }

        [JsonPropertyName("device_id")]
        public int DeviceId { get; set; }

        [JsonPropertyName("consumption")]
        public double ConsumptionWh { get; set; }

        [JsonPropertyName("cost")]
        public double Cost { get; set; }

        [JsonPropertyName("date")]
        public string Date { get; set; } = string.Empty;
    }

    public class EnergySummaryResponseDto
    {
        [JsonPropertyName("data")]
        public IReadOnlyList<EnergySummaryItemDto> Data { get; set; } = Array.Empty<EnergySummaryItemDto>();

        [JsonPropertyName("total")]
        public double Total { get; set; }
    }
}
