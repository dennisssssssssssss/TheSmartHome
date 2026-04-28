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

## Access from another PC on the same network

For local demos on a second computer, use the LAN-friendly development profile and open the host machine IP over HTTP.

See [LAN access](LAN-ACCESS.md) for the exact steps.

## Public internet access

For a real public deployment, do not expose your development machine directly.

Use a server with a public IP, keep the app behind a reverse proxy, and configure HTTPS on the public domain.

See [Public deployment](PUBLIC-DEPLOYMENT.md).
