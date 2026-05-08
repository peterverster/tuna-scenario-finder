# Phase 5 — Style Guide Document

**Spec:** `_specification/scenario-portability-and-brand-refresh.md`
**Date:** 2026-05-08
**Status:** Complete

## What changed

- New file: `_docs/style-guide.md` (~250 lines).

## Sections

1. Brand summary (1 paragraph from PDF: persona, voice, keywords).
2. Colour palette: every token with hex, role, and a contrast table against `surface-base` and `surface-raised` (WCAG 2.1 AA-checked).
3. Typography (Inter + Noto Sans Mono): families, tokens, type scale, rules.
4. Component primitives: button (5 variants), card, input, slider, badge, modal, toast, step indicator.
5. Spacing & radii — codified defaults.
6. Accessibility notes — keyboard, focus (deferred), motion (no significant motion remains), colour-not-sole-carrier rule.
7. Do / Don't — paired examples for colour, typography, composition, and voice.

## Quality gate

- [x] Document is complete per FR-009 sections.
- [x] Every brand colour pairing has a calculated contrast ratio.
- [x] Cross-references to `_brief/Brand-GuidelinesV4.pdf`, `tailwind.config.js`, `_domain/UBIQUITOUS_LANGUAGE.md`, and the spec.

## Notes

- Numbers in the contrast table are computed via the WCAG luminance formula. They're approximate (rounded to 1 decimal) — the doc tells future readers to verify with WebAIM's checker before introducing new pairings.
- Focus ring is flagged as deferred. Browser defaults are passable; a token-aligned `outline-2 outline-brand-fire` focus-visible style is a small follow-up.

## Feature complete

All five phases of the spec are implemented and build-green.
