# Phase 3 — Project Schema, UUID, Export/Import

**Spec:** `_specification/scenario-portability-and-brand-refresh.md`
**Date:** 2026-05-08
**Status:** Complete; build green

## What changed

### New constants (in CONSTANTS section)
- `SCHEMA_VERSION = "tuna-scenario/v1"`
- `SCENARIO_PATH_PREFIX = "/scenarios/"`
- `SCENARIO_FETCH_TIMEOUT_MS = 5000`
- `PUBLISH_HEAD_TIMEOUT_MS = 1000`
- `UUID_REGEX` (validates UUID v4)

### New PERSISTENCE section
- `generateUuid()` — `crypto.randomUUID()` with `Math.random` fallback (warns once if used).
- `isValidUuid(s)` — UUID v4 regex test.
- `serialiseVetoes(set)` — Set → sorted array.
- `serializeProject(state)` — produces canonical `tuna-scenario/v1` JSON object.
- `deserializeProject(parsed)` — full FR-001 validation: schema, scenarioId, required keys, matrix shape, coupling symmetry, seed-space cap. Returns `{ ok, error?, state? }`.
- `triggerJsonDownload(filename, jsonObj)` — Blob + `<a download>` + revoke.
- `readJsonFile(file)` — `FileReader` → parsed JSON Promise.

### New SHARED UI primitives
- `Modal` — backdrop, ESC close, click-outside close, focus to children.
- `Toast` — bottom-right, auto-dismiss 4s, kind ∈ {info, success, error}.

### Root component (`TUNAScenarioTool`) changes
- New state: `scenarioId` (lazy UUID), `projectName`, `importError`, `importConfirmFile`, `toast`.
- New helpers: `ensureScenarioId()`, `collectState(id)`, `applyHydratedState(s)`, `handleExport()`, `handleImportClick()`, `runImport(file)`.
- `handleReset()` clears `scenarioId` and `projectName` along with everything else.
- Header gets new buttons: **Import** (always visible) and **Export** (always visible). Both styled to match the existing About/Reset chips.
- Confirmation modal renders when import is requested mid-session (i.e., when a `scenarioId` already exists).
- Toast renders at the root.

### Removed
- Nothing in this phase (Phase 2 already removed the AI-render code).

## File changes
- `tuna-scenario-tool.jsx` — additions only; no rewrites of existing logic.

## Quality gate
- [x] `npm run build` succeeds, no warnings.
- [x] Bundle: 77.33 KB gzipped (was 74.42 KB; +3 KB for Modal/Toast/persistence helpers).
- [x] No new dependencies (uses native `crypto.randomUUID`, `FileReader`, Blob).
- [ ] Manual smoke test (round-trip): full wizard run → Export → import the file in a fresh tab → identical seeds — pending user review.

## Notes / decisions
- Atomic apply: `applyHydratedState` calls all setters synchronously (React 18 batches them), so partial loads aren't possible.
- Filename pattern: `<uuid>.json` exactly (no slug, no date), matching FR-002 spec — this is the same path the strategist will commit to `public/scenarios/`.
- Validation rejects on:
  - Non-`tuna-scenario/v1` schema
  - Missing/invalid `scenarioId`
  - Non-square matrices
  - Non-symmetric coupling
  - Imported `K^N > 200000` (BR-007)
- Validation tolerates: missing `meta.projectName` (defaults to "Untitled"), missing `documents` array (defaults to `[]`).
- Pairwise-matrix Saaty-intensity range check is deliberately not enforced strictly on import; out-of-range values fall to AHP geometric-mean which still computes (but yields meaningless priorities). Decision: trust files we wrote; future schemas may tighten.

## Deferred to later phases
- Intro page "project name" input — will add in Phase 4 alongside the Share modal (which surfaces the name).
- Lazy scenarioId-on-edit — currently lazy on Export/Share only, which is what the spec specifies.

## Next
Phase 4 — UUID URL share, ShareModal, `/scenarios/<uuid>` path hydration, `public/scenarios/` directory.
