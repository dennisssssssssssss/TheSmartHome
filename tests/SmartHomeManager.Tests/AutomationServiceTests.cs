using AutoMapper;
using SmartHomeManager.Dtos;
using SmartHomeManager.Infrastructure.Repositories;
using SmartHomeManager.Mapping;
using SmartHomeManager.Models;
using SmartHomeManager.Services;
using SmartHomeManager.Tests.Infrastructure;

namespace SmartHomeManager.Tests;

public sealed class AutomationServiceTests
{
    [Fact]
    public async Task CreateAsync_ShouldRejectAutomationWithoutTarget()
    {
        var (db, connection) = TestDbFactory.CreateContext();
        await using var _ = db;
        await using var __ = connection;
        var service = CreateService(db);

        var result = await service.CreateAsync(new AutomationUpsertDto
        {
            Name = "No target",
            Action = "TurnOn",
            NextRunUtc = DateTime.UtcNow,
        });

        Assert.False(result.IsSuccess);
        Assert.Contains("target", result.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task CreateAsync_ShouldPersistRule_WhenRoomTargetExists()
    {
        var (db, connection) = TestDbFactory.CreateContext();
        await using var _ = db;
        await using var __ = connection;

        var room = new Room { Name = "Office" };
        db.Rooms.Add(room);
        await db.SaveChangesAsync();

        var service = CreateService(db);
        var result = await service.CreateAsync(new AutomationUpsertDto
        {
            Name = "Office lights",
            RoomId = room.Id,
            Action = "TurnOff",
            NextRunUtc = DateTime.SpecifyKind(DateTime.Now.AddMinutes(5), DateTimeKind.Local),
            IntervalMinutes = -5,
            Enabled = true,
        });

        Assert.True(result.IsSuccess);
        Assert.NotNull(result.Data);
        Assert.Equal(0, result.Data!.IntervalMinutes);

        var savedRule = db.AutomationRules.Single();
        Assert.Equal(room.Id, savedRule.RoomId);
        Assert.Null(savedRule.DeviceId);
        Assert.Equal(DateTimeKind.Utc, savedRule.NextRunUtc.Kind);
    }

    private static AutomationService CreateService(Data.AppDbContext db)
    {
        var mapper = new MapperConfiguration(
            configuration => configuration.AddProfile<EntityMappingProfile>()).CreateMapper();

        return new AutomationService(
            new AutomationRuleRepository(db),
            new DeviceRepository(db),
            new RoomRepository(db),
            mapper);
    }
}
