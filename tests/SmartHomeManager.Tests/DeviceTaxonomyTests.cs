using SmartHomeManager.Services.Integrations;

namespace SmartHomeManager.Tests;

public sealed class DeviceTaxonomyTests
{
    [Theory]
    [InlineData("Lampa", "lighting")]
    [InlineData("Priza", "energy")]
    [InlineData("Termostat", "climate")]
    [InlineData("Camera", "security")]
    [InlineData("Incuietoare", "access")]
    public void ResolveCategory_ShouldInferExpectedCategory_WhenTypeIsKnown(string deviceType, string expectedCategory)
    {
        var category = DeviceTaxonomy.ResolveCategory(null, deviceType);

        Assert.Equal(expectedCategory, category);
    }

    [Fact]
    public void ResolveCategory_ShouldHonorExplicitCategory()
    {
        var category = DeviceTaxonomy.ResolveCategory("solar", "Priza");

        Assert.Equal("solar", category);
    }
}
