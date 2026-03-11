using Microsoft.EntityFrameworkCore;
using SmartHomeManager.Data;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
// Am eliminat Microsoft.OpenApi.Models ca să scăpăm definitiv de eroarea roșie

var builder = WebApplication.CreateBuilder(args);

// 1. Adaugă serviciile în container
builder.Services.AddControllers();
builder.Services.AddScoped<SmartHomeManager.Services.IDeviceControlService, SmartHomeManager.Services.DeviceControlService>();

// Configurare Bază de Date (folosim SQLite pentru salvare permanentă)
builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseSqlite("Data Source=smarthome.db"));

// Adaugă Swagger în varianta simplă, care nu necesită pachete extra
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// 2. Configurează Pipeline-ul HTTP
// AM ȘTERS if-ul (IsDevelopment) pentru a forța afișarea Swagger
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "SmartHomeManager API v1");

    // ACEASTA ESTE LINIA MAGICĂ: deschide Swagger direct pe adresa de bază (ex: localhost:5000)
    c.RoutePrefix = string.Empty;
});

app.UseAuthorization();
app.MapControllers();

// Acest cod se asigură că baza de date și tabelele sunt create automat
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated(); // Aplică orice modificare la structura bazei de date
}

// 3. Pornirea propriu-zisă
app.Run();