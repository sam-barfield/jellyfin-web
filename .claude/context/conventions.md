# Conventions

## Directory status markers (from root README)

- ❌ Deprecated — do not create new files here: `src/controllers`
- 🧹 Needs cleanup: `src/elements`, and parts of `src/scripts`
- 🐉 Serious mess ("here be dragons"): `src/scripts`

New code should go under the relevant `src/apps/*` directory (Bulletproof React style:
`components/`, `features/{feature}/{api,components}`, `routes/`) unless it's genuinely shared,
in which case it belongs in the top-level `src/components`, `src/hooks`, `src/utils`, etc.

## TypeScript

- `tsconfig.json`: `strict: true`, `strictNullChecks: true`, `noImplicitAny: true`, but
  `checkJs: false` and `allowJs: true` — plenty of legacy `.js` files still exist and are not
  type-checked; don't assume type safety outside `.ts`/`.tsx`.
- Target is ES5 in tsconfig (transpilation handles modern syntax down to the `browserslist` targets
  in `package.json`, which includes old Chrome/Edge versions and Firefox ESR for smart TV/legacy
  device support — avoid relying on very new runtime JS features without checking transpile/polyfill
  coverage).
- Path base is `src` (`baseUrl: "src"`) — imports like `hooks/useApi`, `apps/stable/...` are
  relative to `src/`, not relative file paths.

## Linting

- ESLint config: `eslint.config.mjs` (flat config, `tseslint.config(...)`). Builds on
  `eslint.configs.recommended` + `tseslint.configs.recommended`, then layers in:
  `eslint-plugin-eslint-comments` (`comments.recommended` — governs `eslint-disable` comment
  hygiene itself), `eslint-plugin-compat` (`flat/recommended` — flags API usage the
  `browserslist` targets can't support), `eslint-plugin-import` (`flatConfigs.errors` +
  `flatConfigs.typescript`), `eslint-plugin-sonarjs` (`configs.recommended` — code-smell/bug
  pattern detection, e.g. duplicate branches, cognitive complexity), `eslint-plugin-react`
  (`flat.recommended`, with `settings.react.version: 'detect'`), `eslint-plugin-jsx-a11y`
  (`flatConfigs.recommended`), and `@stylistic/eslint-plugin` for formatting rules
  (`array-callback-return`, `curly`, `max-params: 7`, `new-cap`, etc.). `confusing-browser-globals`
  is wired in as `no-restricted-globals` data. Ignores: `node_modules`, `coverage`, `dist`, `.idea`,
  `.vscode`.
- Stylelint config: `.stylelintrc.json`, targets `src/**/*.{css,scss}`, uses
  `@stylistic/stylelint-plugin` + `stylelint-no-browser-hacks` + (per `package.json`)
  `stylelint-config-rational-order` and `stylelint-scss`. Rules are mostly `@stylistic/*`
  formatting (brace/space/newline placement) plus a handful of correctness rules like
  `at-rule-no-unknown`, `block-no-empty`, `color-no-invalid-hex`.
- Run `npm run lint` and `npm run stylelint` before considering frontend work done.

## CI/CD reality for this fork

- `origin` is a private GitLab (`gitlab.xencloud.io`), not the upstream `jellyfin/jellyfin-web`
  GitHub repo, and the working branch is a `vX.Y.Z-remaster` branch off that remote.
- `.gitlab-ci.yml` defines exactly one stage, `build-sonar`, which just runs `sonar-scanner`
  (`allow_failure: true`) on merge requests and on `master`/`main`/`v10.11.11-remaster` pushes. That
  is the *only* CI this fork's own remote actually runs.
- `.github/workflows/*` (pull_request.yml, push.yml, __package.yml, __quality_checks.yml, __codeql.yml,
  __deploy.yml, __automation.yml, schedule.yml) are upstream's GitHub Actions. Several jobs
  (push-comment, automation, deploy, run-eslint) are explicitly gated on
  `github.repository == 'jellyfin/jellyfin-web'` and will no-op on any fork/mirror; `build` and
  `quality_checks` are not gated that way but only run at all if this repo is ever pushed to GitHub
  and Actions are enabled there — currently it lives on GitLab, so treat these workflow files as
  upstream reference material, not as this fork's actual CI.
- Practical implication: **local `npm run lint` / `npm run stylelint` / `npm run build:check` /
  `npm test` are the real quality gate here** — don't assume a GitHub Actions check will catch
  issues before merge on this fork's own remote.

## Commit message style (this fork)

`git log` on this branch shows mostly short, imperative, capitalized subject lines with no
conventional-commits prefix (e.g. `Close popout on scroll`, `Media card popout`,
`Improve friend and sync menu styling`) — a `feat:`/`fix(scope):` prefix shows up occasionally
(`feat: add announcements bell and dashboard`, `feat(remaster): Add Dub/Sub Missing Report...`) but
is not consistently applied. Match the plain imperative style unless told otherwise; don't assume
conventional-commits linting is enforced anywhere (it isn't, per the CI section below).

## Translations

Only hand-edit `src/strings/en-us.json`. All other locale files under `src/strings/` are managed
via Weblate (translate.jellyfin.org) and synced by automation — don't hand-edit them or you'll
create merge conflicts with the translation sync.

## CSS/homepage styling gotcha

See `fork-customizations.md` — a chunk of homepage styling lives in an inline `<style>` tag
injected by JS (`src/RootAppRouter.tsx`), not in `.scss` files. Check there before assuming a style
rule doesn't exist.
