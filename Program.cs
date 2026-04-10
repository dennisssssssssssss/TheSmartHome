using Microsoft.EntityFrameworkCore;
using SmartHomeManager.Data;
using SmartHomeManager.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Serilog;
using Serilog.Events;
using SmartHomeManager.Hubs;
using SmartHomeManager.Middleware;
using SmartHomeManager.Services;
using System.Text;

try
{
    var builder = WebApplication.CreateBuilder(args);

    // ---------------------------------------------------------
    // SERILOG
    // ---------------------------------------------------------
    var logFilePath = Path.Combine(AppContext.BaseDirectory, "Logs", "log.txt");
    Directory.CreateDirectory(Path.GetDirectoryName(logFilePath)!);

    Log.Logger = new LoggerConfiguration()
        .MinimumLevel.Debug()
        .MinimumLevel.Override("Microsoft", LogEventLevel.Information)
        .Enrich.FromLogContext()
        .WriteTo.Console()
        .WriteTo.File(logFilePath, rollingInterval: RollingInterval.Day, flushToDiskInterval: TimeSpan.FromSeconds(1))
        .CreateLogger();

    builder.Host.UseSerilog();

    // ---------------------------------------------------------
    // JWT AUTHENTICATION
    // ---------------------------------------------------------
    var jwtKey = builder.Configuration["Jwt:Key"] ?? "FallbackSecretKeyThatIsLongEnough123!!!";

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
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
            };
        });

    // ---------------------------------------------------------
    // CORS
    // ---------------------------------------------------------
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
                policy.WithOrigins(
                        "http://localhost:5000",
                        "http://localhost:5110",
                        "https://localhost:7139",
                        "http://localhost:5173"
                      )
                      .AllowAnyHeader()
                      .AllowAnyMethod()
                      .AllowCredentials();
            }
        });
    });

    // ---------------------------------------------------------
    // SERVICES
    // ---------------------------------------------------------
    builder.Services.AddControllers().AddJsonOptions(x =>
    {
        x.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        x.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });

    builder.Services.AddScoped<SmartHomeManager.Repositories.IRoomRepository, SmartHomeManager.Repositories.RoomRepository>();
    builder.Services.AddScoped<SmartHomeManager.Services.IRoomService, SmartHomeManager.Services.RoomService>();
    builder.Services.AddScoped<SmartHomeManager.Services.IDeviceControlService, SmartHomeManager.Services.DeviceControlService>();
    builder.Services.AddScoped<SmartHomeManager.Services.ISecurityNotificationService, SmartHomeManager.Services.SecurityNotificationService>();

    builder.Services.AddDbContext<AppDbContext>(opt =>
        opt.UseSqlite("Data Source=smarthome.db"));

    builder.Services.AddSignalR();
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen();
    builder.Services.AddHostedService<SmartHomeManager.Services.AutomationSchedulerService>();

    // ---------------------------------------------------------
    // BUILD APP
    // ---------------------------------------------------------
    var app = builder.Build();

    // ---------------------------------------------------------
    // DATABASE: single Migrate + seed
    // ---------------------------------------------------------
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
                new Device { Nume = "Lumină Ambientală", Tip = "Lampa", EstePornit = false, Valoare = 30.0, RoomId = living.Id },
                new Device { Nume = "Termostat", Tip = "Termostat", EstePornit = true, Valoare = 22.5, RoomId = bedroom.Id },
                new Device { Nume = "Senzor Climă", Tip = "Senzor", EstePornit = true, Valoare = 0.0, SensorValue = 22.5, SensorUnit = "°C", RoomId = living.Id },
                new Device { Nume = "Umiditate Aer", Tip = "Senzor", EstePornit = true, Valoare = 0.0, SensorValue = 45.0, SensorUnit = "%", RoomId = living.Id }
            );
            db.SaveChanges();

            Console.WriteLine("[System] Database seeded with initial Rooms and Devices.");
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

    // ---------------------------------------------------------
    // MIDDLEWARE PIPELINE
    // ---------------------------------------------------------
    app.UseMiddleware<ExceptionMiddleware>();

    app.UseDefaultFiles();
    app.UseStaticFiles();

    app.UseCors("AllowAll");

    app.UseRouting();

    app.UseAuthentication();
    app.UseAuthorization();

    // ---------------------------------------------------------
    // ENDPOINTS
    // ---------------------------------------------------------
    app.MapControllers();
    app.MapHub<SmartHomeHub>("/hubs/smarthome");
    app.MapFallbackToFile("index.html");

    Console.WriteLine($"[System] Application started. Logs: {logFilePath}");

    app.Run();
}
catch (Exception ex)
{
    Console.WriteLine("\n=======================================");
    Console.WriteLine("EROARE FATALĂ LA PORNIRE:");
    Console.WriteLine(ex.ToString());
    Console.WriteLine("=======================================\n");
    Console.ReadLine();
}
finally
{
    Log.CloseAndFlush();
}
