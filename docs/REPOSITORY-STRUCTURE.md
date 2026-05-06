# Repository Structure

This document explains the current source-of-truth structure for SmartHome Manager.

## Top-level layout

- `ClientApp/`
  React frontend source.
- `Controllers/`
  Thin ASP.NET Core API controllers. Controllers translate HTTP requests into application service calls.
- `Extensions/`
  Service registration and application startup helpers.
- `Hubs/`
  SignalR hubs for live updates.
- `Middleware/`
  Request pipeline middleware.
- `Services/`
  API-hosted runtime services, such as scheduling, SignalR-backed notifications, and live update publishing.
- `SmartHomeManager.Domain/`
  Domain entities and base entity types.
- `SmartHomeManager.Application/`
  DTOs, application services, service results, mapping profiles, integration contracts, and repository abstractions.
- `SmartHomeManager.Infrastructure/`
  EF Core `AppDbContext`, migrations, repository implementations, JWT/token infrastructure, and hardware bridge integrations.
- `tests/`
  Backend tests for controllers, services, infrastructure behavior, and integrations.
- `wwwroot/`
  Generated frontend assets copied during build.

## Frontend layout

Inside `ClientApp/src`:

- `pages/public`
  Landing and unauthenticated dialogs.
- `pages/app`
  Authenticated product pages.
- `components/layouts`
  App shell, sidebar, top bar, and loaders.
- `components/ui`
  Shared UI primitives still used by the product.
- `context`
  Cross-cutting providers such as auth, locale, theme, and search.
- `hooks`
  Shared runtime hooks.
- `lib`
  API access, preferences, i18n content, and helpers.
- `types`
  Shared frontend domain types.

## Request flow

1. The frontend calls `ClientApp/src/lib/api.ts`.
2. Controllers validate HTTP shape and delegate to application services.
3. Application services return `ServiceResult` values and use repositories for persistence.
4. Infrastructure repositories and bridge clients handle EF Core, SQLite, Matter, Modbus, and other external integrations.
5. SignalR publishers broadcast live updates back to the frontend.

## Naming rules

- Technical names stay in English.
- User-facing copy can be Romanian or English, but shared copy should live in `ClientApp/src/lib/i18n/content.ts`.
- Avoid introducing new template files or generated assets into source folders.
