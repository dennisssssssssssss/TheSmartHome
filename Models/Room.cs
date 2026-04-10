namespace SmartHomeManager.Models
{
    public class Room
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public IList<Device> Devices { get; set; } = new List<Device>();
    }
}