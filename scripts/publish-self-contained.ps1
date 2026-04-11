param(
    [ValidateSet("win-x64", "linux-x64", "osx-x64", "osx-arm64")]
    [string]$Runtime = "win-x64",
    [ValidateSet("Debug", "Release")]
    [string]$Configuration = "Release"
)

$projectRoot = Split-Path -Parent $PSScriptRoot
$projectFile = Join-Path $projectRoot "SmartHomeManager.csproj"
$outputDirectory = Join-Path $projectRoot "artifacts\publish\$Runtime"

dotnet publish $projectFile `
    -c $Configuration `
    -r $Runtime `
    --self-contained true `
    -o $outputDirectory `
    /p:PublishSingleFile=true `
    /p:IncludeNativeLibrariesForSelfExtract=true `
    /p:PublishReadyToRun=true
