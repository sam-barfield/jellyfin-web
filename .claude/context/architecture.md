# Architecture

## Bootstrapping — this is NOT a plain "React app with an entry point"

`src/index.jsx` runs a large *imperative* `init()` sequence before React ever mounts, then hands
off to `src/RootApp.tsx` → `src/RootAppRouter.tsx` for the React tree. Roughly, in order:

1. Import `lib/legacy` polyfills and `lib/jellyfin-apiclient` (comment in the file: "we need to
   import this first to initialize the connection").
2. `appHost.init()` — detects platform/capabilities (`components/apphost`).
3. Resolve the server URL (`utils/dashboard.serverAddress()`) and call
   `ServerConnections.initApiClient(serverUrl)` — this establishes the actual server connection
   and is the root of the whole session/auth system (see "API/auth layer" below).
4. Load the i18n core dictionary (`lib/globalize`) and wire it to re-run on
   `localusersignedin`/`localusersignedout`.
5. `loadPlugins()` — reads the plugin list from `src/config.json` and calls
   `pluginManager.loadPlugin()` for each (see "Plugin system" below); some plugins are filtered out
   based on `appHost.supports(AppFeature.RemoteControl)` / browser detection (e.g. chromecast only
   on Chrome-family browsers).
6. Wire up global WebSocket/error-handling event plumbing (`requestfail`, `apiclientcreated`) and
   `initializeServerConnections()` (`scripts/serverNotifications` — the pub/sub hub that the
   fork-custom `useLiveFriendsWidget`/`useLiveNotifications` hooks subscribe through; see
   `fork-customizations.md`).
7. `renderApp()` — clears the `#reactRoot` splash content and mounts `<RootApp />` with
   `createRoot`. **Only now does React take over.**
8. After render: enable keyboard navigation and auto-focus (`keyboardNavigation`, `autoFocuser`) —
   relevant to TV/controller navigation.

Also note the "anti-pattern" imports called out by a comment in `index.jsx` itself — several
modules (`displayMirrorManager`, `playerSelectionMenu`, `themeMediaPlayer`, `autoThemes`,
`mouseManager`, `screensavermanager`) are imported purely for their side effects (they self-register
on import). If one of these seems to "just work" with no visible call site, this is why.

## RootApp / RootAppRouter (the React part)

`RootApp.tsx` wraps everything in providers, outer to inner:
`QueryClientProvider` (`@tanstack/react-query`) → `ApiProvider` (`hooks/useApi`) →
`UserSettingsProvider` (`hooks/useUserSettings`) → `WebConfigProvider` (`hooks/useWebConfig`) →
`RootAppRouter`.

`RootAppRouter.tsx` builds a single `createHashRouter` (react-router-dom, hash-based routing —
routes look like `#/...`) that merges route arrays from four separate "apps":

```
STABLE_APP_ROUTES or EXPERIMENTAL_APP_ROUTES   (mutually exclusive, chosen by localStorage 'layout')
DASHBOARD_APP_ROUTES
WIZARD_APP_ROUTES
```

`localStorage.getItem('layout') === 'experimental'` decides stable vs experimental at router
construction time (not reactive — changing layout requires reload). `RootAppLayout` (rendered as
the router's top-level element) mounts a legacy `shortcuts` module via dynamic import, wraps
everything in the MUI `ThemeProvider` (`themes/themes`), and renders `AppHeader` + `Backdrop` +
`Outlet`. It also injects a large inline `<style>` block for home page card/sidebar/focus styling —
see `fork-customizations.md`.

## The four "apps" under src/apps/

- **stable** — the default layout (no opt-in needed). `AppLayout.tsx` + `routes/routes.tsx`. Its
  `features/` only has `lyrics`, `playback`, `search` — most pages here are still legacy
  `controllers`-backed (see `legacy-and-components.md`), so this app is closer to vanilla upstream
  Jellyfin Web.
- **experimental** — opt-in via `layout=experimental` in localStorage (toggle lives in Display
  Preferences, `apps/experimental/features/preferences`; nothing sets this by default, so a fresh
  browser profile sees `stable`). Its `features/` directory is much larger
  (`calendar`, `details`, `favorites`, `friends`, `home`, `libraries`, `media`, `notifications`,
  `preferences`) — **this is actually where almost all of this fork's headline custom work lives**:
  the TMDB-trending "Modern Home" (`useHomeData`, `TrendingWidget`), the friend system, and
  notifications are all experimental-only. If someone says a fork feature "isn't showing up," check
  whether they're on the stable layout first. Has its own `contexts/` (e.g. `NavContext` — drawer
  open/available state shared between the app shell and toolbar).
- **dashboard** — the admin dashboard (settings, libraries, users, plugins, scheduled tasks, etc.).
  Always mounted regardless of stable/experimental choice.
- **wizard** — first-run setup wizard.

Each app dir generally follows: `components/`, `features/` (feature-sliced: `api/`, `components/`,
etc.), `routes/`. This mirrors the Bulletproof React structure the project is migrating to (see
root `README.md`).

## src/ top-level map

```
src/
├── apps/           # stable / experimental / dashboard / wizard — see above
├── assets/         # static assets
├── components/     # shared higher-order visual components + React components
├── constants/       
├── controllers/    # LEGACY page views/controllers — deprecated, do not add here
├── elements/       # basic webcomponents + React equivalents — needs cleanup
├── hooks/          # shared React hooks (useApi, useUserSettings, useWebConfig, ...)
├── lib/            # reusable libraries: globalize (i18n), jellyfin-apiclient support,
│                   #   legacy (polyfills), navdrawer, scroller
├── plugins/        # runtime-loaded client plugins (players: html/chromecast/youtube/pdf/
│                   #   comics/book/photo, screensavers, syncPlay, playAccessValidation, ...)
├── scripts/        # DEPRECATED grab-bag of utilities/components — "here be dragons"
├── strings/        # i18n translation JSON — only ever hand-edit en-us.json, others come from Weblate
├── styles/         # shared Sass
├── themes/         # Sass + MUI theme definitions, ThemeStorageManager
├── types/          # shared TS types/interfaces
└── utils/          # utility functions
```

`controllers/` and `scripts/` are legacy/deprecated — avoid adding new code there; prefer the
appropriate `apps/*` directory per the Bulletproof React migration noted in root `README.md`.

## API / auth layer — the legacy client is the real source of truth

This is easy to get backwards: it looks like the app uses the modern `@jellyfin/sdk` `Api` object
as its primary API client with the old `jellyfin-apiclient` as a legacy fallback. **It's the
opposite.** Login state, server connection, and the WebSocket all live in
`ServerConnections`/`ApiClient` from `jellyfin-apiclient` (`src/lib/jellyfin-apiclient`,
principally `ServerConnections.js` and `connectionManager.js`). The modern `Api` object handed out
by `useApi()` is a thin compatibility wrapper built from the legacy client:

`hooks/useApi.tsx` (`ApiProvider`):
- On mount, calls `ServerConnections.currentApiClient()?.getCurrentUser()`, and listens for the
  legacy events `localusersignedin`/`localusersignedout` on `ServerConnections`.
- On sign-in, stores the legacy `ApiClient` instance itself as `__legacyApiClient__`.
- A *separate* effect converts that into the SDK-shaped object: `setApi(toApi(legacyApiClient))`,
  via `utils/jellyfin-apiclient/compat.ts`. So `api` (the `@jellyfin/sdk` `Api`) is always derived
  from, and one render-tick behind, `__legacyApiClient__`.
- `useApi()` returns `{ __legacyApiClient__, api, user }`. New code should generally prefer `api`
  (typed, matches the SDK's generated request shapes) but must drop to `__legacyApiClient__` for
  anything the SDK doesn't cover — notably **all WebSocket / real-time functionality**
  (`sendMessage`, `ensureWebSocket`) — see the fork's `useLive*` hooks in `fork-customizations.md`
  for the concrete pattern.

Practically: if you're debugging "why is `api` undefined/stale" or auth/session weirdness, look at
`ServerConnections` and the legacy `ApiClient` first, not the `useApi()` hook itself — the hook is
just reflecting legacy state.

Server-state fetching/caching for newer code uses `@tanstack/react-query`
(`utils/query/queryClient`), visible via React Query Devtools in dev (auto-disabled on TV clients
and browsers without `Proxy`, see `RootApp.tsx`).

`hooks/useWebConfig.tsx` is unrelated to server auth — it just fetches the static `config.json`
(theme list, plugin list, CORS/multiserver flags) at runtime via `fetchLocal`, falling back to the
bundled `defaultConfig` import if that fetch fails.

## Plugin system

Plugins under `src/plugins/*` (players, screensavers, syncPlay, etc.) are **not** auto-discovered —
the active list is declared explicitly in `src/config.json` under `"plugins"` (currently 14 entries,
e.g. `"htmlVideoPlayer/plugin"`, `"syncPlay/plugin"`, `"chromecastPlayer/plugin"`). `webSettings.js`
(`scripts/settings/webSettings.js`) reads that file (falling back to the bundled `config.json` import
if the runtime fetch fails), and `index.jsx`'s `loadPlugins()` feeds that list into
`pluginManager.loadPlugin()` (`components/pluginManager.js`) one by one, filtering some out based on
`appHost.supports(...)` / browser detection. Native shells can append more plugins via
`window.NativeShell.getPlugins()`. To add a fork-custom plugin, it needs both the module under
`src/plugins/` *and* an entry in `config.json`'s `plugins` array, or it will never load.

## Routing detail

Hash router (`createHashRouter`) — not browser/history router. `BangRedirect` handles legacy
`#!/...` style URLs redirecting to the modern route shape. `components/router/routerHistory`
exposes a `history` object built from the router for legacy (non-React-Router-aware) code to
navigate programmatically.

### Two route systems coexist inside `stable`/`experimental`

Within `src/apps/stable/routes/routes.tsx` (and the same shape in `experimental`), routes are split
into two parallel sets, both under `ConnectionRequired` (a guard that presumably requires an active
server connection — check `components/ConnectionRequired` if touching auth-gated routing) or the
public equivalent:

- **`asyncRoutes/` (`public.ts`, `user.ts`)** — modern routes: React components, lazily loaded,
  converted to `RouteObject`s via `components/router/AsyncRoute.toAsyncPageRoute`. This is what new
  pages should use.
- **`legacyRoutes/` (`public.ts`, `user.ts`)** — old template/controller-driven pages (living in the
  deprecated `src/controllers/`), converted via `components/router/LegacyRoute.toViewManagerPageRoute`
  into a `RouteObject` whose `element` is `<ViewManagerPage {...pageProps} />`
  (`components/viewManager/ViewManagerPage`) — a bridge component that mounts the old imperative
  page/controller inside the React Router tree. If you're trying to find where a page usually
  reached via URL is actually implemented and it's not a `.tsx` component, check whether it's routed
  through `legacyRoutes` into `src/controllers` instead.

Both route sets get `ErrorBoundary` (`components/router/ErrorBoundary`) and fall back to
`FallbackRoute` for unmatched paths.
