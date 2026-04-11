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

- ASP.NET Core `net10.0`
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

- .NET 10 SDK
- Node.js
- Visual Studio or Visual Studio Insiders

### Run locally

1. Open `SmartHomeManager.slnx` in Visual Studio.
2. Start the `SmartHomeManager` project.
3. Use one of the launch URLs shown in the console:
   - `http://localhost:5110`
   - `https://localhost:7139`

On startup the application automatically:

- applies Entity Framework migrations
- creates `smarthome.db` when it is missing
- seeds the default admin user and baseline data when needed

### Default credentials

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
- `wwwroot/` contains generated frontend assets copied during build

## Project docs

- [Repository structure](docs/REPOSITORY-STRUCTURE.md)
- [API quickstart](docs/API-QUICKSTART.md)
- [ClientApp architecture](ClientApp/README.md)
- [HTTP request samples](SmartHomeManager.http)

## Build output policy

Frontend artifacts are generated during build and copied into `wwwroot/`. Generated outputs and local runtime state are intentionally ignored by Git, including:

- `ClientApp/dist/`
- `wwwroot/assets/`
- `wwwroot/index.html`
- `.codex-verify-build*`
- `smarthome.db*`

This keeps the repository focused on source code, not generated files.
