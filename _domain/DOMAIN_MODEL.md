# Domain Model — TUNA Scenario Finder

**Last Updated:** 2026-05-08
**Version:** 0.1.0
**Source of truth:** `_brief/tuna-scenario-tool-spec.md`

---

## Executive Summary

The TUNA Scenario Finder is a single-page application that helps strategists generate **scenario seeds** for futures characterised by **T**urbulence, **U**npredictability, **N**ovelty, and **A**mbiguity (Oxford OSPA terminology). It is not a forecasting tool: it produces structured starting positions for narrative scenario development, not finished scenarios.

The domain integrates four methodological traditions into a single deterministic pipeline:

1. **Analytic Hierarchy Process (Saaty 1977)** — pairwise comparisons of criteria and factors yield defensible global priority weights.
2. **Morphological Analysis (Zwicky 1969, Ritchey 2011)** — exhaustive enumeration of factor-state configurations.
3. **Aggregate-coupling Cross-Consistency Assessment** — signed coupling between factor pairs filters incoherent configurations.
4. **Arrows of Time (Oxford OSPA)** — velocity, proximity, and path-dependency anchor seeds in time and identify bifurcation moments.

The output is a small set (typically four) of **scenario seeds** that are mathematically distinct, internally coherent, anchored in time, and defended by an auditable chain of judgement.

The entire computation runs client-side; persistence is browser-local; export is via downloadable Blobs. The domain is pure and replaceable independently of the UI.

> ⚠️ **Implementation status:** the current codebase (`tuna-scenario-tool.jsx`, ~2,957 lines) is a single React component containing the full pipeline inline — domain math, application state, and presentation are not yet separated. The model below describes the **target** hexagonal architecture per `_brief/tuna-scenario-tool-spec.md`. See `ARCHITECTURE.md` for the gap analysis.

---

## Bounded Contexts

This is a single-context system. There is one cohesive domain — *strategic scenario generation* — and the entire vocabulary belongs to it. See `BOUNDED_CONTEXTS.md` for the context map and integration boundaries.

### Strategic Scenario Generation

- **Purpose:** Transform a strategist's qualitative judgements about driving forces into a small set of structurally-distinct, internally-coherent scenario seeds with temporal anchoring.
- **Entities:** Project (aggregate root), Factor, Criterion, FactorState, ScenarioSeed.
- **Key Operations:** Define factors → weight criteria → score factors → synthesize global weights → assess arrows → define states → assess coupling → generate and select seeds → name and phase-tag.
- **Boundaries:** Inside — the methodology itself (AHP, morphological space, scoring, selection). Outside — narrative scenario writing, strategy wind-tunnelling, multi-user collaboration, server persistence, LLM narrative drafting (all explicitly out of scope).

---

## Core Domain Concepts

### Entities

#### Project (Aggregate Root)

- **Purpose:** Represents a complete scenario analysis session and is the consistency boundary for all downstream computation.
- **Identity:** Unique `id` plus `createdAt` / `updatedAt` timestamps.
- **Lifecycle:**
  ```
  Created → FactorsDefined → CriteriaDefined → CriteriaWeighted →
  FactorsScored → Synthesized → ArrowsAssessed → StatesDefined →
  CouplingAssessed → SeedsGenerated → SeedsNamedAndTagged
  ```
  Steps are sequential but the user may revisit any earlier step; downstream artefacts are invalidated and recomputed lazily.
- **Invariants:**
  - At least 3 factors before synthesis.
  - At least 2 criteria.
  - All pairwise matrices reciprocal (`A[i][j] = 1/A[j][i]`).
  - CouplingMatrix is symmetric with zero diagonal; values in `[-9, 9]`.
  - TriggerMatrix is asymmetric boolean with zero diagonal.
  - Seed-space cardinality `K^N ≤ 200,000`; otherwise generation refuses.
- **Factory:** `Project.create(name)` produces a new aggregate with the default factor and criteria sets pre-populated (see Appendix A of the spec).
- **Location (target):** `src/domain/entities/Project.ts`.

#### Factor

- **Purpose:** A driving force in the strategic environment whose future state is uncertain and whose state shapes the scenario.
- **Identity:** `id`, `name`, `description`.
- **Carries:** An `ArrowProfile` (assigned in step 6) and per-factor state-label overrides.
- **Examples (current default fixture — AI economy):** AI Capability Progress Rate, RL Paradigm Replacement, ASML / EUV Tool Production, China-West Divergence, AGI Economic Integration Mode.

