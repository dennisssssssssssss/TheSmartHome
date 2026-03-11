using Microsoft.EntityFrameworkCore;
using SmartHomeManager.Data;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;

var builder = WebApplication.CreateBuilder(args);

// 1. Adaugă serviciile în container
builder.Services.AddControllers().AddJsonOptions(x =>
    x.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles);

// Serviciu pentru controlul dispozitivelor
builder.Services.AddScoped<SmartHomeManager.Services.IDeviceControlService, SmartHomeManager.Services.DeviceControlService>();

// Configurare Bază de Date SQLite
builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseSqlite("Data Source=smarthome.db"));

// Configurare Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Înregistrare serviciu de automatizare (Background Worker)
builder.Services.AddHostedService<SmartHomeManager.Services.AutomationSchedulerService>();

var app = builder.Build();

// 2. Configurează Pipeline-ul HTTP (ORDINEA ESTE CRITICĂ AICI)

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "SmartHomeManager API v1");
    // Lăsăm RoutePrefix gol dacă vrei Swagger pe pagina principală, 
    // DAR pentru index.html-ul tău, e mai bine să fie:
    c.RoutePrefix = "swagger";
});

// ACTIVARE INTERFAȚĂ GRAFICĂ
// Aceste două rânduri trebuie să fie ÎNAINTE de MapControllers
app.UseDefaultFiles();
app.UseStaticFiles();

app.UseRouting();
app.UseAuthorization();

app.MapControllers();

// Asigurarea creării bazei de date la pornire
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
}
app.MapGet("/ui", () =>
{
    var drumSpreFisier = System.IO.Path.Combine(AppContext.BaseDirectory, "wwwroot", "index.html");

    if (System.IO.File.Exists(drumSpreFisier))
    {
        return Results.Content(System.IO.File.ReadAllText(drumSpreFisier), "text/html");
    }

    return Results.NotFound($"Eroare 404: Nu găsesc fișierul! L-am căutat exact la adresa asta: {drumSpreFisier}");
});
// 3. Pornirea
app.Run();