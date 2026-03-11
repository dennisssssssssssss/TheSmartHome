namespace SmartHomeManager.Models
{
    public class User
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        // For a demo project we keep auth minimal; real project should use Identity.
        public string? DisplayName { get; set; }
    }
}