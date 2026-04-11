using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Serilog;
using Serilog.Events;
using SmartHomeManager.Data;
using SmartHomeManager.Hubs;
using SmartHomeManager.Middleware;
using SmartHomeManager.Models;
using SmartHomeManager.Services;

try
{
    var builder = WebApplication.CreateBuilder(args);
    var contentRootPath = builder.Environment.ContentRootPath;

    // Keep logs close to the deployed app so published builds are self-contained.
    var logFilePath = Path.Combine(contentRootPath, "Logs", "log.txt");
    Directory.CreateDirectory(Path.GetDirectoryName(logFilePath)!);

    Log.Logger = new LoggerConfiguration()
        .MinimumLevel.Debug()
        .MinimumLevel.Override("Microsoft", LogEventLevel.Information)
        .Enrich.FromLogContext()
        .WriteTo.Console()
        .WriteTo.File(logFilePath, rollingInterval: RollingInterval.Day, flushToDiskInterval: TimeSpan.FromSeconds(1))
        .CreateLogger();

    builder.Host.UseSerilog();

    var jwtKey = builder.Configuration["Jwt:Key"] ?? "FallbackSecretKeyThatIsLongEnough123!!!";
    var configuredOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();
    var fallbackOrigins = new[]
    {
        "http://localhost:5000",
        "http://localhost:5110",
        "https://localhost:7139",
        "http://localhost:5173",
    };

    var configuredConnectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    var connectionStringBuilder = string.IsNullOrWhiteSpace(configuredConnectionString)
        ? new SqliteConnectionStringBuilder()
        : new SqliteConnectionStringBuilder(configuredConnectionString);

    if (string.IsNullOrWhiteSpace(connectionStringBuilder.DataSource))
    {
        connectionStringBuilder.DataSource = Path.Combine(contentRootPath, "smarthome.db");
    }
    else if (!Path.IsPathRooted(connectionStringBuilder.DataSource))
    {
        connectionStringBuilder.DataSource = Path.Combine(contentRootPath, connectionStringBuilder.DataSource);
    }

    var connectionString = connectionStringBuilder.ToString();

    builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "SmartHomeApp",
                ValidAudience = builder.Configuration["Jwt:Audience"] ?? "SmartHomeUsers",
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            };
        });

    builder.Services.AddCors(options =>
    {
        options.AddPolicy("AllowAll", policy =>
        {
            if (builder.Environment.IsDevelopment())
            {
                policy.SetIsOriginAllowed(_ => true)
                    .AllowAnyHeader()
                    .AllowAnyMethod()
                    .AllowCredentials();
            }
            else
            {
                policy.WithOrigins(configuredOrigins.Length > 0 ? configuredOrigins : fallbackOrigins)
                    .AllowAnyHeader()
                    .AllowAnyMethod()
                    .AllowCredentials();
            }
        });
    });

    builder.Services.AddControllers().AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });

    builder.Services.AddScoped<SmartHomeManager.Repositories.IRoomRepository, SmartHomeManager.Repositories.RoomRepository>();
    builder.Services.AddScoped<SmartHomeManager.Services.IRoomService, SmartHomeManager.Services.RoomService>();
    builder.Services.AddScoped<SmartHomeManager.Services.IDeviceControlService, SmartHomeManager.Services.DeviceControlService>();
    builder.Services.AddScoped<SmartHomeManager.Services.ISecurityNotificationService, SmartHomeManager.Services.SecurityNotificationService>();

    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseSqlite(connectionString));

    builder.Services.AddSignalR();
    builder.Services.AddHealthChecks();
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen();
    builder.Services.AddHostedService<AutomationSchedulerService>();

    var app = builder.Build();

    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Database.Migrate();

        if (!db.Rooms.Any())
        {
            var living = new Room { Name = "Living Room" };
            var bedroom = new Room { Name = "Dormitor" };

            db.Rooms.AddRange(living, bedroom);
            db.SaveChanges();

            db.Devices.AddRange(
                new Device { Nume = "Bec Inteligent", Tip = "Lampa", EstePornit = true, Valoare = 75.0, RoomId = living.Id },
                new Device { Nume = "Lumina Ambientala", Tip = "Lampa", EstePornit = false, Valoare = 30.0, RoomId = living.Id },
                new Device { Nume = "Termostat", Tip = "Termostat", EstePornit = true, Valoare = 22.5, RoomId = bedroom.Id },
                new Device { Nume = "Senzor Clima", Tip = "Senzor", EstePornit = true, Valoare = 0.0, SensorValue = 22.5, SensorUnit = "C", RoomId = living.Id },
                new Device { Nume = "Umiditate Aer", Tip = "Senzor", EstePornit = true, Valoare = 0.0, SensorValue = 45.0, SensorUnit = "%", RoomId = living.Id }
            );
            db.SaveChanges();

            Console.WriteLine("[System] Database seeded with initial rooms and devices.");
        }

        var demoNotifications = db.Notifications.Where(notification =>
            (notification.Title == "Security Alert" && notification.Message == "Front door unlocked at 10:23 PM") ||
            (notification.Title == "Energy Update" && notification.Message == "You used 15% less energy this week") ||
            (notification.Title == "Device Update" && notification.Message == "Smart thermostat firmware update available"))
            .ToList();

        if (demoNotifications.Count > 0)
        {
            db.Notifications.RemoveRange(demoNotifications);
            db.SaveChanges();
            Console.WriteLine("[System] Removed demo notifications so the inbox only reflects real activity.");
        }

        var adminUser = db.Users.SingleOrDefault(user => user.Username == "admin");
        if (adminUser == null)
        {
            var (salt, hash) = PasswordService.HashPassword("assist2026");
            db.Users.Add(new User
            {
                Username = "admin",
                DisplayName = "Administrator",
                Email = "admin@nexushome.local",
                PasswordSalt = salt,
                PasswordHash = hash,
                CreatedAtUtc = DateTime.UtcNow,
            });
            db.SaveChanges();
            Console.WriteLine("[System] Seeded default admin user.");
        }
        else if (string.IsNullOrWhiteSpace(adminUser.PasswordHash) || string.IsNullOrWhiteSpace(adminUser.PasswordSalt))
        {
            var (salt, hash) = PasswordService.HashPassword("assist2026");
            adminUser.PasswordSalt = salt;
            adminUser.PasswordHash = hash;
            adminUser.DisplayName ??= "Administrator";
            adminUser.Email ??= "admin@nexushome.local";
            adminUser.CreatedAtUtc = adminUser.CreatedAtUtc == default ? DateTime.UtcNow : adminUser.CreatedAtUtc;
            db.SaveChanges();
            Console.WriteLine("[System] Updated legacy admin user credentials.");
        }
    }

    app.UseMiddleware<ExceptionMiddleware>();
    app.UseDefaultFiles();
    app.UseStaticFiles();
    app.UseSerilogRequestLogging();
    app.UseCors("AllowAll");
    app.UseRouting();

    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI();
    }

    app.UseAuthentication();
    app.UseAuthorization();

    app.MapControllers();
    app.MapHub<SmartHomeHub>("/hubs/smarthome");
    app.MapHealthChecks("/health");
    app.MapFallbackToFile("index.html");

    Console.WriteLine($"[System] Application started. Logs: {logFilePath}");

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application failed to start");
    Console.WriteLine("\n=======================================");
    Console.WriteLine("FATAL STARTUP ERROR:");
    Console.WriteLine(ex);
    Console.WriteLine("=======================================\n");
}
finally
{
    Log.CloseAndFlush();
}
