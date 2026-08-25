# src/components and src/controllers — the legacy imperative UI

`src/components` has 65 subdirectories; the large majority are plain `.js`, not React. Only a
handful are modern React/TSX (`common/`, `mediainfo/`, `router/`, `toolbar/`, `alphaPicker/`,
`indicators/`, `loading/`, `viewManager/`, plus scattered `.tsx` files elsewhere). Don't assume a
component is React just because it lives under `src/components` — check the file extension first.
`src/controllers` (marked ❌ deprecated in the README) is **entirely** this legacy style — full
pages, not components.

## The legacy pattern

A legacy "page" is a pair of files: a controller module (e.g. `src/controllers/home.js`, default
export usually a class/factory that takes a `view` DOM element and returns an object with
lifecycle-ish methods) and a matching `.html` template (translated for i18n via
`globalize.translateHtml` at load time). Legacy components under `src/components/*` follow the same
imperative-DOM style but as smaller reusable units (e.g. `dialogHelper/dialogHelper.js` builds and
animates dialog elements by hand — `focusManager`, `layoutManager`, raw `classList`/DOM calls, no
JSX).

## How legacy pages get into the React Router tree

This is the "two route systems" split from `architecture.md`, traced one level deeper:

1. A route in `legacyRoutes/{public,user}.ts` specifies `{ path, pageProps: { controller, view,
   appType, ... } }`.
2. `components/router/LegacyRoute.toViewManagerPageRoute` turns that into a `RouteObject` whose
   `element` is `<ViewManagerPage {...pageProps} />`.
3. `components/viewManager/ViewManagerPage.tsx` is the bridge: on mount/navigation it dynamically
   `import()`s the controller module and the `.html` view (path depends on `appType` — `Dashboard`/
   `Wizard`/default resolve to `apps/dashboard/controllers/*`, `apps/wizard/controllers/*`, or
   `src/controllers/*` respectively), runs the HTML through `globalize.translateHtml`, and hands
   both to `viewManager.loadView(...)`. **`ViewManagerPage` itself renders `null`** — the actual DOM
   is injected imperatively by `viewManager`, entirely outside React's virtual DOM. On browser
   back/forward (`useNavigationType() === Action.Pop`) it instead tries `viewManager.tryRestoreView`
   before falling back to a fresh `loadView`.
4. `dashboard` and `wizard` apps have their own `controllers/` directories following the same
   pattern (`src/apps/dashboard/controllers`, `src/apps/wizard/controllers`) — this isn't unique to
   the top-level `src/controllers`.

If you're trying to find where a page reachable by URL is implemented and grep for a `.tsx`
component turns up nothing, this is almost certainly why — search `legacyRoutes` for the path
instead, then find the paired controller/view under the relevant `controllers/` directory.

## Practical implications

- **Do not add new pages/components here.** Per the root README and `conventions.md`, new work
  belongs under the relevant `apps/*` directory as a real React component. This directory exists to
  be migrated away from, not extended.
- Legacy code reaches shared state through singletons/event buses rather than props or hooks:
  `focusManager`, `layoutManager`, `inputManager`, `Events` (`utils/events`), `ServerConnections`
  (`lib/jellyfin-apiclient`), `appSettings`/`userSettings` (`scripts/settings/*`). If you need to
  make a legacy component talk to new React state, you're bridging two different state models, not
  just importing a hook.
- Because these modules run outside React, React DevTools / component-level debugging won't show
  them — set breakpoints in the controller/component `.js` file directly.
- A few legacy directories mix in some `.tsx` (e.g. `mediainfo`, `indicators`) — these are partial
  migrations in progress, not a signal that the whole directory is safe to treat as modern React.
