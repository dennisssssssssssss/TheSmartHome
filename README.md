# SmartHome Manager

SmartHome Manager is a full-stack smart home platform built with ASP.NET Core, Entity Framework Core, SignalR, React, and Vite. The backend codebase and technical documentation are kept in English, while the product UI is Romanian-first with bilingual support for authenticated flows.

## Current architecture

### Backend

- ASP.NET Core `net10.0`
- Entity Framework Core with SQLite
- JWT authentication
- SignalR for real-time updates
- Serilog for structured logging

### Frontend

- React 19 + TypeScript
- Vite build pipeline integrated into the `.csproj`
- Tailwind CSS
- Route-level lazy loading
- Locale-aware UI for Romanian and English

## Product capabilities

- room-first smart home management
- device dashboards and grouped room views
- live notifications and live device updates
- automations with interval or scheduled execution
- security modes, auto-lock, and security event tracking
- energy summaries and device activity visibility
- account registration, login, and password change flows backed by the database

## Running the project

### Prerequisites

- .NET 10 SDK
- Node.js with local dependencies already restored in `ClientApp`
- Visual Studio or Visual Studio Insiders

### Start locally

1. Open `SmartHomeManager.slnx` in Visual Studio.
2. Run the `SmartHomeManager` project.
3. Use one of the launch URLs printed in the console:
   - `http://localhost:5110`
   - `https://localhost:7139`

On startup, the application automatically:

- applies Entity Framework migrations
- creates `smarthome.db` if it does not exist
- seeds baseline rooms, devices, and the default admin user when needed

### Default credentials

- Username: `admin`
- Password: `assist2026`

## Repository structure

- `ClientApp/` contains the React frontend
- `Controllers/` contains HTTP API endpoints
- `Data/` contains the EF Core database context
- `Hubs/` contains SignalR hubs
- `Middleware/` contains request pipeline middleware
- `Migrations/` contains EF Core migrations
- `Models/` contains domain entities and DTOs
- `Repositories/` contains persistence abstractions and implementations
- `Services/` contains business logic, scheduling, and notifications

For frontend folder rules and ownership, see [ClientApp/README.md](ClientApp/README.md).

## Build output policy

Frontend artifacts are generated during build and copied into `wwwroot/`. Generated outputs are intentionally ignored by Git:

- `ClientApp/dist/`
- `wwwroot/assets/`
- `wwwroot/index.html`
- local verification folders such as `.codex-verify-build*`
- runtime database files such as `smarthome.db*`

This keeps the repository focused on source code instead of generated artifacts and local runtime state.
