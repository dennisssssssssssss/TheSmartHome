using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using SmartHomeManager.Data;

namespace SmartHomeManager.Tests.Infrastructure;

internal static class TestDbFactory
{
    public static (AppDbContext DbContext, SqliteConnection Connection) CreateContext()
    {
        var connection = new SqliteConnection("Data Source=:memory:");
        connection.Open();

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(connection)
            .Options;

        var dbContext = new AppDbContext(options);
        dbContext.Database.EnsureCreated();

        return (dbContext, connection);
    }
}
