# SmartHome Manager

SmartHome Manager is a full-stack smart home platform built with ASP.NET Core, Entity Framework Core, SignalR, React, and Vite.

The technical codebase, naming, and documentation are kept in English. The product UI is Romanian-first, with bilingual support for authenticated flows.

## What the product does

- room-first smart home management
- grouped device control by room
- live notifications and live device updates
- scheduled and recurring automations
- security modes, auto-lock, and security event tracking
- energy summaries and recent activity visibility
- database-backed registration, login, and password change flows

## Tech stack

### Backend

- ASP.NET Core `net8.0`
- Entity Framework Core with SQLite
- JWT authentication
- SignalR
- Serilog

### Frontend

- React 19 + TypeScript
- Vite
- Tailwind CSS
- route-level lazy loading
- centralized locale-aware UI content

## Getting started

### Prerequisites

- .NET SDK `9.0.311` or a compatible SDK accepted by `global.json`
- Node.js 20+ recommended
- Visual Studio or Visual Studio Insiders

### Run locally

1. Install frontend dependencies once:

   ```powershell
   cd ClientApp
   npm install
   ```

2. Open `SmartHomeManager.slnx` in Visual Studio, or run the backend from the repository root with:

   ```powershell
   dotnet run --project SmartHomeManager.csproj
   ```

3. Start the `SmartHomeManager` project.
4. Use one of the launch URLs shown in the console:
   - `http://localhost:5110`
   - `https://localhost:7139`

For a LAN demo from another PC on the same network:

1. Start the app normally.
2. Run `.\scripts\show-access-links.ps1` on the host machine.
3. Open the printed `http://<your-ip>:5110` URL from the second PC.

For the full walkthrough, see [LAN access](docs/LAN-ACCESS.md).

On startup the application automatically:

- applies Entity Framework migrations
- creates `smarthome.db` when it is missing
- seeds the default admin user and baseline data when needed

### Quick verification on a fresh clone

From the repository root:

```powershell
cd ClientApp
npm install
npm run typecheck
cd ..
dotnet build SmartHomeManager.csproj
dotnet test tests\SmartHomeManager.Tests\SmartHomeManager.Tests.csproj -c Release -p:SkipFrontendBuild=true
```

If these commands pass, the repo is in the expected demo-ready state.

### Portable deployment

For machines without a local .NET installation, publish a self-contained build:

```powershell
.\scripts\publish-self-contained.ps1 -Runtime win-x64
```

For deployment details, see [Deployment](docs/DEPLOYMENT.md).
For a real public server rollout, see [Public deployment](docs/PUBLIC-DEPLOYMENT.md).

### Default credentials

Available only when default admin seeding is enabled, which is the development default.

- Username: `admin`
- Password: `assist2026`

## Repository map

- `ClientApp/` contains the React frontend
- `Controllers/` contains HTTP API endpoints
- `Data/` contains the EF Core database context
- `Dtos/` contains backend DTO contracts
- `Extensions/` contains service-registration helpers
- `Hubs/` contains SignalR hubs
- `Middleware/` contains request pipeline middleware
- `Migrations/` contains EF Core migrations
- `Models/` contains domain entities
- `Repositories/` contains persistence abstractions and implementations
- `Services/` contains business logic, notifications, and scheduling
- `tests/` contains backend unit and integration-style tests
- `wwwroot/` contains generated frontend assets copied during build

## Project docs

- [Repository structure](docs/REPOSITORY-STRUCTURE.md)
- [API quickstart](docs/API-QUICKSTART.md)
- [Deployment](docs/DEPLOYMENT.md)
- [LAN access](docs/LAN-ACCESS.md)
- [Public deployment](docs/PUBLIC-DEPLOYMENT.md)
- [Product roadmap](docs/PRODUCT-ROADMAP.md)
- [Device connectivity strategy](docs/DEVICE-CONNECTIVITY.md)
- [ClientApp architecture](ClientApp/README.md)
- [HTTP request samples](SmartHomeManager.http)

## Quality guardrails

- GitHub Actions CI validates frontend type-checking, backend build, and backend tests
- backend tests cover auth, password hashing, security notifications, and recurring automations
- user-facing copy is centralized under `ClientApp/src/lib/i18n/`

## Build output policy

Frontend artifacts are generated during build and copied into `wwwroot/`. Generated outputs and local runtime state are intentionally ignored by Git, including:

- `ClientApp/dist/`
- `wwwroot/assets/`
- `wwwroot/index.html`
- `.codex-verify-build*`
- `smarthome.db*`

This keeps the repository focused on source code, not generated files.
