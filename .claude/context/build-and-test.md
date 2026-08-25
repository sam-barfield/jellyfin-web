# Build, lint, test commands

## Setup

```sh
npm install
```

## Dev server

```sh
npm start          # alias for `npm run serve`; webpack-dev-server via webpack.dev.js
```

## Building

```sh
npm run build:development   # webpack build with sourcemaps (webpack.dev.js)
npm run build:production    # NODE_ENV=production build (webpack.prod.js)
npm run build:check         # tsc --noEmit — type-check only, no emit
npm run build:analyze       # production build + bundle analyzer
npm run build:es-check      # production build, then es-check (verifies ES5 output, see .escheckrc)
```

## Linting

```sh
npm run lint          # eslint "./" — config in eslint.config.mjs
npm run stylelint     # stylelint "src/**/*.{css,scss}" — config in .stylelintrc.json
```

## Tests

```sh
npm test             # vitest --watch=false --config vite.config.ts
npm run test:watch   # vitest watch mode
```

Vitest config (`vite.config.ts`) uses `environment: 'jsdom'` and `restoreMocks: true`, coverage
scoped to `src`. To run a single test file, pass it directly: `npx vitest run path/to/file.test.ts`.

Test coverage is currently upstream-oriented and thin overall — the fork's custom features
(friends, trending, announcements, dub/sub) have zero test coverage. Don't assume `npm test`
passing means a custom feature works; check it manually in the browser. As of this writing the
entire test suite is 12 files, all plain unit tests for pure utils (no component/hook tests, no
mocking framework beyond vitest's built-ins):

```
src/apps/dashboard/features/storage/utils/space.test.ts
src/apps/stable/features/playback/utils/itemText.test.ts
src/apps/stable/features/playback/utils/mediaSegments.test.ts
src/components/cardbuilder/cardBuilderUtils.test.ts
src/scripts/browser.test.ts
src/utils/card.test.ts
src/utils/dateFnsLocale.test.ts
src/utils/events.test.ts
src/utils/file.test.ts
src/utils/image.test.ts
src/utils/string.test.ts
src/utils/url.test.ts
```

Use these as the pattern reference (co-located `*.test.ts` next to the module under test, `vitest`
`describe`/`it`/`expect`) if adding new tests — there is no separate `__tests__` convention here.

## Module resolution — bare imports work at runtime too, not just in TS

`webpack.common.js` sets `resolve.modules: [path.resolve(__dirname, 'src'), 'node_modules']`, which
mirrors `tsconfig.json`'s `baseUrl: "src"`. This means bare-looking imports like
`import { useApi } from 'hooks/useApi'` are real webpack module resolution against `src/`, not just
a TypeScript path alias that happens to also need a bundler config — both webpack and tsc/vitest
agree on treating `src/` as a root. Vitest's jsdom test environment inherits the same resolution
since it also builds off `vite.config.ts` + the TS config.

## Plugin loading is config-driven, not auto-discovered

Adding a new player/screensaver/etc. under `src/plugins/` is not enough by itself — it must also be
added to the `"plugins"` array in `src/config.json`, or `pluginManager` will never load it. See
`architecture.md`'s "Plugin system" section for the full load path.

## Deployment — not in this repo

There is no Dockerfile, deploy script, or dev-server proxy config anywhere in this repo (checked:
`webpack.dev.js` has no `devServer.proxy`; the app instead connects to a Jellyfin server URL
entered at runtime, via `ServerConnections.initApiClient` in `index.jsx`). `.gitlab-ci.yml` (this
fork's actual CI, see `conventions.md`) doesn't build or deploy either — its only stage runs
`sonar-scanner` for code analysis. `npm run build:production` produces static output in `dist/` and
that's where this repo's responsibility ends — however this fork's build actually reaches the
self-hosted server (copied into a Jellyfin server's web root, a custom Docker image, etc.) happens
outside this repository. Don't assume a deploy pipeline exists here to extend; ask if you need to
know how `dist/` actually gets served.

## Node/tooling versions

- Node >= 20 (`.nvmrc` pins 20; devcontainer uses the same)
- npm >= 9.6.4 and < 11
- yarn is explicitly *not* supported (see `package.json` engines note)
