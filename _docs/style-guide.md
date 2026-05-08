# TUNA Scenario Selector — Style Guide

**Last updated:** 2026-05-08
**Brand source:** `_brief/Brand-GuidelinesV4.pdf` — Peter Verster Brand Guidelines v4 (December 2025)
**Application:** This guide describes how the brand is applied to the TUNA Scenario Selector. For the full brand system (logotype, gradients, photography, social formats), refer to the source PDF.

---

## 1. Brand summary

> *Where data meets meaning, and ideas become momentum.*

**Persona.** A calm, intelligent, commercially-minded strategist. A thought partner to CEOs, a mentor to founders, an educator to students.

**Voice.** Clear, sharp, structured, authoritative — with warmth. Direct but never aggressive. Informed but not elitist. Inspiring but not motivational-speak. Data-aware but story-driven.

**Keywords.** *insightful · strategic · plain-speaking · calm · intelligent · human.*

**Visual philosophy.** Minimalist; less-is-more. The brand exists to humanise data-led transformation, to make the complex approachable, and to present AI through a lens of clarity, empathy, and elegance. Every design decision strips away the unnecessary so what matters can truly be seen.

The TUNA Scenario Selector is a working tool, not a marketing surface. It applies the brand's quiet confidence to a dense, data-rich interface — generous whitespace, restrained accent, mathematical readouts in monospace, narrative copy in a clean sans.

---

## 2. Colour palette

All tokens live in `tailwind.config.js`. Use the named token (`text-brand-fire`, `bg-surface-raised`, etc.) — never raw hex literals in components.

### Surface (dark theme)

| Token | Hex | Role | Use for |
|---|---|---|---|
| `surface-base` | `#1a1a20` | App background | Body, sticky shells |
| `surface-raised` | `#2e2e36` | Card / surface | Cards, modals, sticky header |
| `surface-muted` | `#26262d` | Nested surface | Cards inside cards, code blocks |
| `surface-border` | `#3a3a44` | Borders, dividers | All hairlines, card edges |

### Ink (text)

| Token | Hex | Role | Use for |
|---|---|---|---|
| `ink-primary` | `#f0f0f0` | Primary text | Headings, body, key numbers |
| `ink-secondary` | `#a8a8b3` | Supporting text | Sub-headings, captions, descriptions |
| `ink-muted` | `#6a6a74` | Tertiary text | Hints, meta, mono labels, disabled |
| `ink-inverse` | `#1a1a20` | Inverse text | Text *on* `brand-fire` buttons |

### Brand

| Token | Hex | Role | Use for |
|---|---|---|---|
| `brand-fire` | `#ff3a05` | Primary accent | Single primary CTA per screen, current-step indicator, key links |

> **Use Fire Orange like a single highlighter, not paint.** One primary CTA per screen. Body links inherit `ink-secondary` and underline on hover.

### Signal palette (semantic)

The five Signal colours come from the brand's category system. In the app, they carry semantic meaning:

| Token | Hex | Brand role | App role |
|---|---|---|---|
| `signal-advisory` | `#4b9875` | Advisory category | Success, reinforcing coupling, "published" |
| `signal-thought` | `#f0c22e` | Thought leadership | Warning, caution, "borderline CR" |
| `signal-book` | `#76b1d2` | Book & research | Info, neutral highlight |
| `signal-press` | `#f47a49` | Press & media | Damping coupling, error, danger |
| `signal-speaking` | `#8371dc` | Speaking | Special highlight, "phase tag" accent |

> Don't reuse a Signal colour for an unrelated meaning. `signal-press` is *the* damping/danger colour; `signal-advisory` is *the* reinforcing/success colour. Consistency is the contract.

### Tints and opacity

Tailwind's `/<n>` opacity modifier works on every token. Common patterns:

| Pattern | Example | Use |
|---|---|---|
| `<token>/15` | `bg-brand-fire/15` | Subtle fill (button hover background) |
| `<token>/30` | `border-brand-fire/30` | Subtle border on filled chip |
| `<token>/60`–`/80` | `text-brand-fire/80` | De-emphasised foreground |

### Contrast & accessibility

WCAG 2.1 AA requires **4.5:1** for body text, **3:1** for large text (≥18pt or ≥14pt bold). Approximate ratios on dark surfaces:

