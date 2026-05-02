namespace SmartHomeManager.Dtos
{
    public class ActivityLogReadDto
    {
        public int Id { get; set; }
        public DateTime TimestampUtc { get; set; }
        public string Action { get; set; } = string.Empty;
        public string Details { get; set; } = string.Empty;
    }
}
