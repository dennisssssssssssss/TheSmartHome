# Repository Structure

This document explains the current source-of-truth structure for SmartHome Manager.

## Top-level layout

- `ClientApp/`
  React frontend source.
- `Controllers/`
  ASP.NET Core API controllers.
- `Data/`
  EF Core database context and persistence bootstrap.
- `Dtos/`
  Request and response contracts for the backend API.
- `Extensions/`
  Service registration and application startup helpers.
- `Hubs/`
  SignalR hubs for live updates.
- `Middleware/`
  Request pipeline middleware.
- `Migrations/`
  EF Core migration history.
- `Models/`
  Domain entities persisted in the database.
- `Repositories/`
  Data access abstractions and implementations.
- `Services/`
  Business logic such as automation scheduling, password hashing, and security notifications.
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
2. Controllers map DTOs to entities and invoke services when needed.
3. Services and repositories persist changes through EF Core.
4. SignalR hubs broadcast live updates back to the frontend.

## Naming rules

- Technical names stay in English.
- User-facing copy can be Romanian or English, but shared copy should live in `ClientApp/src/lib/i18n/content.ts`.
- Avoid introducing new template files or generated assets into source folders.
