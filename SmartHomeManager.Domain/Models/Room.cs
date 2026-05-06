namespace SmartHomeManager.Models
{
    public class Room : AuditableEntity
    {
        public string Name { get; set; } = string.Empty;
        public IList<Device> Devices { get; set; } = new List<Device>();
    }
}
