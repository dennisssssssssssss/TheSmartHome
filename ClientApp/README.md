# ClientApp Architecture

This frontend is the React + Vite client for SmartHome Manager.

## Folder layout

- `src/pages/public` contains the unauthenticated experience.
- `src/pages/app` contains the authenticated product surfaces.
- `src/components/layouts` contains shared shells, navigation, and route loading states.
- `src/components/ui` contains the reduced UI primitive set that is still in active use.
- `src/context` contains cross-cutting providers such as auth, theme, search, and locale.
- `src/lib` contains API access, preferences, shared helpers, and domain utilities.
- `src/hooks` should contain reusable runtime hooks only when they are shared across features.
- `src/types` contains frontend domain types shared across pages.

## Working rules

- Keep code, comments, and technical identifiers in English.
- Keep user-facing UI copy localized through the locale-aware flows.
- Add new authenticated pages under `src/pages/app`.
- Add new public marketing or auth pages under `src/pages/public`.
- Prefer extending `src/lib/api.ts` for API access instead of calling `fetch` directly inside pages.
- Avoid reintroducing template UI components that are not used by the product.

## Generated files

The following outputs are generated locally and should not be committed:

- `dist/`
- `../wwwroot/assets/`
- `../wwwroot/index.html`
- `../wwwroot/vite.svg`

The `.csproj` build pipeline now cleans stale frontend assets before copying the latest build into `wwwroot`.
