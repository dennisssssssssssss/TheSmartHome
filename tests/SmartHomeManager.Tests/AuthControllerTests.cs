using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.EntityFrameworkCore;
using SmartHomeManager.Controllers;
using SmartHomeManager.Dtos;
using SmartHomeManager.Infrastructure.Repositories;
using SmartHomeManager.Infrastructure.Security;
using SmartHomeManager.Models;
using SmartHomeManager.Services;
using SmartHomeManager.Tests.Infrastructure;

namespace SmartHomeManager.Tests;

public sealed class AuthControllerTests
{
    private static IConfiguration CreateConfiguration()
    {
        return new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Key"] = "TestsNeedASecretKeyThatIsLongEnough123456!",
                ["Jwt:Issuer"] = "SmartHomeTests",
                ["Jwt:Audience"] = "SmartHomeTestsAudience",
            })
            .Build();
    }

    [Fact]
    public async Task Register_ShouldNormalizeFields_AndPersistUser()
    {
        var (db, connection) = TestDbFactory.CreateContext();
        await using var _ = db;
        await using var __ = connection;
        var controller = CreateController(db);

        var result = await controller.Register(new RegisterDto
        {
            Username = "  Alex_User  ",
            DisplayName = "  Alex User  ",
            Email = " ALEX@Example.com ",
            Password = "Sup3rSecret!",
        });

        var ok = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<AuthResponseDto>(ok.Value);
        var savedUser = await db.Users.SingleAsync();

        Assert.Equal("alex_user", response.Username);
        Assert.False(string.IsNullOrWhiteSpace(response.Token));
        Assert.Equal("alex_user", savedUser.Username);
        Assert.Equal("Alex User", savedUser.DisplayName);
        Assert.Equal("alex@example.com", savedUser.Email);
        Assert.True(PasswordService.VerifyPassword("Sup3rSecret!", savedUser.PasswordSalt, savedUser.PasswordHash));
    }

    [Fact]
    public async Task ChangePassword_ShouldUpdateHash_WhenCurrentPasswordMatches()
    {
        var (db, connection) = TestDbFactory.CreateContext();
        await using var _ = db;
        await using var __ = connection;
        var (salt, hash) = PasswordService.HashPassword("OldPassword123!");
        db.Users.Add(new User
        {
            Username = "admin",
            DisplayName = "Administrator",
            Email = "admin@example.com",
            PasswordSalt = salt,
            PasswordHash = hash,
        });
        await db.SaveChangesAsync();

        var controller = CreateController(db);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(
                [
                    new Claim(JwtRegisteredClaimNames.UniqueName, "admin"),
                ], "TestAuth")),
            },
        };

        var result = await controller.ChangePassword(new ChangePasswordDto
        {
            CurrentPassword = "OldPassword123!",
            NewPassword = "NewPassword123!",
        });

        Assert.IsType<OkObjectResult>(result);

        var savedUser = await db.Users.SingleAsync();
        Assert.True(PasswordService.VerifyPassword("NewPassword123!", savedUser.PasswordSalt, savedUser.PasswordHash));
        Assert.False(PasswordService.VerifyPassword("OldPassword123!", savedUser.PasswordSalt, savedUser.PasswordHash));
    }

    private static AuthController CreateController(Data.AppDbContext db)
    {
        var configuration = CreateConfiguration();
        var userRepository = new UserRepository(db);
        var tokenService = new JwtTokenService(configuration);
        var authService = new AuthService(userRepository, tokenService);
        return new AuthController(authService);
    }
}