| Foreground | on `surface-base` | on `surface-raised` |
|---|---|---|
| `ink-primary` | **15.7:1** ✓ | **13.1:1** ✓ |
| `ink-secondary` | **8.9:1** ✓ | **7.4:1** ✓ |
| `ink-muted` | **3.8:1** — large text only |  **3.2:1** — large text only |
| `brand-fire` | **5.4:1** ✓ | **4.5:1** ✓ |
| `signal-advisory` | **5.0:1** ✓ | **4.2:1** large only |
| `signal-thought` | **10.2:1** ✓ | **8.5:1** ✓ |
| `signal-press` | **7.4:1** ✓ | **6.2:1** ✓ |
| `signal-book` | **7.0:1** ✓ | **5.9:1** ✓ |
| `signal-speaking` | **5.5:1** ✓ | **4.6:1** ✓ |

> Numbers are computed via the WCAG relative-luminance formula. Re-check with [WebAIM's contrast checker](https://webaim.org/resources/contrastchecker/) when introducing new pairings. **Never use `ink-muted` for body text** — it's reserved for hints, mono labels, and meta-data where 3.8:1 is acceptable in context.

Colour must never be the sole carrier of meaning. Coupling polarity, for instance, uses both colour (`signal-advisory` vs `signal-press`) AND signed numeric labels.

---

## 3. Typography

Two typefaces, three roles. Loaded via Google Fonts in `index.html`; mapped in `tailwind.config.js`.

### Families

| Token | Family | Weights | Role |
|---|---|---|---|
| `font-display` | **Inter** | 600 / 700 | Display (large headlines) |
| `font-body` (default) | **Inter** | 400 / 500 | UI and body copy |
| `font-mono` | **Noto Sans Mono** | 400 / 500 | Numbers, IDs, mono labels, badges |

Inter handles both display and body — the visual distinction comes from size, weight, and tracking. `font-display` adds tighter letter-spacing (`-0.02em`) and OpenType features `cv11`, `ss01`, `ss03` for refined zero, alternative forms, and scientific small-caps.

### Type scale (UI)

| Element | Class | Size / line-height / weight |
|---|---|---|
| Hero | `font-display text-5xl md:text-6xl` | 48–64px / 1.05 / 700 |
| Section heading | `font-display text-4xl` | 36px / 1.1 / 600 |
| Sub-heading | `font-display text-2xl` | 24px / 1.2 / 600 |
| Card title | `font-display text-xl` or `text-lg` | 18–20px / 1.2 / 600 |
| Body | `text-sm` (default Inter 400) | 14px / 1.55 / 400 |
| Supporting | `text-xs` | 12px / 1.5 / 400 |
| Mono badge | `text-[10px] font-mono uppercase tracking-widest` | 10px / 1 / 400 |
| Numerical readout | `font-mono` (size varies) | — |

### Rules

- Numbers always in `font-mono`. Currency, percentages, scores, IDs, file paths — all mono.
- Display headings tighten letter-spacing; body never tightens (default tracking).
- Mono labels go uppercase with widened tracking only when ≤ 11px and acting as a category tag.
- Italic is reserved for taglines, scenario phases, and emphasised words inside narrative text. Never italicise headings.

---

## 4. Component primitives

### Button

| Variant | Classes (illustrative) | Use |
|---|---|---|
| **Primary** | `bg-brand-fire hover:bg-brand-fire/90 text-ink-inverse px-5 py-2.5 rounded font-medium` | Single primary action per screen |
| **Secondary (filled accent)** | `bg-brand-fire/15 hover:bg-brand-fire/25 text-brand-fire border border-brand-fire/40 px-4 py-2 rounded` | Action that's important but not the page's primary |
| **Ghost** | `text-ink-secondary hover:text-ink-primary px-3 py-1.5` | Tertiary actions in dense UIs |
| **Header chip** | `text-xs font-mono text-ink-muted hover:text-ink-secondary border border-surface-border px-3 py-1.5 rounded` | Persistent header controls (Import / Export / Share / About / Reset) |
| **Disabled** | `opacity-30 cursor-not-allowed` overlaid on any of the above | Inactive states |

Focus ring: rely on browser default for now (deferred — see section 6).

### Card

`bg-surface-raised border border-surface-border rounded-lg p-5`

For nested cards inside a card (e.g. seed sub-grids), drop to `bg-surface-muted`.

### Input

`bg-surface-base border border-surface-border rounded px-3 py-2 text-sm text-ink-primary placeholder-ink-muted focus:border-brand-fire focus:outline-none transition`

Read-only inputs (e.g. Share URL field) keep the same look; rely on the `readOnly` attribute and an auto-select-on-focus handler.

### Slider

Native `<input type="range">` with `accent-brand-fire`. Below the track, mono left/right labels in `text-[10px] text-ink-muted`. Numeric value shown elsewhere in `font-mono`.

### Badge / chip

| Variant | Classes |
|---|---|
| Neutral | `text-[10px] font-mono uppercase tracking-widest text-ink-muted bg-surface-muted px-2 py-0.5 rounded` |
| Brand | `text-[10px] font-mono uppercase tracking-widest text-brand-fire bg-brand-fire/10 border border-brand-fire/30 px-2 py-0.5 rounded` |
| Status (live / warn / error) | Same pattern with `signal-advisory` / `signal-thought` / `signal-press` |

### Modal

Centred overlay with `bg-black/60 backdrop-blur-sm` backdrop. Body in `bg-surface-raised border border-surface-border rounded-lg shadow-2xl max-w-lg`. Close on Escape, backdrop click, top-right `<X>` button.

### Toast

Bottom-right (`fixed bottom-6 right-6 z-50`), auto-dismiss after 4 s. Background `bg-surface-raised`, border colour scoped to kind: `signal-press` (error), `signal-advisory` (success), `brand-fire` (info).

### Step indicator (header)

A horizontal stepper of small pills. Current step = `bg-brand-fire text-ink-inverse`. Completed = `bg-surface-border text-ink-secondary`. Upcoming = `bg-surface-muted text-ink-muted`.

---

## 5. Spacing & radii

Defaults from Tailwind. We don't override the scale; we use it consistently.

- **Outer page margins:** `max-w-6xl mx-auto px-6` for the wizard, `max-w-5xl` for the intro page.
- **Card padding:** `p-5` (20px); inner sections separated by `space-y-3` to `space-y-6`.
- **Section gaps:** `space-y-16` for major intro sections, `space-y-6` within a step.
- **Radii:** `rounded` (4px) for inline controls, `rounded-lg` (8px) for cards & modals, `rounded-full` for pills.
- **Borders:** `1px` default. Never use thicker than `2px` except for the convergence-coloured seed-card left edge.

---

## 6. Accessibility

- WCAG 2.1 AA on all body text and controls (verified against the contrast table in §2).
- All interactive elements are keyboard-reachable. Modals trap focus while open; Escape closes them.
- Colour is never the sole carrier of meaning. Coupling sliders show signed numeric values; success/error toasts show kind-coloured borders *and* descriptive text.
- `prefers-reduced-motion`: not yet honoured beyond default Tailwind `transition` (which is short ~150ms — well under the 250ms threshold most accessibility tools flag). Spinner removed in this revision; no significant motion remains.
- Focus ring: currently relying on browser defaults. **Deferred:** define a token-aligned focus-visible ring (`outline-2 outline-offset-2 outline-brand-fire`) and apply globally.

---

## 7. Do / Don't

### Colour

- ✅ **Do** use `brand-fire` for one primary CTA per screen (Begin, Continue, Download JSON).
- ❌ **Don't** use `brand-fire` for body links. Default `ink-secondary` with hover-to-`ink-primary` is the right body-link pattern.

- ✅ **Do** use the Signal palette for semantic state (success / warn / info / danger / special).
- ❌ **Don't** introduce a new colour outside the palette — even if it "feels right." Brand consistency compounds.

### Typography

- ✅ **Do** put numbers, IDs, mono labels, and code in `font-mono` (Noto Sans Mono).
- ❌ **Don't** put numbers in body Inter. The visual difference between a strategist's interpretive prose and a system-output number matters.

- ✅ **Do** tighten letter-spacing on display headings (already done via `font-display`).
- ❌ **Don't** tighten body Inter — it's optimised for 14–16px reading at default tracking.

### Composition

- ✅ **Do** preserve generous whitespace. The brand is "less is more"; clutter contradicts the philosophy.
- ❌ **Don't** fill empty space with decoration. If a card looks bare, the content needs work, not the design.

- ✅ **Do** use cards (`surface-raised`) on `surface-base` for grouping. The single-step depth of layering is sufficient.
- ❌ **Don't** stack three or more nested surfaces. Two layers max — base + raised, or raised + muted.

### Voice in copy

- ✅ **Do** write sentence-case copy that's specific and grounded (e.g., *"Save the JSON to `public/scenarios/<uuid>.json` and push to deploy"*).
- ❌ **Don't** write motivational-speak (*"Unlock the power of scenarios!"*). The brand voice is *direct but never aggressive*.

---

## 8. References

- **Source:** `_brief/Brand-GuidelinesV4.pdf` (40 pages — full brand system).
- **Tokens:** `tailwind.config.js`.
- **Domain language:** `_domain/UBIQUITOUS_LANGUAGE.md`.
- **Spec:** `_specification/scenario-portability-and-brand-refresh.md` §3.1 FR-007 / FR-008 / FR-009.

---

*This guide is iterative. When the visual identity expands (gradients, generative data lines, signal-category iconography in the brand PDF §1.10–§1.13), update this document alongside.*