#### Criterion

- **Purpose:** A dimension along which factors are evaluated to determine which deserve a seat in the morphological space.
- **Identity:** `id`, `name`, `description`.
- **Examples (default):** Impact Magnitude, Uncertainty, Decision Relevance, Time Horizon Fit, Causal Independence.

#### FactorState

- **Purpose:** A discrete level a factor can take in a scenario seed (typically Low / Mid / High at -1 / 0 / +1, expandable to 5 levels).
- **Identity:** Compound key — `(factorId, stateIndex)` for label overrides; otherwise the global state-palette index.
- **Invariants:** Numeric values are global across factors (so coupling math is comparable); labels can be overridden per factor for narrative clarity.

#### ScenarioSeed

- **Purpose:** A fully-specified configuration of factor-state assignments representing a candidate starting position for narrative development.
- **Identity:** Position in a derived seed set (no persistent identity beyond the Project). Optional user-assigned `name` and `bifurcationPhase` once curated.
- **Carries:** Seed vector `S ∈ {0..K-1}^N`, `SeedScore` (importance, coherence, convergence), `ArrivalWindow`, optional `BifurcationPhase`.
- **Invariants:** Length equals carried-forward factor count; each entry in `[0, K-1]`.

---

### Value Objects

All value objects are immutable. Mutation is expressed by returning a new instance.

#### SaatyIntensity

- **Purpose:** A discrete value on Saaty's 1–9 ratio scale (with reciprocals).
- **Domain:** `{1/9, 1/8, ..., 1/2, 1, 2, ..., 8, 9}`.
- **Validation:** Reject values outside the discrete set.

#### PairwiseMatrix

- **Purpose:** Square matrix of `SaatyIntensity` values capturing pairwise comparisons.
- **Invariants:** `A[i][j] = 1 / A[j][i]`; `A[i][i] = 1`.
- **Operations:** `set(i, j, intensity) → PairwiseMatrix`; `priorityVector() → PriorityVector`; `consistencyRatio() → ConsistencyRatio`.

#### PriorityVector

- **Purpose:** Probability vector of priorities derived via geometric-mean approximation of the principal eigenvector.
- **Invariant:** `Σ w[i] = 1 ± 1e-9`; all `w[i] ≥ 0`.

#### ConsistencyRatio

- **Purpose:** Saaty's CR — measures internal contradiction in pairwise judgements.
- **Classification:** `isConsistent()` (CR ≤ 0.10) / `isBorderline()` (0.10 < CR ≤ 0.15) / `isInconsistent()` (CR > 0.15).
- **Random Index table:** Hardcoded for n = 1..15.

#### ArrowProfile

- **Purpose:** A factor's temporal signature — encodes the *red* arrow (contextual future arriving) and the *blue* arrow (past catching up).
- **Attributes:** `velocity ∈ [0,1]`, `proximity ∈ [0,1]`, `pathDep ∈ [0,1]`, `consequence ∈ [-1,1]`.
- **Method:** `criticality() = velocity · proximity · (0.5 + 0.5 · pathDep)`.
- **Note:** `consequence` is preserved for narrative annotation only — it does not enter scoring.

#### CouplingMatrix

- **Purpose:** Signed pairwise interaction strength between factors.
- **Domain:** `M[i][j] ∈ [-9, 9]`. Positive = reinforcing (factors trend together); negative = damping (factors oppose).
- **Invariants:** Symmetric (`M[i][j] = M[j][i]`); zero diagonal.

#### TriggerMatrix

