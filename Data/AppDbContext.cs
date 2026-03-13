using Microsoft.EntityFrameworkCore;
using SmartHomeManager.Models;

namespace SmartHomeManager.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Device> Devices { get; set; }
        public DbSet<Room> Rooms { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<AutomationRule> AutomationRules { get; set; }
        public DbSet<DeviceEnergyUsage> DeviceEnergyUsages { get; set; }
        public DbSet<AutomationExecution> AutomationExecutions { get; set; }
        public DbSet<ActivityLog> ActivityLogs { get; set; }

        // Funcția trebuie să fie aici, ÎN INTERIORUL clasei AppDbContext
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Device>().HasData(
                new Device
                {
                    Id = -100,
                    Nume = "Senzor Climă",
                    Tip = "Sensor",
                    EstePornit = true,
                    Valoare = 0.0,
                    SensorValue = 22.5,
                    SensorUnit = "°C",
                    RoomId = null // changed from 1 to null
                },
                new Device
                {
                    Id = -101,
                    Nume = "Umiditate Aer",
                    Tip = "Sensor",
                    EstePornit = true,
                    Valoare = 0.0,
                    SensorValue = 45.0,
                    SensorUnit = "%",
                    RoomId = null
                }
            );
        }
    }
}