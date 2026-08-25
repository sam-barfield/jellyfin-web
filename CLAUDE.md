# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

Jellyfin Web frontend, forked from upstream `jellyfin/jellyfin-web` into a heavily customized
build ("remaster") for a specific self-hosted Jellyfin server. It adds features upstream doesn't
have (friend system, TMDB trending, dub/sub tags, announcements, custom home page UI, TV/controller
focus navigation). Current version tracked in `package.json`. Working branch is typically named
`vX.Y.Z-remaster`; `origin` points at a private GitLab, not the upstream GitHub repo.

## Context index

Read only the file(s) relevant to your current task — don't read all of them up front.

| File | Read this when... |
|---|---|
| `.claude/context/build-and-test.md` | Running dev server, building, linting, or running tests — also covers plugin config-loading and module resolution gotchas |
| `.claude/context/architecture.md` | Working on routing, app bootstrapping/init sequence, auth/API client (`useApi`), the plugin system, or need the src/ directory map — explains why login state lives in the *legacy* `jellyfin-apiclient`, not the modern SDK, and how legacy vs. modern routes coexist |
| `.claude/context/fork-customizations.md` | Touching custom features (friends, TMDB trending, notifications/announcements, dub/sub, homepage/TV UI) not in upstream Jellyfin Web — includes the shared hook/DTO/WebSocket pattern these all follow, and the "Remaster" admin section that configures them |
| `.claude/context/conventions.md` | Writing new code and need lint/style/TS conventions, commit message style, deprecated-area warnings, or what this fork's CI actually runs (hint: not GitHub Actions) |
| `.claude/context/styling.md` | Any CSS/theming work — explains the three overlapping styling systems (MUI theme, per-theme legacy Sass bundles, fork-injected inline `<style>`) and how theme switching actually works |
| `.claude/context/legacy-and-components.md` | Working in `src/components` or `src/controllers`, or a page you're looking for isn't a `.tsx` file anywhere — explains the controller+HTML-template pattern and how `ViewManagerPage` bridges it into React Router |

This index will grow as more of the codebase is explored in future sessions — add new rows here
rather than inlining details into this file.

## Quick facts

- Package manager: npm only (yarn is explicitly disabled, see `package.json` engines).
- Node >= 20.
- No test suite currently covers the custom features listed in `fork-customizations.md` — verify
  those manually in the browser (`npm start`) rather than trusting `npm run test` alone.
