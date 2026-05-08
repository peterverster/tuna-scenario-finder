# Phase 2 — AI Prompt Export

**Spec:** `_specification/scenario-portability-and-brand-refresh.md`
**Date:** 2026-05-08
**Status:** Complete; build green

## What changed

- `generateScenario(idx)` now builds the prompt and triggers a `tuna-prompt-<slug>.txt` Blob download. Removed the in-browser `fetch("https://api.anthropic.com/...")`.
- Slug derivation: kebab-cased `seedNames[idx]` if set, else `seed-<idx+1>`.
- Removed dead code:
  - `parseScenarioMarkdown` function (62 lines).
  - `MarkdownProse`, `renderInlineMarkdown` helpers (~50 lines).
  - State: `generatedScenarios`, `generatingIdx` (kept `generationErrors`, repurposed for build-prompt errors).
  - Lucide icons: `Wand2`, `Loader2`, `RefreshCw`.
- `AIScenarioPanel` collapsed from a multi-state component (idle / generating / error / rendered scenario) into a single "Download AI prompt" button + error line.
- Lucide imports now include `Download`, `Share2`, `Copy`, `AlertTriangle` for upcoming phases.

## Quality gate

- [x] `npm run build` succeeds, no warnings.
- [x] Bundle: 74.42 KB gzipped (was 76.04 KB; -1.6 KB from removed AI-rendering code).
- [x] No references to `anthropic.com` in code paths (one comment-only mention explaining what was replaced).
- [x] No references to dropped state / functions / icons in JSX.
- [ ] Manual smoke test: open Step 10, click "Download AI prompt" on a seed, verify `.txt` downloads and contains the prompt — pending user review.

## Next

Phase 3 — Project schema, UUID, Export/Import.
