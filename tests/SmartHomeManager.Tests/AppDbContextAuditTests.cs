using Microsoft.EntityFrameworkCore;
using SmartHomeManager.Models;
using SmartHomeManager.Tests.Infrastructure;

namespace SmartHomeManager.Tests;

public sealed class AppDbContextAuditTests
{
    [Fact]
    public async Task SaveChangesAsync_ShouldSetAuditFields_ForAddedAndModifiedEntities()
    {
        var (db, connection) = TestDbFactory.CreateContext();
        await using var _ = db;
        await using var __ = connection;

        var room = new Room { Name = "Living" };
        db.Rooms.Add(room);
        await db.SaveChangesAsync();

        Assert.NotEqual(default, room.CreatedAtUtc);
        Assert.NotEqual(default, room.UpdatedAtUtc);

        var createdAt = room.CreatedAtUtc;
        room.Name = "Living Room";
        room.CreatedAtUtc = DateTime.UnixEpoch;
        room.UpdatedAtUtc = DateTime.UnixEpoch;

        await db.SaveChangesAsync();

        var savedRoom = await db.Rooms.SingleAsync();
        Assert.Equal(createdAt, savedRoom.CreatedAtUtc);
        Assert.NotEqual(DateTime.UnixEpoch, savedRoom.UpdatedAtUtc);
        Assert.True(savedRoom.UpdatedAtUtc >= createdAt);
    }
}
