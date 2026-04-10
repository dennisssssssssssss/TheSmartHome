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
        public DbSet<Notification> Notifications { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<User>(entity =>
            {
                entity.HasIndex(user => user.Username).IsUnique();
                entity.HasIndex(user => user.Email).IsUnique();

                entity.Property(user => user.Username).HasMaxLength(100);
                entity.Property(user => user.DisplayName).HasMaxLength(150);
                entity.Property(user => user.Email).HasMaxLength(200);
                entity.Property(user => user.PasswordHash).HasMaxLength(256);
                entity.Property(user => user.PasswordSalt).HasMaxLength(256);
            });
        }
    }
}
