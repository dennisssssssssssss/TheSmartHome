# Deployment

SmartHome Manager now targets `.NET 8 LTS` for maximum compatibility with Visual Studio 2022 and standard enterprise environments.

## Best compatibility strategy

For development:

- use .NET 8 SDK when possible
- open the solution in Visual Studio 2022

For distribution to computers that do not have .NET installed:

- publish a self-contained build

## Self-contained publish

Use the included PowerShell script:

```powershell
.\scripts\publish-self-contained.ps1 -Runtime win-x64
```

Other supported runtimes:

- `linux-x64`
- `osx-x64`
- `osx-arm64`

Published output is written to:

```text
artifacts/publish/<runtime>
```

## Why this is more portable

- the project targets `.NET 8 LTS`
- framework-dependent builds can roll forward to newer installed runtimes
- self-contained publishes include the runtime, so the target computer does not need a separate .NET installation

## Useful checks

- health endpoint: `/health`
- Swagger UI in development: `/swagger`
