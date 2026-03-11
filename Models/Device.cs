namespace SmartHomeManager.Models
{
    public class Device
    {
        public int Id { get; set; }
        public string Nume { get; set; } = string.Empty;
        public string Tip { get; set; } = string.Empty; // ex: Lampa, Termostat, etc.
        public bool EstePornit { get; set; }
        public double Valoare { get; set; } // ex: temp pentru termostat, luminozitate pentru lampa.
        public int? RoomId { get; set; } // Foreign key to Room
        public Room? Room { get; set; }
    }
}
