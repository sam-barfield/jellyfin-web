# Styling — three overlapping systems

There is no single styling system in this codebase. When a visual behavior doesn't match what you
expect, check these in order — the answer is usually in one of them, not the one you started in.

## 1. MUI theme (`src/themes/themes.ts`, `defaults.ts`) — governs MUI components only

- `themes.ts` builds a single MUI `DEFAULT_THEME` (`createTheme`) with **multiple named color
  schemes** (`dark`, `light`, `appletv`, `blueradiance`, `purplehaze`, `wmc`) via MUI's
  `colorSchemes` API — not multiple separate themes, one theme object with swappable palettes.
  `colorSchemeSelector: '[data-theme="%s"]'` means MUI reads the active scheme from a `data-theme`
  attribute on `<html>`, using CSS custom properties (`cssVarPrefix: 'jf'`) — this is how the scheme
  can switch without a full re-render/remount.
- `buildCustomColorScheme()` merges a custom palette (e.g. `purplehaze`'s teal/pink accents) on top
  of MUI's own light/dark defaults plus this app's `DEFAULT_COLOR_SCHEME`.
- Module augmentation (`declare module '@mui/material/styles'`) adds the four custom scheme names
  to MUI's `ColorSchemeOverrides` type, plus a custom `starIcon` palette slot.
- `RootAppRouter.tsx`'s `RootAppLayout` supplies this theme via `<ThemeProvider theme={appTheme}
  defaultMode='dark' storageManager={ThemeStorageManager}>`.
- **Only affects components actually built with MUI** (`@mui/material` imports). Legacy
  `.js`/template-driven UI (most of `src/components`, all of `src/controllers`) does not use MUI
  and is untouched by this theme.

## 2. Legacy per-theme Sass bundles (`src/themes/{id}/theme.scss`) — governs everything else

- Each theme (`dark`, `light`, `appletv`, `blueradiance`, `purplehaze`, `wmc`) has its own
  `theme.scss` targeting plain class selectors from the legacy UI (`.skinHeader`, `.ui-corner-all`,
  `.emby-collapsible-button`, etc. — `dark/theme.scss` alone is 500+ lines). These are **not**
  scoped under a `[data-theme]` attribute selector the way the MUI scheme is.
- `webpack.common.js` treats each `themes/**/*.scss` file as its **own separate webpack entry
  point** (`THEMES_BY_ID`, built from `fg.globSync('themes/**/*.scss', ...)`), so each theme
  compiles to its own standalone CSS bundle — they are not all loaded into the page at once and
  toggled by CSS specificity; something has to swap which stylesheet is active.
- The runtime switch is driven by `src/scripts/themeManager.js` (`setTheme(id)`): it sets
  `document.documentElement.setAttribute('data-theme', info.id)` (for MUI, see above), updates the
  `#themeColor` meta tag, and fires the legacy `EventType.THEME_CHANGE` event on `document`. That
  event is what `themes/themeStorageManager.ts`'s `ThemeStorageManager.subscribe` listens for to
  keep MUI's `useColorScheme()` in sync with the legacy theme choice — **MUI's storage manager is a
  shim onto the legacy event bus, not an independent source of truth.** `src/scripts/autoThemes.js`
  is what actually calls `setTheme()`: once on load (`userSettings.theme()`), again on
  `localusersignedin`, and again on every `viewbeforeshow` page-class event (switching to
  `userSettings.dashboardTheme()` specifically for `.type-interior` dashboard pages vs. the regular
  theme elsewhere).
- **Not fully traced**: exactly how/where the matching per-theme CSS `<link>` gets swapped into the
  page (the emitted webpack theme bundles aren't referenced in `src/index.html`, which only injects
  the `main.jellyfin`/`serviceworker` chunks). If you need this, start from `themeManager.js` /
  `autoThemes.js` and the webpack `THEMES_BY_ID` entries rather than assuming.

## 3. Runtime-injected inline `<style>` (fork-only)

`RootAppLayout` in `src/RootAppRouter.tsx` builds a `#modern-home-styles` `<style>` element in a
`useEffect` and appends it to `<head>` — this is fork-original code, not part of either system
above. It carries a large chunk of the homepage redesign: card sizing/hover, TV/controller
`:focus-visible` styling, and sidebar ("mainDrawer") modernization. See `fork-customizations.md`
for what's in it. **This only exists in the experimental-layout home page** — see
`architecture.md`'s stable-vs-experimental note.

## Sass tooling

`postcss.config.js` + `postcss-preset-env` + `autoprefixer` process compiled Sass output;
`cssnano.config.js` minifies for production. `sass` (Dart Sass) is the primary compiler with
`sass-embedded` as an optional (faster) drop-in — see `package.json` `optionalDependencies`. Regular
component-scoped styles live as `.scss` files co-located with their component (e.g.
`dialogHelper/dialoghelper.scss`), imported directly from the `.js`/`.ts` module — there is no
CSS Modules scoping; class names must stay globally unique by convention.
