# Bounded Contexts — TUNA Scenario Finder

**Last Updated:** 2026-05-08

This document maps the bounded contexts of the system and their integration boundaries. The TUNA Scenario Finder is a **single-context** application, but the surrounding methodological and product landscape contains adjacent contexts the tool deliberately does *not* cross. Understanding those boundaries is essential for keeping the model focused.

---

## Context Map

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│   ┌──────────────────────────────────────────────────────────────┐   │
│   │                                                              │   │
│   │       Strategic Scenario Generation (this system)            │   │
│   │                                                              │   │
│   │   • Project (aggregate root)                                 │   │
│   │   • Factor / Criterion / FactorState / ScenarioSeed          │   │
│   │   • AHP + Morphological + Coupling + Arrows pipeline         │   │
│   │   • Output: small set of named, phase-tagged scenario seeds  │   │
│   │                                                              │   │
│   └─────┬─────────────┬─────────────┬─────────────┬──────────────┘   │
│         │             │             │             │                  │
│   ┌─────▼─────┐ ┌─────▼─────┐ ┌─────▼─────┐ ┌─────▼──────┐           │
│   │  Browser  │ │  Browser  │ │   File    │ │ (Optional) │           │
│   │   Local   │ │ IndexedDB │ │ Download  │ │ Telemetry  │           │
│   │  Storage  │ │           │ │  (Blobs)  │ │   Sink     │           │
│   └───────────┘ └───────────┘ └───────────┘ └────────────┘           │
│                                                                      │
│              ─── Integrated infrastructure adapters ───              │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘

   ╳    ─── Boundary (no integration in v1) ───   ╳

┌────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│ Narrative Scenario │  │ Strategy Wind-      │  │ Multi-User           │
│ Authoring          │  │ Tunnelling          │  │ Collaboration        │
│ (humans + LLMs)    │  │ (Oxford OSPA next   │  │ (real-time           │
│                    │  │  step, out of scope)│  │  co-editing)         │
└────────────────────┘  └─────────────────────┘  └─────────────────────┘
```

---

## Inside the Context: Strategic Scenario Generation

### Purpose

Transform a strategist's qualitative judgements about driving forces into a small set of structurally-distinct, internally-coherent scenario seeds with temporal anchoring, defended by an auditable chain of judgement.

### Responsibilities (Inside the Boundary)

- Capture and persist factor and criterion definitions.
- Capture pairwise preference judgements (Saaty intensities) and surface internal contradictions (CR).
- Synthesise global factor priorities and select top-N for the morphological stage.
- Capture arrow profiles (velocity, proximity, path-dependency, consequence) per factor.
- Capture signed coupling and directional triggers between factors.
- Generate the morphological seed space exhaustively up to a 200,000-configuration cap.
- Score each seed on importance / coherence / convergence and produce a combined score.
- Filter and select a diverse seed set via greedy farthest-first.
- Estimate arrival windows from per-factor velocities.
- Allow user naming and bifurcation-phase tagging of selected seeds.
- Persist the entire Project aggregate locally.
- Export the project to JSON / CSV / PDF.

### Out of Scope (Outside the Boundary)

Per spec section 14, the following are deliberately excluded. They represent adjacent bounded contexts that may be *integrated with* but never *absorbed into* the scenario-generation context:

- **Narrative scenario authoring** — writing the story, identifying signals, developing strategic implications. The tool produces seeds; humans (with optional LLM assistance) write the scenarios.
- **Strategy wind-tunnelling** — testing organisational strategies against the generated seed set (Oxford OSPA's downstream activity). Would introduce a `Strategy` aggregate and a separate context.
- **Pareto-optimal strategy frontier** — multi-objective optimisation over (expected value, robustness) for strategies. Belongs in the wind-tunnelling context.
- **Full per-pair-state CCA** — currently approximated by aggregate signed coupling. Adding it would not create a new context but would substantially enlarge this one.
- **NSGA-II seed search** — genetic-algorithm exploration when `K^N > 200,000`. Future addition within this context.
- **Multi-user collaboration** — real-time co-editing. Requires a backend and a sync/conflict context.
- **Server-side persistence** — currently client-only. Would introduce a sync context.
- **LLM narrative drafting** — explicitly a separate context.

---

## Integration Patterns

### Inside ↔ Adapters (Driven side)

The scenario-generation context exposes **outbound ports** that adapters implement. This is a classic **Conformist** / **Adapter** integration: the context defines the interface, the adapter conforms.

| Outbound Port | Adapters | Pattern |
|---|---|---|
| `ProjectRepository` | `LocalStorageProjectRepository`, `IndexedDBProjectRepository` | Repository |
| `ExportService` | `JSONExportService`, `CSVExportService`, `PDFExportService` | Strategy |
| `TelemetryService` | (optional, no-op default) | Null Object / Strategy |

The context never depends on the adapter; adapters never bypass the port.

### UI ↔ Inside (Driving side)

The React UI calls into the context through a single **inbound port** — `ProjectFacade`. This is a **Façade** pattern: the UI sees one coherent surface; the use cases behind it are decoupled.

The UI works exclusively with **DTOs**, never with domain entities. This is a **Anticorruption Layer** — DTOs prevent the UI's representational concerns (form state, validation messages, focus tracking) from leaking back into the domain.

### Future Integrations (When Adjacent Contexts Are Added)

If/when adjacent contexts are introduced, the recommended integration patterns are:

| Adjacent Context | Recommended Pattern | Why |
|---|---|---|
| Strategy Wind-Tunnelling | **Shared Kernel** for `Project` + `ScenarioSeed`; new aggregate `Strategy` in the new context | Wind-tunnelling needs read-only access to seeds; separate aggregate keeps consistency boundaries clean |
| Narrative Authoring (LLM) | **Open Host Service** — JSON export schema as the contract | Lets multiple narrative tools interoperate without coupling |
| Multi-User Collaboration | **Customer/Supplier** — sync context owns the wire format; this context provides Project snapshots | Conflict resolution lives in the sync context |
| Server-Side Persistence | New adapter conforming to `ProjectRepository` | Ports & Adapters absorbs this without context change |

---

## Why a Single Context?

It's worth being explicit about why this isn't decomposed into multiple contexts (e.g. "AHP context", "morphological context", "arrows context"):

1. **Single workflow.** All operations contribute to one outcome — a curated seed set. There is no point at which the system "hands off" to another responsible party with a different vocabulary.
2. **Single ubiquitous language.** Strategists use AHP terms, morphological terms, and OSPA terms in the same sentence. Splitting would force translation between contexts that the human user doesn't translate between.
3. **Single aggregate root.** All state is captured in one `Project`. There is no independent lifecycle for criteria-weighting that survives without the rest.
4. **Single team / single user.** There is no organisational seam that would benefit from a context boundary.

The pipeline *stages* (AHP → synthesis → arrows → coupling → seeds) are separated through **layered domain services and use cases**, not through bounded contexts. This is the right granularity for code modularity within a single context.

---

## Shared Kernel

Currently none — there is no other bounded context to share with. If wind-tunnelling is added, the shared kernel would minimally include:

- `Project` (read-only access)
- `ScenarioSeed` (read-only, including `SeedScore`, `ArrivalWindow`, `BifurcationPhase`)
- `Factor` and `FactorState` (so strategies can be expressed in factor-state language)

Coupling matrices, pairwise matrices, and arrow profiles would *not* be shared — they're internal to seed generation.

---

*This document is generated by the `/ddd` command. Regenerate to update; do not edit manually.*