- **Purpose:** Directional causal triggers (factor A's extreme state pushes factor B).
- **Domain:** Boolean.
- **Invariants:** Asymmetric; zero diagonal.

#### SeedScore

- **Purpose:** Triple of derived scores characterising a seed.
- **Attributes:** `importance ∈ [0,1]`, `coherence ∈ [0,1]`, `convergence ∈ [0,1]`.
- **Combined:** `score = ((1 - φ) · importance + φ · convergence) · coherence` where `φ ∈ [0,1]` is the user-controlled convergence focus.

#### ArrivalWindow

- **Purpose:** Temporal envelope for when the seed's qualifying factors arrive at non-trivial states.
- **Attributes:** `min`, `median`, `max` in years, plus per-factor arrival years.
- **Default:** `(HORIZON_YEARS, HORIZON_YEARS, HORIZON_YEARS)` when no factor qualifies (HORIZON_YEARS = 15).

#### BifurcationPhase

- **Purpose:** Narrative tag indicating where on the bifurcation the seed sits.
- **Domain:** `Pre | Mid | Post | Steady` (enum).

---

### Aggregates

#### Project Aggregate

- **Root:** `Project` entity.
- **Children:** All Factors, Criteria, FactorStates, all matrices (criteria pairwise, per-criterion factor pairwise, coupling, trigger), arrow profiles, generated and selected ScenarioSeeds.
- **Consistency boundary:** Everything inside is loaded, mutated, and saved as one unit. The matrices reference factors and criteria by id; integrity is enforced at save time.
- **Invariants enforced at the aggregate root:**
  - Carried-forward factor list is consistent with the synthesis output.
  - Coupling and trigger matrices have dimension equal to the carried-forward factor count.
  - Selected seeds reference valid state indices for the current state palette.

There are no other aggregates. The Project is the only persistence unit.

---

### Domain Services

Stateless functions or pure service classes that operate on domain objects without holding state.

#### AHPCalculator

- **Responsibility:** Compute `PriorityVector` and `ConsistencyRatio` from a `PairwiseMatrix`.
- **Method:** Geometric-mean approximation of the principal eigenvector; `λ_max` via `(1/n) · Σ_i (Σ_j A[i][j] · w[j]) / w[i]`.
- **Dependencies:** None (pure math).
- **Location:** `src/domain/services/AHPCalculator.ts`.

#### FactorWeightSynthesizer

- **Responsibility:** Combine criterion weights with per-criterion factor priorities to produce global factor weights `W[i] = Σ_j c[j] · p[j][i]`. Carries forward the top-N and re-normalises.
- **Dependencies:** `PriorityVector` for criteria and per-criterion factor matrices.
- **Location:** `src/domain/services/FactorWeightSynthesizer.ts`.

#### MorphologicalSpaceGenerator

- **Responsibility:** Generate the seed vector for each index in `[0, K^N)` via base-K decomposition. Refuses generation when `K^N > 200,000`.
- **Dependencies:** Carried-forward factor count `N` and state count `K`.
- **Location:** `src/domain/services/MorphologicalSpaceGenerator.ts`.

#### SeedScorer

- **Responsibility:** Compute a `SeedScore` (importance, coherence, convergence) for a seed under given weights, criticalities, coupling matrix, and state values. Applies the convergence amplifier when ≥ 2 critical factors are simultaneously at extreme states.
- **Dependencies:** Weights `w'`, criticalities, `CouplingMatrix`, state values.
- **Location:** `src/domain/services/SeedScorer.ts`.

#### SeedSelector

- **Responsibility:** Greedy farthest-first selection blending score and minimum pairwise distance via parameter `α`. Filters by coherence threshold `τ` first.
- **Dependencies:** Filtered seed list, target count `K_select`, diversity weight `α`.
- **Location:** `src/domain/services/SeedSelector.ts`.

#### ArrivalEstimator

- **Responsibility:** Compute the seed's `ArrivalWindow` from per-factor arrows and state values. Only factors with `|v[S[i]]| / maxAbs ≥ 0.4` qualify.
- **Formula:** `years[i] = (1 - velocity[i]) · HORIZON_YEARS`.
- **Location:** `src/domain/services/ArrivalEstimator.ts`.

---

## Ubiquitous Language

Full glossary in `UBIQUITOUS_LANGUAGE.md`. Headline terms:

- **Factor** — a driving force in the strategic environment.
- **Criterion** — a dimension for evaluating which factors matter most.
- **State** — a discrete level a factor can take (Low/Mid/High by default).
- **Seed** — a complete factor-state assignment vector. Not a finished scenario.
- **Importance / Coherence / Convergence** — the three derived seed scores.
- **Coupling** — signed pairwise factor interaction strength (reinforcing or damping).
- **Arrows of Time** — Red (contextual future arriving), Blue (past catching up), Green (intentional movement, out of scope).
- **Criticality** — per-factor metric `velocity · proximity · (0.5 + 0.5 · pathDep)`; identifies factors most likely to drive bifurcation.
- **Bifurcation** — a critical threshold where the system reorganises into a qualitatively new state.
- **TUNA** — Turbulent, Unpredictable, Novel, Ambiguous.

---

## Application Layer

### Use Cases

Each use case is a stateless class with a single `execute(input) → Result<output, DomainError>` method. Use cases load the Project via the inbound facade, mutate functionally, and persist via the outbound repository port.

| # | Use Case | Intent | Key Outputs |
|---|---|---|---|
| 1 | DefineFactors | Establish the candidate driving forces | Project with factor list |
| 2 | DefineCriteria | Establish evaluation dimensions | Project with criterion list |
| 3 | WeightCriteria | Pairwise-compare criteria | Criteria PriorityVector + CR |
| 4 | ScoreFactors | Pairwise-compare factors under each criterion | Per-criterion factor priorities |
| 5 | SynthesizeFactors | Combine into global weights and pick top-N | Carried-forward factor set |
| 6 | AssessArrows | Set velocity / proximity / pathDep / consequence | ArrowProfile per factor + criticality |
| 7 | DefineStates | Set the global state palette and per-factor labels | State definitions |
| 8 | AssessCoupling | Set signed pairwise coupling and triggers | CouplingMatrix + TriggerMatrix |
| 9 | GenerateSeeds | Enumerate, filter, score, and select seeds | SeedSet with scores and arrival windows |
| 10 | NameAndTagSeeds | Assign narrative name and bifurcation phase | Curated seed set |

### Ports (Interfaces)

Defined fully in `ARCHITECTURE.md`. Summary:

- **Inbound:** `ProjectFacade` — the single entry point the UI calls. Methods cover all 10 use cases.
- **Outbound:** `ProjectRepository` (persistence), `ExportService` (JSON/CSV/PDF blobs), `TelemetryService` (optional usage telemetry).

---

## Architecture: Ports & Adapters

```
Infrastructure → Application → Domain
   (Adapters)   → (Ports)    → (Core)
```

Full layout, dependency rules, and the implementation gap are in `ARCHITECTURE.md`. Headline rules:

- Domain has zero dependencies on outer layers (no React, no storage, no Blob APIs).
- Application defines port interfaces and uses domain services.
- Adapters implement ports; composition wires them up.
- All dependencies point inward.

---

## Domain Patterns in Use

- **Entity Pattern** — Project, Factor, Criterion, FactorState, ScenarioSeed (each has identity).
- **Value Object Pattern** — All matrices, scores, profiles, and windows are immutable values.
- **Aggregate Pattern** — Project is the single aggregate root; all matrices and seeds are children.
- **Repository Pattern** — `ProjectRepository` port + LocalStorage / IndexedDB adapters.
- **Factory Pattern** — `Project.create(name)`, `PairwiseMatrix.identity(n)`, etc.
- **Strategy Pattern** — `ProjectRepository` swap (LocalStorage vs IndexedDB), `ExportService` swap (JSON vs CSV vs PDF).
- **Functional Update Pattern** — All mutations return new instances; no in-place state.
- **Result Pattern** — `Result<T, E>` discriminated union for expected failures (validation, oversized seed space) instead of exceptions.

Notably absent: domain events / event sourcing (the system is a synchronous deterministic pipeline), specifications, sagas, CQRS.

---

## Domain Rules & Invariants

1. **Pairwise reciprocity.** For every pairwise matrix, `A[i][j] = 1 / A[j][i]`.
   - *Enforced by:* `PairwiseMatrix.set` (returns new instance with reciprocal applied).
   - *Reason:* AHP requires it; without it the priority vector is undefined.

2. **Saaty intensity is discrete.** Only values from `{1/9, ..., 1, ..., 9}` are valid.
   - *Enforced by:* `SaatyIntensity` value object validation.

3. **Consistency Ratio gating.** CR > 0.15 must be visibly flagged; the user is given guidance on how to resolve.
   - *Enforced by:* UI badge thresholds (green ≤ 0.10, amber ≤ 0.15, rose > 0.15) plus `ConsistencyRatio.isInconsistent()`.

4. **Coupling symmetry.** `CouplingMatrix` is symmetric with zero diagonal.
   - *Enforced by:* `CouplingMatrix.set(i, j, v)` writes both `(i,j)` and `(j,i)`.

5. **Seed-space ceiling.** `K^N > 200,000` refuses enumeration and surfaces a warning.
   - *Enforced by:* `MorphologicalSpaceGenerator.generate` returns `Result.err(OversizedSpaceError)`.

6. **Carried-forward consistency.** Coupling, trigger, arrow, and state matrices all align dimensionally with the top-N factors selected at synthesis. Changing N invalidates downstream matrices.
   - *Enforced by:* `Project.setTopN` clears or remaps downstream matrices.

7. **Coherence floor.** Combined seed score is multiplied by coherence — a fully incoherent seed has score 0 regardless of importance and convergence.
   - *Enforced by:* `SeedScorer` formula: `score = ((1-φ)·imp + φ·conv) · coherence`.

8. **Arrival qualification.** Only factors with `|v[S[i]]| / maxAbs ≥ 0.4` enter the arrival window calculation.
   - *Enforced by:* `ArrivalEstimator` filter; default `HORIZON_YEARS` returned when no factor qualifies.

9. **All-client computation.** No domain operation may transmit data to a server.
   - *Enforced by:* Architecture — domain layer has no network primitives; only export adapters produce Blobs.

---

## State Transitions

### Project Lifecycle

```
Created
   │
   ▼
FactorsDefined ──┐
   │             │ (revisit any earlier step
   ▼             │  invalidates downstream artefacts)
CriteriaDefined ─┤
   │             │
   ▼             │
CriteriaWeighted │
   │             │
   ▼             │
FactorsScored ───┤
   │             │
   ▼             │
Synthesized ─────┤
   │             │
   ▼             │
ArrowsAssessed ──┤
   │             │
   ▼             │
StatesDefined ───┤
   │             │
   ▼             │
CouplingAssessed─┤
   │             │
   ▼             │
SeedsGenerated   │
   │             │
   ▼             │
SeedsNamedAndTagged
```

**Valid transitions:** linear forward by default; the user may jump to any earlier step at any time. Re-entering an earlier step preserves that step's state but invalidates all downstream artefacts (they are recomputed lazily on next forward visit).

### ScenarioSeed Lifecycle

```
Generated → Filtered → Selected → Named → PhaseTagged
```

- **Generated:** Created by `MorphologicalSpaceGenerator`.
- **Filtered:** Passes `coherence ≥ τ`.
- **Selected:** Picked by `SeedSelector` for inclusion in the user-facing set.
- **Named:** User assigns a narrative name.
- **PhaseTagged:** User assigns `BifurcationPhase ∈ {Pre, Mid, Post, Steady}`.

---

## Evolution History

### Version 0.1.0 — 2026-05-08

**Initial domain model documentation** based on the v1 specification (`_brief/tuna-scenario-tool-spec.md`).

- **Added:** All entities, value objects, services, use cases, ports per spec sections 5 and 7.
- **Status:** Specification stable; implementation is a single-component prototype not yet decomposed into the documented layers. See `ARCHITECTURE.md` for gap analysis.

### Future Versions

Future entries will document:
- Decomposition of `tuna-scenario-tool.jsx` into the target hexagonal layout.
- Any additions/changes to scoring formulas (currently frozen by the spec's section 4).
- Strategy wind-tunnelling (currently out of scope per spec section 14) — would introduce a new `Strategy` aggregate and a new bounded context.
- Full per-pair-state Cross-Consistency Assessment (currently approximated by aggregate signed coupling).

---

## Appendix: Technology Mapping

*(The domain model above is technology-agnostic. This appendix maps concepts to the chosen technology stack for orientation.)*

| Domain Concept | Technology (target) | Location (target) | Current Implementation |
|---|---|---|---|
| Project entity | TypeScript class | `src/domain/entities/Project.ts` | Inline React `useState` in `tuna-scenario-tool.jsx` |
| Factor / Criterion | TypeScript dataclass | `src/domain/entities/` | Inline JS objects in default constants |
| PairwiseMatrix | Immutable TS class | `src/domain/value-objects/PairwiseMatrix.ts` | Inline 2D array + helper functions |
| AHPCalculator | Pure TS function | `src/domain/services/AHPCalculator.ts` | Inline helper functions |
| SeedScorer | Pure TS function | `src/domain/services/SeedScorer.ts` | Inline `useMemo` block |
| ProjectFacade (port) | TS interface | `src/application/ports/inbound/` | Not present |
| ProjectRepository (port) | TS interface | `src/application/ports/outbound/` | Not present |
| LocalStorage adapter | Browser localStorage | `src/adapters/persistence/` | Not present (no persistence yet) |
| React UI adapter | React 18 + Vite + Tailwind | `src/adapters/ui/react/` | Whole app inline in one component |
| Result<T, E> | TS discriminated union | `src/shared/Result.ts` | Not present (uses thrown errors / nullable) |

---

*This document is generated by the `/ddd` command. Regenerate to update; do not edit manually.*
