# ClientApp Architecture

This frontend is the React + Vite client for SmartHome Manager.

## Folder layout

- `src/pages/public` contains the unauthenticated landing and auth flows.
- `src/pages/app` contains authenticated product pages.
- `src/components/layouts` contains shells, navigation, and route loading states.
- `src/components/ui` contains the reduced UI primitive set still used by the product.
- `src/context` contains app-wide providers such as auth, locale, theme, and search.
- `src/hooks` contains reusable runtime hooks shared across features.
- `src/lib/api.ts` contains API access.
- `src/lib/i18n/content.ts` contains centralized user-facing copy for shared surfaces.
- `src/lib` contains preferences, helpers, and domain utilities.
- `src/types` contains shared frontend types.

## Working rules

- Keep code, comments, and technical identifiers in English.
- Keep user-facing strings centralized whenever they are reused across multiple screens.
- Add authenticated pages under `src/pages/app`.
- Add public marketing or auth surfaces under `src/pages/public`.
- Prefer extending `src/lib/api.ts` instead of calling `fetch` directly from pages.
- Avoid reintroducing template UI components or dependencies that are not used by the product.

## Ownership guidelines

- navigation, shell states, and page loading belong in `src/components/layouts`
- product copy that is reused belongs in `src/lib/i18n/content.ts`
- backend integration belongs in `src/lib/api.ts`
- page-specific orchestration belongs in the page component

## Generated files

The following outputs are generated locally and should not be committed:

- `dist/`
- `../wwwroot/assets/`
- `../wwwroot/index.html`
- `../wwwroot/vite.svg`

The `.csproj` build pipeline cleans stale frontend assets before copying the latest build into `wwwroot`.
