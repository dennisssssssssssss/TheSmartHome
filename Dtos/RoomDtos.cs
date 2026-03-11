using System.ComponentModel.DataAnnotations;

namespace SmartHomeManager.Dtos
{
    public class RoomCreateDto
    {
        [Required]
        public string Name { get; set; } = string.Empty;
    }

    public class RoomReadDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int DeviceCount { get; set; }
    }
}