using Microsoft.EntityFrameworkCore;
using SmartHomeManager.Data;
using SmartHomeManager.Models;
using System.Linq;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Serilog;
using Serilog.Events;
using SmartHomeManager.Hubs;
using SmartHomeManager.Middleware;
using System.IO;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System;

try
{
    // Aici începe execuția reală a aplicației
    var builder = WebApplication.CreateBuilder(args);

    // ---------------------------------------------------------
    // THE NUCLEAR OPTION: HARDCODED ABSOLUTE PATH
    // ---------------------------------------------------------
    var logFilePath = @"C:\SmartHomeLogs\log.txt";

    Log.Logger = new LoggerConfiguration()
        .MinimumLevel.Debug()
        .MinimumLevel.Override("Microsoft", LogEventLevel.Information)
        .Enrich.FromLogContext()
        .WriteTo.Console()
        .WriteTo.File(logFilePath, rollingInterval: RollingInterval.Day, flushToDiskInterval: TimeSpan.FromSeconds(1))
        .CreateLogger();

    builder.Host.UseSerilog();

    // ---------------------------------------------------------
    // JWT AUTHENTICATION CONFIGURATION
    // ---------------------------------------------------------
    // Adăugăm un fallback temporar pentru cheie, în caz că nu o găsește în JSON
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
    // SERVICES AND DEPENDENCY INJECTION
    // ---------------------------------------------------------
    builder.Services.AddControllers().AddJsonOptions(x =>
        x.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles);

    builder.Services.AddScoped<SmartHomeManager.Repositories.IRoomRepository, SmartHomeManager.Repositories.RoomRepository>();
    builder.Services.AddScoped<SmartHomeManager.Services.IRoomService, SmartHomeManager.Services.RoomService>();
    builder.Services.AddScoped<SmartHomeManager.Services.IDeviceControlService, SmartHomeManager.Services.DeviceControlService>();

    builder.Services.AddDbContext<AppDbContext>(opt =>
        opt.UseSqlite("Data Source=smarthome.db"));

    builder.Services.AddSignalR();
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen();
    builder.Services.AddHostedService<SmartHomeManager.Services.AutomationSchedulerService>();

    var app = builder.Build();
    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<SmartHomeManager.Data.AppDbContext>();
        // Această linie forțează actualizarea bazei de date la fiecare pornire a serverului
        db.Database.Migrate();
    }

    app.UseMiddleware<ExceptionMiddleware>();
    app.UseDefaultFiles();
    app.UseStaticFiles();
    app.UseRouting();

    // JWT Middleware
    app.UseAuthentication();
    app.UseAuthorization();

    app.MapControllers();
    app.MapHub<SmartHomeHub>("/hubs/smarthome");

    // ---------------------------------------------------------
    // DATABASE INITIALIZATION
    // ---------------------------------------------------------
    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        // Use migrations to ensure the database schema matches the current EF model.
        // EnsureCreated does not apply migrations and can leave the schema out of sync.
        db.Database.Migrate();

        // --------------------------------------------------------------------
        // DATA SEEDING: create initial Rooms and Devices if none exist.
        // This ensures a minimal dataset is available on first run.
        // --------------------------------------------------------------------
        if (!db.Rooms.Any())
        {
            // Create initial rooms
            var living = new Room { Name = "Living Room" };
            var bedroom = new Room { Name = "Dormitor" };

            db.Rooms.AddRange(living, bedroom);
            db.SaveChanges(); // persist rooms so they receive generated Ids

            // Create devices associated with the newly created rooms
            var device1 = new Device
            {
                Nume = "Bec Inteligent",
                Tip = "Lampa",
                EstePornit = true,
                Valoare = 75.0,
                RoomId = living.Id
            };

            var device2 = new Device
            {
                Nume = "Lumină Ambientală",
                Tip = "Lampa",
                EstePornit = false,
                Valoare = 30.0,
                RoomId = living.Id
            };

            var device3 = new Device
            {
                Nume = "Termostat",
                Tip = "Termostat",
                EstePornit = true,
                Valoare = 22.5,
                RoomId = bedroom.Id
            };

            db.Devices.AddRange(device1, device2, device3);
            db.SaveChanges();

            Console.WriteLine("[System] Database has been seeded with initial Rooms and Devices.");
        }
    }

    Console.WriteLine($"[System] Application started. Logs are being saved to: {logFilePath}");

    app.Run();
}
catch (Exception ex)
{
    // AICI CADE ORICE EROARE FATALĂ DE LA PORNIRE
    Console.WriteLine("\n=======================================");
    Console.WriteLine("🔥 EROARE FATALĂ LA PORNIRE:");
    Console.WriteLine(ex.ToString());
    Console.WriteLine("=======================================\n");
    Console.WriteLine("Apasă ENTER pentru a închide fereastra...");
    Console.ReadLine();
}
finally
{
    // Ne asigurăm că log-urile sunt scrise pe disc înainte să moară aplicația
    Log.CloseAndFlush();
}