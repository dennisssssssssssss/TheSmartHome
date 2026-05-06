param(
    [ValidateSet("win-x64", "linux-x64", "osx-x64", "osx-arm64")]
    [string]$Runtime = "win-x64",
    [ValidateSet("Debug", "Release")]
    [string]$Configuration = "Release"
)

$projectRoot = Split-Path -Parent $PSScriptRoot
$projectFile = Join-Path $projectRoot "SmartHomeManager.csproj"
$outputDirectory = Join-Path $projectRoot "artifacts\publish\$Runtime"
$frontendRoot = Join-Path $projectRoot "ClientApp"
$frontendDist = Join-Path $frontendRoot "dist"
$wwwroot = Join-Path $projectRoot "wwwroot"

if (Test-Path (Join-Path $frontendRoot "package.json")) {
    Push-Location $frontendRoot
    try {
        npm run build
    }
    finally {
        Pop-Location
    }

    if (-not (Test-Path $frontendDist)) {
        throw "Frontend build did not produce ClientApp/dist."
    }

    New-Item -ItemType Directory -Force -Path $wwwroot | Out-Null

    $knownFiles = @(
        "index.html",
        "vite.svg",
        "manifest.webmanifest",
        "sw.js",
        "favicon-32.png",
        "apple-touch-icon.png",
        "icon-192.png",
        "icon-512.png",
        "icon-maskable-512.png"
    )

    foreach ($file in $knownFiles) {
        $target = Join-Path $wwwroot $file
        if (Test-Path $target) {
            Remove-Item -LiteralPath $target -Force
        }
    }

    $assetsPath = Join-Path $wwwroot "assets"
    if (Test-Path $assetsPath) {
        Remove-Item -LiteralPath $assetsPath -Recurse -Force
    }

    Copy-Item -Path (Join-Path $frontendDist "*") -Destination $wwwroot -Recurse -Force
}

dotnet publish $projectFile `
    -c $Configuration `
    -r $Runtime `
    --self-contained true `
    -o $outputDirectory `
    /p:SkipFrontendBuild=true `
    /p:PublishSingleFile=true `
    /p:IncludeNativeLibrariesForSelfExtract=true `
    /p:PublishReadyToRun=true
