using Microsoft.EntityFrameworkCore;
using SmartHomeManager.Data;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Serilog;
using Serilog.Events;
using SmartHomeManager.Hubs;
using SmartHomeManager.Middleware;
using System.IO;

var builder = WebApplication.CreateBuilder(args);

// ---------------------------------------------------------
// SERILOG CONFIGURATION
// ---------------------------------------------------------
// Get the absolute path of the application execution folder
var basePath = AppDomain.CurrentDomain.BaseDirectory;
var logFolder = Path.Combine(basePath, "Logs");
var logFilePath = Path.Combine(logFolder, "log.txt");

// Ensure the Logs directory exists to prevent IO exceptions
if (!Directory.Exists(logFolder))
{
    Directory.CreateDirectory(logFolder);
}

// Configure Serilog to output to both the Terminal and a persistent File
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Debug()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Information)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.File(logFilePath, rollingInterval: RollingInterval.Day, flushToDiskInterval: TimeSpan.FromSeconds(1))
    .CreateLogger();

builder.Host.UseSerilog();

// ---------------------------------------------------------
// SERVICES AND DEPENDENCY INJECTION
// ---------------------------------------------------------
builder.Services.AddControllers().AddJsonOptions(x =>
    x.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles);

// Register repositories for Data Access Layer (Clean Architecture)
builder.Services.AddScoped<SmartHomeManager.Repositories.IRoomRepository, SmartHomeManager.Repositories.RoomRepository>();

// Register services for Business Logic Layer
builder.Services.AddScoped<SmartHomeManager.Services.IRoomService, SmartHomeManager.Services.RoomService>();
builder.Services.AddScoped<SmartHomeManager.Services.IDeviceControlService, SmartHomeManager.Services.DeviceControlService>();

// Database configuration (SQLite)
builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseSqlite("Data Source=smarthome.db"));

// Real-time communication via SignalR
builder.Services.AddSignalR();

// Swagger for API Documentation
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Background service for automation rules execution
builder.Services.AddHostedService<SmartHomeManager.Services.AutomationSchedulerService>();

var app = builder.Build();

// ---------------------------------------------------------
// HTTP PIPELINE CONFIGURATION
// ---------------------------------------------------------

// Custom middleware to catch and log all unhandled exceptions globally
app.UseMiddleware<ExceptionMiddleware>();

// Serve static files (HTML, CSS, JS) from wwwroot folder
app.UseDefaultFiles();
app.UseStaticFiles();

// Enable Swagger UI (available at /swagger)
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "SmartHomeManager API v1");
});

app.UseRouting();
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
    db.Database.EnsureCreated(); // Auto-creates database and tables if missing
}

// Log the log path to console on startup for easier debugging
Console.WriteLine($"[System] Application started. Logs are being saved to: {logFilePath}");

app.Run();