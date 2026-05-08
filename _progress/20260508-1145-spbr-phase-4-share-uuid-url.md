# Phase 4 — Share via UUID URL (publish-by-git)

**Spec:** `_specification/scenario-portability-and-brand-refresh.md`
**Date:** 2026-05-08
**Status:** Complete; build green

## What changed

### New persistence helpers (in PERSISTENCE section)
- `getPublicOrigin()` — returns `VITE_PUBLIC_HOST` env override or `window.location.origin`. Trailing-slash safe.
- `buildShareUrl(state)` — pure: `{ url, scenarioId, json }`. No HTTP.
- `parseScenarioPath(pathname)` — regex extract UUID from `/scenarios/<uuid>` (case-insensitive); validates UUID v4.
- `checkPublishStatus(uuid)` — `HEAD /scenarios/<uuid>.json` with 1s timeout. Returns `'live' | 'not-yet' | 'unknown'`.
- `fetchScenarioJson(uuid)` — `GET /scenarios/<uuid>.json` with 5s timeout. Returns `{ ok, state?, errorKind: 'not-found' | 'network' | 'format' }`. Wraps `deserializeProject`.

### New components
- `ShareModal` (~110 lines):
  - Project-name input (binds to root `projectName` state).
  - Read-only public URL field with auto-select on focus.
  - **Copy** button — uses `navigator.clipboard.writeText` with a `document.execCommand('copy')` fallback.
  - **Download JSON** primary CTA.
  - **Fork as new scenario** secondary action (Q-008 recommended option (a)).
  - Live publish-status badge: amber "Not yet published" / green "Published — URL is live" / silent on timeout.
  - Instructional block referencing the exact `public/scenarios/<uuid>.json` target path.

### Root component (`TUNAScenarioTool`) changes
- New state: `shareOpen`, `loadError`, `hydratingFromUrl` (initialised from URL on first render to suppress fixture FOUC).
- New `useEffect` on mount: if `parseScenarioPath(pathname)` returns a UUID, fetch + hydrate. Success → state applied + Step 10. Failure → `loadError` set + Step 0 + default fixture preserved. URL is NOT cleared (refresh re-fetches).
- New `handleShareOpen()` — ensures UUID then opens modal.
- New `handleDuplicate()` — mints a new UUID, clears the URL path, toasts.
- `handleReset()` clears `loadError` and pushes `'/'` if a scenario path is in URL.
- New header button: **Share** (between Export and Reset). Always visible.
- Load-error banner rendered above `renderStep()` when on Step 0 with `loadError` set. Three message variants: not-found / network / format.
- Brief "Loading scenario…" placeholder while `hydratingFromUrl` is true.

### File-system additions
- `public/scenarios/` directory created.
- `public/scenarios/README.md` — explains publish workflow, forking, privacy, schema reference.

### Notes on Vercel routing
- `vercel.json` already has SPA rewrite `"/(.*)" → "/"`. Verified: Vercel serves static files in the output directory before falling through to the rewrite. So `public/scenarios/<uuid>.json` will be served at `/scenarios/<uuid>.json`, and `/scenarios/<uuid>` (no extension) hits the rewrite and renders the SPA.
- No changes to `vercel.json` required.

## Quality gate

- [x] `npm run build` succeeds, no warnings.
- [x] Bundle: 79.54 KB gzipped (was 77.33 KB; +2.2 KB for Share helpers + ShareModal).
- [x] No new dependencies (uses native `fetch`, `AbortController`, `URL`).
- [x] No requests to `api.anthropic.com` or any third-party host. Only same-origin GET/HEAD on `/scenarios/<uuid>.json`.
- [ ] Manual smoke test: Export → place in `public/scenarios/<uuid>.json` → restart dev server → open `/scenarios/<uuid>` → verify hydration. Pending user.
- [ ] Manual smoke test: navigate to `/scenarios/<random-uuid>` → "not found" banner shown. Pending user.

## Decisions resolved (from spec §10)

- **Q-007 (host)** → Resolved: `VITE_PUBLIC_HOST` env override, fallback to `window.location.origin`.
- **Q-008 (fork UUID)** → Resolved: explicit "Fork as new scenario" button in ShareModal (option a).
- **Q-009 (auto-retry on 404)** → Resolved: no auto-retry. Explicit notice + manual refresh.

## Next

Phase 5 — Style guide doc (`_docs/style-guide.md`).
