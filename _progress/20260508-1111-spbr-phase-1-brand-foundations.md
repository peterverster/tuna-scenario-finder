# Phase 1 — Brand Foundations

**Spec:** `_specification/scenario-portability-and-brand-refresh.md`
**Date:** 2026-05-08
**Branch:** `main`
**Status:** Complete; build green

## What changed

| File | Change |
|---|---|
| `tailwind.config.js` | Added `brand`, `signal`, `surface`, `ink` colour tokens; replaced `JetBrains Mono` with `Inter` + `Noto Sans Mono` font families. |
| `index.html` | Swapped Google Fonts URL from JetBrains Mono → Inter + Noto Sans Mono; updated `<title>` to `TUNA Scenario Selector — Peter Verster`; added `<meta description>`; body class now `bg-surface-base text-ink-primary`. |
| `src/index.css` | Body font set to Inter with OpenType features. |
| `tuna-scenario-tool.jsx` | Inline `fontStack` block reduced to `font-display`/`font-body` style hooks (Inter loaded via `index.html`); 1,164 line-edits sweeping `slate-*` / `amber-*` / `emerald-*` / `rose-*` Tailwind classes to `surface-*` / `ink-*` / `brand-fire` / `signal-advisory` / `signal-press` brand tokens; SVG `fontFamily` and slate-tone `fill` hex literals updated. |

## Token mapping applied

| Old | New |
|---|---|
| `slate-950` | `surface-base` (`#1a1a20`) |
| `slate-900` | `surface-raised` (`#2e2e36` — brand Slate) |
| `slate-800` / `slate-700` | `surface-border` (`#3a3a44`) |
| `slate-600` / `slate-500` | `ink-muted` (`#6a6a74`) |
| `slate-400` / `slate-300` / `slate-200` | `ink-secondary` (`#a8a8b3`) |
| `slate-100` / `slate-50` | `ink-primary` (`#f0f0f0` — brand Light) |
| `amber-500` / `amber-400` | `brand-fire` (`#ff3a05` — brand Fire Orange) |
| `amber-300` | `brand-fire/80` |
| `emerald-500` / `emerald-400` | `signal-advisory` (`#4b9875`) |
| `rose-500` / `rose-400` | `signal-press` (`#f47a49`) |
| SVG `fill="#94a3b8"` / `#cbd5e1` | `fill="#a8a8b3"` (ink-secondary) |
| SVG `fill="#64748b"` / `#475569` | `fill="#6a6a74"` (ink-muted) |
| `fontFamily="JetBrains Mono"` | `fontFamily="Noto Sans Mono"` |
| `fontFamily="IBM Plex Sans"` / `Fraunces` | `fontFamily="Inter"` |

## Quality gate

- [x] `npm run build` succeeds, no warnings.
- [x] Bundle: 76.04 KB gzipped (budget: 260 KB) — unchanged vs before sweep.
- [x] No `slate-*` / `amber-*` / `emerald-*` / `rose-*` Tailwind classes remain in JSX.
- [x] No legacy font names (`Fraunces`, `IBM Plex Sans`, `JetBrains Mono`) remain in JSX or HTML.
- [ ] Visual smoke test in browser — pending user review.

## Notes / decisions

- Kept the dark-theme baseline; brand tokens map onto a darker `surface-base` (`#1a1a20`) than brand Slate itself, with brand Slate as the raised-surface colour.
- `signal-press` (peachy `#f47a49`) is used for danger/error/damping semantics. Visually distinct from `brand-fire` (saturated red-orange) by saturation + lightness.
- `crypto.randomUUID` not yet used — that lands in Phase 3.

## Next

Phase 2 — restore AI prompt export as `.txt` Blob download (drop the `fetch` to `api.anthropic.com`).
