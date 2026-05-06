using Microsoft.EntityFrameworkCore;
using SmartHomeManager.Models;
using SmartHomeManager.Services.Integrations;

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
        public DbSet<EnergyTelemetrySample> EnergyTelemetrySamples { get; set; }
        public DbSet<EnergyAsset> EnergyAssets { get; set; }
        public DbSet<IntegrationBridgeConnection> IntegrationBridgeConnections { get; set; }

        public override int SaveChanges()
        {
            ApplyAuditTimestamps();
            return base.SaveChanges();
        }

        public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            ApplyAuditTimestamps();
            return base.SaveChangesAsync(cancellationToken);
        }

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

            modelBuilder.Entity<Device>(entity =>
            {
                entity.Property(device => device.Nume).HasMaxLength(150);
                entity.Property(device => device.Tip).HasMaxLength(100);
                entity.Property(device => device.Category).HasMaxLength(100);
                entity.Property(device => device.IntegrationProtocol)
                    .HasMaxLength(50)
                    .HasDefaultValue(DeviceIntegrationConstants.Simulated);
                entity.Property(device => device.Transport).HasMaxLength(50);
                entity.Property(device => device.ExternalDeviceId).HasMaxLength(200);
                entity.Property(device => device.Endpoint).HasMaxLength(500);
                entity.Property(device => device.Manufacturer).HasMaxLength(150);
                entity.Property(device => device.Model).HasMaxLength(150);
            });

            modelBuilder.Entity<EnergyTelemetrySample>(entity =>
            {
                entity.Property(sample => sample.SourceType).HasMaxLength(50);
                entity.HasOne(sample => sample.EnergyAsset)
                    .WithMany(asset => asset.TelemetrySamples)
                    .HasForeignKey(sample => sample.EnergyAssetId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            modelBuilder.Entity<EnergyAsset>(entity =>
            {
                entity.HasIndex(asset => new { asset.IntegrationProtocol, asset.ExternalAssetId }).IsUnique();
                entity.Property(asset => asset.Name).HasMaxLength(150);
                entity.Property(asset => asset.Kind).HasMaxLength(50);
                entity.Property(asset => asset.SourceType).HasMaxLength(50);
                entity.Property(asset => asset.IntegrationProtocol).HasMaxLength(50);
                entity.Property(asset => asset.ExternalAssetId).HasMaxLength(200);
                entity.Property(asset => asset.Manufacturer).HasMaxLength(150);
                entity.Property(asset => asset.Model).HasMaxLength(150);
            });

            modelBuilder.Entity<IntegrationBridgeConnection>(entity =>
            {
                entity.HasIndex(connection => connection.Protocol).IsUnique();
                entity.Property(connection => connection.Protocol).HasMaxLength(50);
                entity.Property(connection => connection.BaseUrl).HasMaxLength(500);
                entity.Property(connection => connection.ApiKey).HasMaxLength(500);
                entity.Property(connection => connection.LastTelemetrySyncStatus).HasMaxLength(250);
            });
        }

        private void ApplyAuditTimestamps()
        {
            var nowUtc = DateTime.UtcNow;

            foreach (var entry in ChangeTracker.Entries<AuditableEntity>())
            {
                if (entry.State == EntityState.Added)
                {
                    if (entry.Entity.CreatedAtUtc == default)
                    {
                        entry.Entity.CreatedAtUtc = nowUtc;
                    }

                    entry.Entity.UpdatedAtUtc = nowUtc;
                }
                else if (entry.State == EntityState.Modified)
                {
                    entry.Property(entity => entity.CreatedAtUtc).IsModified = false;
                    entry.Entity.UpdatedAtUtc = nowUtc;
                }
            }
        }
    }
}
