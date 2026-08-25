# Fork customizations (not in upstream jellyfin-web)

This fork ("remaster", per the admin sidebar label "Sam's Remaster" — see below) adds several
features and UI reworks on top of upstream Jellyfin Web, purpose-built for one self-hosted server.
There is **no upstream reference implementation** for any of this — it's original to this fork.
Findings below come from reading the actual feature code, not just directory names; re-grep/re-read
if this feels stale.

**Important: these features need a custom Jellyfin *server*, not just this custom web client.**
Every one of them calls REST endpoints (`/Trending/*`, `/Friends/*`, `/Notifications/*`, etc.) and
item fields (`DubAvailability`, `IsAnime`) that do not exist in stock Jellyfin server. If something
in this area looks broken, first rule out "the server this points at doesn't have the matching
backend" before debugging the frontend.

## The "Remaster" admin section

`src/apps/dashboard/routes/remaster/` is a dedicated admin dashboard section (sidebar item "Sam's
Remaster", `src/apps/dashboard/components/drawer/sections/RemasterDrawerSection.tsx`) that groups
*all* custom-fork admin config in one place:

| Route | Component | Purpose |
|---|---|---|
| `/dashboard/remaster` | `routes/remaster/index.tsx` | Landing page — currently a placeholder ("YOOOO HOME PAGE"), unfinished |
| `/dashboard/remaster/trending` | `TrendingSettings` (`dashboard/components/trending`) | TMDB access token + cache TTL config |
| `/dashboard/remaster/dubbing` | `DubbingSettings`, `DubbingTask`, `DubbingMissingReport` (`dashboard/components/remaster/dubbing`) | Dub/sub tag settings, a scan/tag task trigger, and a report of items missing dub tags |
| `/dashboard/remaster/announcements` | `AnnouncementsAdmin` (`dashboard/components/announcements`) | Compose/manage announcements (also has an `AnnouncementModal`) |
| `/dashboard/remaster/calendar` | `CalendarSettings` (`dashboard/components/calendar`) | Config for the homepage schedule/calendar widget |

Routes are registered as async dashboard routes in `src/apps/dashboard/routes/_asyncRoutes.ts`
(`remaster`, `remaster/dubbing`, `remaster/announcements`, `remaster/calendar`, `remaster/trending`).
**If you add a new custom admin feature, this is the section/pattern to extend** — new route folder
under `routes/remaster/`, entry in `_asyncRoutes.ts`, nav item in `RemasterDrawerSection.tsx`.

## Common integration pattern for custom features

Trending, Friends, and Notifications all follow the same shape — worth copying for new features:

- One `features/{name}/api/use{Name}.ts` per feature, with:
  - PascalCase DTO interfaces commented `// matches the Jellyfin .NET backend serialisation`
  - A local `getHeaders(api)` helper repeated per file (`Authorization: api.authorizationHeader`)
  - Plain `api.axiosInstance` calls against `api.getUri('/CustomPath')` rather than going through
    the generated `@jellyfin/sdk` client (because these endpoints aren't in the SDK — they're
    fork-only server routes)
  - `@tanstack/react-query` `useQuery`/`useMutation`, with mutations invalidating the relevant
    query keys `onSuccess`
- Real-time variants (`useLiveFriendsWidget`, `useLiveNotifications`) layer WebSocket push on top
  of the plain query: they lazy-`import('utils/events')` + `import('scripts/serverNotifications')`,
  call `__legacyApiClient__.sendMessage('<Event>Start', ...)` to subscribe server-side, listen via
  `Events.on(serverNotifications, '<Event>', handler)`, and write pushed payloads directly into the
  React Query cache with `queryClient.setQueryData(...)`. Cleanup sends the matching `...Stop`
  message and unsubscribes. `__legacyApiClient__` comes from `useApi()` — it's the older
  `jellyfin-apiclient`-based client kept around specifically for its WebSocket support.
- Admin-only variants of an endpoint live under an `/Admin/` sub-path (e.g. `/Friends/Admin/{userId}`).

## Trending — TMDB-powered homepage trending (Movies/Shows)

**Wholly new** — trending did not exist in upstream Jellyfin Web in any form; this fork added it
from scratch (commit "Homepage Redesign v1, trakt trending + schedule"), first against Trakt.tv,
then migrated to TMDB (commit "Move from Trakt.tv to TMDB API for Trending"). Don't think of this as
"upstream had Trakt, we swapped the provider" — the entire feature, provider abstraction included,
is fork-original.

- `src/apps/dashboard/features/trending/api/useTrending.ts` — `useTrendingMovies`/`useTrendingShows`
  hit `/Trending/Movies` / `/Trending/Shows`, returning a fork-defined `TrendingItem` (`Rank`,
  `Title`, `Overview`, `Year`, `TmdbId`, `JellyfinItemId`). `useTrendingConfiguration` /
  `useUpdateTrendingConfiguration` read/write `/Trending/Configuration`
  (`TMDBAccessToken`, `CacheTimeToLiveMinutes`) — admin-configured server-side, not a client secret.
- `src/hooks/useHomeData.ts` consumes it: fetch TMDB trending IDs, then "hydrate" them by
  re-fetching those `JellyfinItemId`s through the normal Jellyfin `useGetItems` so the UI gets full
  Jellyfin metadata/images, then re-sorts hydrated results back into TMDB rank order (`orderedMovies`
  /`orderedShows`). Uses `isLoading` rather than `isPending` for the hydration queries specifically
  because a disabled query (no trending IDs yet resolved) reports `isPending: true` forever in React
  Query — using `isPending` there would hang the home page when TMDB returns nothing.
- Widget: `src/apps/experimental/features/home/components/TrendingWidget.tsx`.
- Admin UI: `src/apps/dashboard/components/trending/TrendingSettings.tsx`.

## Friends system

`src/apps/experimental/features/friends/` — `api/useFriends.ts`, `components/FriendsWidget.tsx`,
`FriendsPage.tsx`, routed only under `src/apps/experimental/routes/friends/` (i.e. **friends is
experimental-layout only**, not present in the stable app).

- Endpoints: `/Friends/Widget` (friend list + pending request count for a compact widget),
  `/Friends` (full list), `/Friends/Requests` (incoming), send/accept/decline via
  `/Friends/Requests/{username or requestId}[/Accept]`, remove via `DELETE /Friends/{friendId}`.
  Admin management via `/Friends/Admin/{userId}[/{friendId}]` (list/add/remove) — this is what backs
  "admin edit user → manage friends" (`src/components/dashboard/users`).
- `FriendDto` includes live presence/activity: `IsOnline`, `LastOnline`, `NowPlaying` (item/series
  + position/runtime ticks — "friend is currently watching X"), `HoursWatchedLastMonth`.
- Real-time updates via the `FriendActivity` WebSocket event (see pattern above); also referenced
  by `src/apps/experimental/components/AppToolbar/activity/ActivityButton.tsx` and commit history's
  "Activity private mode" (a user-facing toggle to hide their activity from friends).
- SyncPlay was extended to integrate with friends (invite/watch-with), per commit history — check
  `src/plugins/syncPlay` and the friends components together if working on that intersection.

## Notifications

`src/apps/experimental/features/notifications/api/useNotifications.ts` — `/Notifications` (list),
`/Notifications/Unread` (lightweight badge-count poll, optional `refetchInterval`),
`/Notifications/{id}/Read` and `/Notifications/ReadAll` to mark read. `NotificationType` enum
currently only covers friend-related events (`FriendRequestAccepted`, `FriendRequestReceived`,
`FriendRemoved`) — it's typed as `NotificationType | string` so the server can send types the client
doesn't know about yet without breaking. Real-time via the `UserNotification` WebSocket event, which
the server pushes as the *full* current notification list (not deltas) — the handler recomputes
unread count client-side from that list. This is distinct from **Announcements**, which is an
admin-broadcast feature (`AnnouncementsAdmin`/`AnnouncementModal`), not a per-user notification feed.

## Dub/Sub language tags

Server-driven per-item fields `DubAvailability` and `IsAnime` (requested via `ItemFields` in
queries — see `useHomeData.ts`, `useFetchItems.ts`, `utils/items.ts`) drive dub/sub badges and
filters across cards, genres, favorites, and the "next up"/"recently added"/"resume" home sections
(`src/components/homesections/sections/*.ts`, `src/components/cardbuilder/Card/CardImageContainer.tsx`).
Admin side lives in the Remaster dashboard section: `DubbingSettings` (config), `DubbingTask`
(trigger a scan/tagging task), `DubbingMissingReport` (items missing dub tags). Commit history also
mentions "Dub and sub filters for enabled libraries" — check `filterdialog`/`filtermenu` components
if extending filtering behavior.

## Homepage / UI redesign

**Lives in the `experimental` app, not `stable`** (see `architecture.md`) — despite the "Modern
Home" naming, none of this is visible on the default layout. Substantial rework of the homepage:
hero section with slide/gesture support, redesigned
media cards (Noto Sans font, rounded corners, hover overlay play button repositioned to
bottom-left), sidebar "theming" pass, schedule/calendar widget (admin-configurable via
`CalendarSettings`), nav bar height/spacing consistency, and Xbox/TV controller focus-navigation
support (`:focus-visible` outlines on cards/nav items sized for 10-foot UI).

Much of this is implemented as a large inline `<style>` block injected at runtime by
`RootAppLayout` in `src/RootAppRouter.tsx` (id `modern-home-styles`), rather than as Sass in
`src/styles`/`src/themes`. If you're hunting for where a homepage visual behavior comes from and
can't find it in component CSS, check that inline block first.

## Admin dashboard extensions

Admin "edit user" flow extended to manage friends (`src/components/dashboard/users`,
`src/apps/dashboard/routes/users`) — backed by the `/Friends/Admin/...` endpoints above.

## Implication for changes

Because these are fork-only, upstream PRs/issues and Jellyfin documentation won't cover them —
treat them as first-party features to design/debug from scratch. Follow the existing hook/DTO/
WebSocket pattern above for consistency, and remember every feature here has a paired server-side
implementation that this repo doesn't contain — check server behavior/logs, not just the client,
when something in this area misbehaves.
