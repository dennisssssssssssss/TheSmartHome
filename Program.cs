using System.Text;
using System.Net;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Serilog;
using Serilog.Events;
using SmartHomeManager.Data;
using SmartHomeManager.Hubs;
using SmartHomeManager.Infrastructure.Repositories;
using SmartHomeManager.Infrastructure.Security;
using SmartHomeManager.Middleware;
using SmartHomeManager.Mapping;
using SmartHomeManager.Models;
using SmartHomeManager.Options;
using SmartHomeManager.Services;
using SmartHomeManager.Services.Integrations;

try
{
    var builder = WebApplication.CreateBuilder(args);
    var contentRootPath = builder.Environment.ContentRootPath;
    var runtimePaths = builder.Configuration.GetSection("RuntimePaths").Get<RuntimePathsOptions>() ?? new RuntimePathsOptions();
    var dataProtectionKeysPath = ResolvePath(
        runtimePaths.DataProtectionKeysDirectory,
        Path.Combine(contentRootPath, ".keys"),
        contentRootPath);
    var logsDirectoryPath = ResolvePath(
        runtimePaths.LogsDirectory,
        Path.Combine(contentRootPath, "Logs"),
        contentRootPath);

    // Keep logs close to the deployed app so published builds are self-contained.
    var logFilePath = Path.Combine(logsDirectoryPath, "log.txt");
    Directory.CreateDirectory(logsDirectoryPath);
    Directory.CreateDirectory(dataProtectionKeysPath);

    var applicationLogLevel = builder.Environment.IsDevelopment() ? LogEventLevel.Debug : LogEventLevel.Information;
    if (Enum.TryParse<LogEventLevel>(builder.Configuration["Logging:AppMinimumLevel"], true, out var configuredLogLevel))
    {
        applicationLogLevel = configuredLogLevel;
    }

    Log.Logger = new LoggerConfiguration()
        .MinimumLevel.Is(applicationLogLevel)
        .MinimumLevel.Override("Microsoft", LogEventLevel.Information)
        .Enrich.FromLogContext()
        .WriteTo.Console()
        .WriteTo.File(logFilePath, rollingInterval: RollingInterval.Day, flushToDiskInterval: TimeSpan.FromSeconds(1))
        .CreateLogger();

    builder.Host.UseSerilog();

    var jwtKey = builder.Configuration["Jwt:Key"];
    var configuredOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();
    var trustedProxyIps = builder.Configuration.GetSection("ReverseProxy:KnownProxies").Get<string[]>() ?? Array.Empty<string>();
    var enableCors = builder.Environment.IsDevelopment() || configuredOrigins.Length > 0;
    var seedDemoData = builder.Configuration.GetValue("Bootstrap:SeedDemoData", builder.Environment.IsDevelopment());
    var seedDefaultAdmin = builder.Configuration.GetValue("Bootstrap:SeedDefaultAdmin", builder.Environment.IsDevelopment());
    var defaultAdminPassword = builder.Configuration["Bootstrap:DefaultAdminPassword"];
    var rateLimitingOptions = builder.Configuration.GetSection("RateLimiting").Get<AppRateLimitingOptions>() ?? new AppRateLimitingOptions();
    var useHttpsRedirection = builder.Configuration.GetValue("Https:RedirectHttp", !builder.Environment.IsDevelopment());
    var useHsts = builder.Configuration.GetValue("Https:UseHsts", !builder.Environment.IsDevelopment());
    var hstsMaxAgeDays = builder.Configuration.GetValue("Https:HstsMaxAgeDays", 180);
    var hstsIncludeSubdomains = builder.Configuration.GetValue("Https:IncludeSubDomains", false);
    var hstsPreload = builder.Configuration.GetValue("Https:Preload", false);

    if (builder.Environment.IsProduction())
    {
        if (string.IsNullOrWhiteSpace(jwtKey) ||
            jwtKey.Contains("change-me", StringComparison.OrdinalIgnoreCase) ||
            jwtKey.Length < 32)
        {
            throw new InvalidOperationException(
                "Production requires a strong Jwt:Key provided through configuration or environment variables.");
        }
    }
    else
    {
        jwtKey ??= "DevelopmentOnlyJwtKey_ReplaceOutsideDev_123456789";
    }

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

    if (enableCors)
    {
        builder.Services.AddCors(options =>
        {
            options.AddPolicy("ClientOrigins", policy =>
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
                    policy.WithOrigins(configuredOrigins)
                        .AllowAnyHeader()
                        .AllowAnyMethod()
                        .AllowCredentials();
                }
            });
        });
    }

    builder.Services.AddControllers().AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });
    builder.Services.AddAutoMapper(_ => { }, typeof(EntityMappingProfile).Assembly);
    builder.Services.Configure<SecurityHeadersOptions>(builder.Configuration.GetSection("SecurityHeaders"));
    builder.Services.AddDataProtection()
        .PersistKeysToFileSystem(new DirectoryInfo(dataProtectionKeysPath))
        .SetApplicationName("SmartHomeManager");
    builder.Services.AddRateLimiter(options =>
    {
        options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
        options.OnRejected = async (context, cancellationToken) =>
        {
            if (!context.HttpContext.Response.HasStarted)
            {
                context.HttpContext.Response.ContentType = "application/json";
                await context.HttpContext.Response.WriteAsJsonAsync(
                    new { message = "Too many requests. Please try again later." },
                    cancellationToken);
            }
        };

        options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
            RateLimitPartition.GetFixedWindowLimiter(
                partitionKey: GetRateLimitPartitionKey(httpContext),
                factory: _ => new FixedWindowRateLimiterOptions
                {
                    AutoReplenishment = true,
                    PermitLimit = rateLimitingOptions.Global.PermitLimit,
                    Window = TimeSpan.FromSeconds(rateLimitingOptions.Global.WindowSeconds),
                    QueueLimit = rateLimitingOptions.Global.QueueLimit,
                    QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                }));

        options.AddPolicy("auth", httpContext =>
            RateLimitPartition.GetFixedWindowLimiter(
                partitionKey: GetRateLimitPartitionKey(httpContext),
                factory: _ => new FixedWindowRateLimiterOptions
                {
                    AutoReplenishment = true,
                    PermitLimit = rateLimitingOptions.Auth.PermitLimit,
                    Window = TimeSpan.FromSeconds(rateLimitingOptions.Auth.WindowSeconds),
                    QueueLimit = rateLimitingOptions.Auth.QueueLimit,
                    QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                }));
    });
    builder.Services.AddHsts(options =>
    {
        options.MaxAge = TimeSpan.FromDays(hstsMaxAgeDays);
        options.IncludeSubDomains = hstsIncludeSubdomains;
        options.Preload = hstsPreload;
    });
    if (useHttpsRedirection)
    {
        builder.Services.AddHttpsRedirection(options =>
        {
            options.HttpsPort = 443;
            options.RedirectStatusCode = StatusCodes.Status308PermanentRedirect;
        });
    }

    builder.Services.AddScoped<SmartHomeManager.Repositories.IRoomRepository, SmartHomeManager.Repositories.RoomRepository>();
    builder.Services.AddScoped<SmartHomeManager.Repositories.IUserRepository, UserRepository>();
    builder.Services.AddScoped<SmartHomeManager.Repositories.IDeviceRepository, DeviceRepository>();
    builder.Services.AddScoped<SmartHomeManager.Repositories.IAutomationRuleRepository, AutomationRuleRepository>();
    builder.Services.AddScoped<SmartHomeManager.Repositories.INotificationRepository, NotificationRepository>();
    builder.Services.AddScoped<SmartHomeManager.Repositories.IActivityLogRepository, ActivityLogRepository>();
    builder.Services.AddScoped<SmartHomeManager.Repositories.IDeviceEnergyUsageRepository, DeviceEnergyUsageRepository>();
    builder.Services.AddScoped<SmartHomeManager.Repositories.IEnergyAssetRepository, EnergyAssetRepository>();
    builder.Services.AddScoped<SmartHomeManager.Repositories.IEnergyTelemetrySampleRepository, EnergyTelemetrySampleRepository>();
    builder.Services.AddScoped<SmartHomeManager.Services.IRoomService, SmartHomeManager.Services.RoomService>();
    builder.Services.AddScoped<SmartHomeManager.Services.IAuthService, SmartHomeManager.Services.AuthService>();
    builder.Services.AddScoped<SmartHomeManager.Services.IJwtTokenService, JwtTokenService>();
    builder.Services.AddScoped<SmartHomeManager.Services.IDeviceService, SmartHomeManager.Services.DeviceService>();
    builder.Services.AddScoped<SmartHomeManager.Services.IAutomationService, SmartHomeManager.Services.AutomationService>();
    builder.Services.AddScoped<SmartHomeManager.Services.INotificationService, SmartHomeManager.Services.NotificationService>();
    builder.Services.AddScoped<SmartHomeManager.Services.ILogService, SmartHomeManager.Services.LogService>();
    builder.Services.AddScoped<SmartHomeManager.Services.IEnergyService, SmartHomeManager.Services.EnergyService>();
    builder.Services.AddScoped<SmartHomeManager.Services.IIntegrationService, SmartHomeManager.Services.IntegrationService>();
    builder.Services.AddScoped<SmartHomeManager.Services.IRealtimeEventPublisher, SmartHomeManager.Services.RealtimeEventPublisher>();
    builder.Services.AddScoped<SmartHomeManager.Services.IDeviceControlService, SmartHomeManager.Services.DeviceControlService>();
    builder.Services.AddScoped<SmartHomeManager.Services.ISecurityNotificationService, SmartHomeManager.Services.SecurityNotificationService>();
    builder.Services.AddSingleton<IProtectedSecretService, DataProtectionSecretService>();
    builder.Services.AddScoped<IIntegrationConnectionService, IntegrationConnectionService>();
    builder.Services.AddScoped<IModbusTelemetryImportService, ModbusTelemetryImportService>();
    builder.Services.AddScoped<IDeviceIntegrationAdapter, SimulatedDeviceIntegrationAdapter>();
    builder.Services.AddScoped<IDeviceIntegrationAdapter, MatterDeviceIntegrationAdapter>();
    builder.Services.AddScoped<IDeviceIntegrationAdapter, ModbusDeviceIntegrationAdapter>();
    builder.Services.AddSingleton<IDeviceIntegrationCatalogService, DeviceIntegrationCatalogService>();
    builder.Services.Configure<MatterBridgeOptions>(builder.Configuration.GetSection("MatterBridge"));
    builder.Services.Configure<ModbusBridgeOptions>(builder.Configuration.GetSection("ModbusBridge"));
    builder.Services.AddHttpClient<IMatterBridgeClient, MatterBridgeClient>();
    builder.Services.AddHttpClient<IModbusBridgeClient, ModbusBridgeClient>();

    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseSqlite(connectionString));

    builder.Services.Configure<ForwardedHeadersOptions>(options =>
    {
        options.ForwardedHeaders =
            ForwardedHeaders.XForwardedFor |
            ForwardedHeaders.XForwardedProto |
            ForwardedHeaders.XForwardedHost;

        foreach (var proxyIp in trustedProxyIps)
        {
            if (IPAddress.TryParse(proxyIp, out var parsedProxyIp))
            {
                options.KnownProxies.Add(parsedProxyIp);
            }
        }
    });

    builder.Services.AddSignalR();
    builder.Services.AddHealthChecks();
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen();
    builder.Services.AddHostedService<AutomationSchedulerService>();
    builder.Services.AddHostedService<ModbusTelemetrySyncHostedService>();

    var app = builder.Build();

    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Database.Migrate();

        if (seedDemoData && !db.Rooms.Any())
        {
            var living = new Room { Name = "Living Room" };
            var bedroom = new Room { Name = "Dormitor" };

            db.Rooms.AddRange(living, bedroom);
            db.SaveChanges();

            db.Devices.AddRange(
                new Device { Nume = "Bec Inteligent", Tip = "Lampa", Category = "lighting", IntegrationProtocol = DeviceIntegrationConstants.Simulated, EstePornit = true, Valoare = 75.0, RoomId = living.Id },
                new Device { Nume = "Lumina Ambientala", Tip = "Lampa", Category = "lighting", IntegrationProtocol = DeviceIntegrationConstants.Simulated, EstePornit = false, Valoare = 30.0, RoomId = living.Id },
                new Device { Nume = "Termostat", Tip = "Termostat", Category = "climate", IntegrationProtocol = DeviceIntegrationConstants.Simulated, EstePornit = true, Valoare = 22.5, RoomId = bedroom.Id },
                new Device { Nume = "Senzor Clima", Tip = "Senzor", Category = "sensing", IntegrationProtocol = DeviceIntegrationConstants.Simulated, EstePornit = true, Valoare = 0.0, SensorValue = 22.5, SensorUnit = "C", RoomId = living.Id },
                new Device { Nume = "Umiditate Aer", Tip = "Senzor", Category = "sensing", IntegrationProtocol = DeviceIntegrationConstants.Simulated, EstePornit = true, Valoare = 0.0, SensorValue = 45.0, SensorUnit = "%", RoomId = living.Id }
            );
            db.SaveChanges();

            Console.WriteLine("[System] Database seeded with initial rooms and devices.");
        }

        if (seedDemoData && !db.EnergyTelemetrySamples.Any())
        {
            var now = DateTime.UtcNow;
            var telemetrySamples = new List<EnergyTelemetrySample>();

            for (var hoursAgo = 11; hoursAgo >= 0; hoursAgo--)
            {
                var timestamp = now.AddHours(-hoursAgo);
                var daylightFactor = Math.Max(0, 1 - Math.Abs(12 - timestamp.Hour) / 6.0);
                var solarPower = Math.Round(4500 * daylightFactor, 2);
                var homeLoad = Math.Round(900d + (timestamp.Hour >= 18 ? 450d : 150d), 2);
                var batteryPower = Math.Round(daylightFactor > 0.35 ? -600 * daylightFactor : 350, 2);
                var gridPower = Math.Round(homeLoad - solarPower - batteryPower, 2);
                var batterySoc = Math.Clamp(38 + ((12 - hoursAgo) * 4), 22, 91);

                telemetrySamples.AddRange(
                [
                    new EnergyTelemetrySample
                    {
                        SourceType = "solar",
                        TimestampUtc = timestamp,
                        PowerWatts = solarPower,
                        EnergyDeltaWh = Math.Max(solarPower / 2, 0),
                    },
                    new EnergyTelemetrySample
                    {
                        SourceType = "home",
                        TimestampUtc = timestamp,
                        PowerWatts = homeLoad,
                        EnergyDeltaWh = Math.Max(homeLoad / 2, 0),
                    },
                    new EnergyTelemetrySample
                    {
                        SourceType = "grid",
                        TimestampUtc = timestamp,
                        PowerWatts = gridPower,
                        EnergyDeltaWh = Math.Abs(gridPower / 2),
                    },
                    new EnergyTelemetrySample
                    {
                        SourceType = "battery",
                        TimestampUtc = timestamp,
                        PowerWatts = batteryPower,
                        EnergyDeltaWh = Math.Abs(batteryPower / 2),
                        StateOfChargePercent = batterySoc,
                    }
                ]);
            }

            db.EnergyTelemetrySamples.AddRange(telemetrySamples);
            db.SaveChanges();
            Console.WriteLine("[System] Seeded sample energy telemetry for solar, grid, battery, and home load.");
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

        var legacyDevices = db.Devices
            .Where(device => string.IsNullOrWhiteSpace(device.Category) || string.IsNullOrWhiteSpace(device.IntegrationProtocol))
            .ToList();

        if (legacyDevices.Count > 0)
        {
            foreach (var legacyDevice in legacyDevices)
            {
                legacyDevice.Category = DeviceTaxonomy.ResolveCategory(legacyDevice.Category, legacyDevice.Tip);
                legacyDevice.IntegrationProtocol = DeviceIntegrationConstants.NormalizeProtocol(legacyDevice.IntegrationProtocol);
            }

            db.SaveChanges();
            Console.WriteLine("[System] Normalized legacy device metadata for integration-ready devices.");
        }

        var adminUser = db.Users.SingleOrDefault(user => user.Username == "admin");
        if (seedDefaultAdmin && adminUser == null)
        {
            var resolvedAdminPassword = string.IsNullOrWhiteSpace(defaultAdminPassword)
                ? (builder.Environment.IsDevelopment() ? "assist2026" : null)
                : defaultAdminPassword;

            if (string.IsNullOrWhiteSpace(resolvedAdminPassword))
            {
                throw new InvalidOperationException(
                    "Bootstrap:SeedDefaultAdmin is enabled, but Bootstrap:DefaultAdminPassword is missing.");
            }

            var (salt, hash) = PasswordService.HashPassword(resolvedAdminPassword);
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
        else if (seedDefaultAdmin && adminUser != null && (string.IsNullOrWhiteSpace(adminUser.PasswordHash) || string.IsNullOrWhiteSpace(adminUser.PasswordSalt)))
        {
            var resolvedAdminPassword = string.IsNullOrWhiteSpace(defaultAdminPassword)
                ? (builder.Environment.IsDevelopment() ? "assist2026" : null)
                : defaultAdminPassword;

            if (string.IsNullOrWhiteSpace(resolvedAdminPassword))
            {
                throw new InvalidOperationException(
                    "Bootstrap:SeedDefaultAdmin is enabled, but Bootstrap:DefaultAdminPassword is missing.");
            }

            var (salt, hash) = PasswordService.HashPassword(resolvedAdminPassword);
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
    app.UseForwardedHeaders();
    if (useHttpsRedirection)
    {
        app.UseHttpsRedirection();
    }

    if (useHsts)
    {
        app.UseHsts();
    }

    app.UseMiddleware<SecurityHeadersMiddleware>();
    app.UseDefaultFiles();
    app.UseStaticFiles();
    app.UseSerilogRequestLogging();

    if (enableCors)
    {
        app.UseCors("ClientOrigins");
    }

    app.UseRouting();
    app.UseRateLimiter();

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

static string ResolvePath(string? configuredPath, string fallbackPath, string contentRootPath)
{
    if (string.IsNullOrWhiteSpace(configuredPath))
    {
        return fallbackPath;
    }

    return Path.IsPathRooted(configuredPath)
        ? configuredPath
        : Path.Combine(contentRootPath, configuredPath);
}

static string GetRateLimitPartitionKey(HttpContext context)
{
    var userKey = context.User?.Identity?.Name;
    if (!string.IsNullOrWhiteSpace(userKey))
    {
        return $"user:{userKey}";
    }

    var remoteIp = context.Connection.RemoteIpAddress?.ToString();
    if (!string.IsNullOrWhiteSpace(remoteIp))
    {
        return $"ip:{remoteIp}";
    }

    return "anonymous";
}
