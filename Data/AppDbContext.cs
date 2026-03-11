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
    }
}