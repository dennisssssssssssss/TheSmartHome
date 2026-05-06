namespace SmartHomeManager.Dtos
{
    public class NotificationReadDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string Type { get; set; } = "info";
        public bool Read { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
