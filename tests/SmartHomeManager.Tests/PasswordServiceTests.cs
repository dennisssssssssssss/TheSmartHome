using SmartHomeManager.Services;

namespace SmartHomeManager.Tests;

public sealed class PasswordServiceTests
{
    [Fact]
    public void HashPassword_ShouldRoundTripWithVerifyPassword()
    {
        const string password = "Sup3rSecret!";

        var (salt, hash) = PasswordService.HashPassword(password);

        Assert.NotEmpty(salt);
        Assert.NotEmpty(hash);
        Assert.True(PasswordService.VerifyPassword(password, salt, hash));
        Assert.False(PasswordService.VerifyPassword("WrongPassword!", salt, hash));
    }
}
