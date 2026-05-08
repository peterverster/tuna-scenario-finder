# Architecture — TUNA Scenario Finder

**Last Updated:** 2026-05-08
**Pattern:** Hexagonal (Ports & Adapters) — Cockburn

This document describes the **target** layered architecture per `_brief/tuna-scenario-tool-spec.md` §6, plus a gap analysis against the current implementation.

---

## Layer Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                          Composition Root                            │
│  Wires adapters → ports → use cases. Knows everyone; knows nothing   │
│  about how anyone works.                                             │
│  (src/composition/compose.ts)                                        │
└──────────────────────────────────────────────────────────────────────┘
                                  │
        ┌─────────────────────────┼──────────────────────────┐
        │                         │                          │
        ▼                         ▼                          ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│   UI Adapter     │    │ Persistence      │    │  Export          │
│   (React)        │    │ Adapters         │    │  Adapters        │
│                  │    │                  │    │                  │
│ src/adapters/ui/ │    │ src/adapters/    │    │ src/adapters/    │
│       react/     │    │  persistence/    │    │     export/      │
└────────┬─────────┘    └────────┬─────────┘    └────────┬─────────┘
         │                       │                       │
         │ implements            │ implements            │ implements
         │ DRIVES                │                       │
         ▼                       ▼                       ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│ Inbound Port     │    │ Outbound Port    │    │ Outbound Port    │
│ ProjectFacade    │    │ ProjectRepository│    │ ExportService    │
└────────┬─────────┘    └────────▲─────────┘    └────────▲─────────┘
         │                       │                       │
         │ calls                 │ uses                  │ uses
         ▼                       │                       │
┌──────────────────────────────────────────────────────────────────────┐
│                       Application Layer                              │
│                                                                      │
│  Use Cases (orchestration):                                          │
│   DefineFactors, DefineCriteria, WeightCriteria, ScoreFactors,       │
│   SynthesizeFactors, AssessArrows, DefineStates, AssessCoupling,     │
│   GenerateSeeds, NameAndTagSeeds                                     │
│                                                                      │
│  DTOs (data transfer): no domain types cross this boundary upward    │
│                                                                      │
│  src/application/                                                    │
└──────────────────────────────────┬───────────────────────────────────┘
                                   │ uses
                                   ▼
┌──────────────────────────────────────────────────────────────────────┐
│                          Domain Layer                                │
│                                                                      │
│   Entities:        Project (root), Factor, Criterion,                │
│                    FactorState, ScenarioSeed                         │
│   Value Objects:   SaatyIntensity, PairwiseMatrix, PriorityVector,   │
│                    ConsistencyRatio, ArrowProfile, CouplingMatrix,   │
│                    TriggerMatrix, SeedScore, ArrivalWindow,          │
│                    BifurcationPhase                                  │
│   Services:        AHPCalculator, FactorWeightSynthesizer,           │
│                    MorphologicalSpaceGenerator, SeedScorer,          │
│                    SeedSelector, ArrivalEstimator                    │
│   Errors:          DomainErrors discriminated union                  │
│                                                                      │
│   No I/O. No frameworks. Pure TypeScript.                            │
│                                                                      │
│   src/domain/                                                        │
└──────────────────────────────────────────────────────────────────────┘
```

**Dependency direction:** all arrows point inward (toward the domain). Adapters depend on application; application depends on domain; domain depends on nothing.

---

## Target Folder Structure

Per spec §6.1:

```
src/
├── domain/                          // Pure domain logic
│   ├── entities/
│   │   ├── Project.ts
│   │   ├── Factor.ts
│   │   ├── Criterion.ts
│   │   ├── FactorState.ts
│   │   └── ScenarioSeed.ts
│   ├── value-objects/
│   │   ├── SaatyIntensity.ts
│   │   ├── PairwiseMatrix.ts
│   │   ├── PriorityVector.ts
│   │   ├── ConsistencyRatio.ts
│   │   ├── ArrowProfile.ts
│   │   ├── CouplingMatrix.ts
│   │   ├── TriggerMatrix.ts
│   │   ├── SeedScore.ts
│   │   ├── ArrivalWindow.ts
│   │   └── BifurcationPhase.ts
│   ├── services/
│   │   ├── AHPCalculator.ts
│   │   ├── FactorWeightSynthesizer.ts
│   │   ├── MorphologicalSpaceGenerator.ts
│   │   ├── SeedScorer.ts
│   │   ├── SeedSelector.ts
│   │   └── ArrivalEstimator.ts
│   └── errors/
│       └── DomainErrors.ts
├── application/                     // Use cases / orchestration
│   ├── use-cases/
│   │   ├── DefineFactors.ts
│   │   ├── DefineCriteria.ts
│   │   ├── WeightCriteria.ts
│   │   ├── ScoreFactors.ts
│   │   ├── SynthesizeFactors.ts
│   │   ├── AssessArrows.ts
│   │   ├── DefineStates.ts
│   │   ├── AssessCoupling.ts
│   │   ├── GenerateSeeds.ts
│   │   └── NameAndTagSeeds.ts
│   ├── ports/
│   │   ├── inbound/
│   │   │   └── ProjectFacade.ts
│   │   └── outbound/
│   │       ├── ProjectRepository.ts
│   │       ├── ExportService.ts
│   │       └── TelemetryService.ts
│   └── dto/
│       └── *.dto.ts
├── adapters/
│   ├── ui/
│   │   └── react/
│   │       ├── App.tsx
│   │       ├── steps/
│   │       ├── components/
│   │       ├── hooks/
│   │       └── styles/
│   ├── persistence/
│   │   ├── LocalStorageProjectRepository.ts
│   │   └── IndexedDBProjectRepository.ts
│   └── export/
│       ├── JSONExportService.ts
│       ├── CSVExportService.ts
│       └── PDFExportService.ts
├── composition/
│   └── compose.ts
└── shared/
    ├── Result.ts                    // Result<T, E>
    └── Brand.ts                     // Branded types
```

---

## Dependency Rules

1. **Domain depends on nothing.** No imports from `application/`, `adapters/`, `composition/`, or any framework. The domain layer is pure TypeScript and the standard library only.
2. **Application depends only on domain.** Use cases and DTOs may import from `domain/`. Ports define contracts that point *outward* from the application's perspective.
3. **Adapters depend on application and domain.** Adapters import port interfaces from the application layer and domain types from the domain layer.
4. **Composition depends on everything.** The composition root is the only place that imports concrete adapters. It wires them to ports and produces the configured `ProjectFacade` that the UI consumes.
5. **Shared utilities (`Result`, `Brand`) may be imported anywhere.**

### Enforcement

- TypeScript path aliases (`@domain/*`, `@application/*`, `@adapters/*`).
- ESLint `import/no-restricted-paths` to forbid upward imports.
- CI fails the build if a domain file imports from `react`, `localStorage`, or any application/adapter path.

---

## Inbound Port — `ProjectFacade`

The single entry the UI calls. Per spec §7.1:

```typescript
export interface ProjectFacade {
  createProject(name: string): Promise<Result<ProjectDTO, DomainError>>;
  getProject(id: string): Promise<Result<ProjectDTO, DomainError>>;

  defineFactors(projectId: string, factors: FactorInput[]): Promise<Result<ProjectDTO, DomainError>>;
  defineCriteria(projectId: string, criteria: CriterionInput[]): Promise<Result<ProjectDTO, DomainError>>;
  setCriteriaPairwise(projectId: string, i: number, j: number, intensity: number): Promise<Result<ProjectDTO, DomainError>>;
  setFactorPairwise(projectId: string, criterionId: string, i: number, j: number, intensity: number): Promise<Result<ProjectDTO, DomainError>>;
  setTopN(projectId: string, n: number): Promise<Result<ProjectDTO, DomainError>>;
  setFactorArrow(projectId: string, factorId: string, arrow: ArrowInput): Promise<Result<ProjectDTO, DomainError>>;
  setStates(projectId: string, states: StateInput[]): Promise<Result<ProjectDTO, DomainError>>;
  setStateLabelOverride(projectId: string, factorId: string, stateIndex: number, label: string | null): Promise<Result<ProjectDTO, DomainError>>;
  setCoupling(projectId: string, i: number, j: number, value: number): Promise<Result<ProjectDTO, DomainError>>;
  setTrigger(projectId: string, from: number, to: number, value: boolean): Promise<Result<ProjectDTO, DomainError>>;
  generateSeeds(projectId: string, params: GenerationParams): Promise<Result<SeedSetDTO, DomainError>>;
  nameSeed(projectId: string, seedIndex: number, name: string): Promise<Result<ProjectDTO, DomainError>>;
  tagSeedPhase(projectId: string, seedIndex: number, phase: BifurcationPhase): Promise<Result<ProjectDTO, DomainError>>;
}
```

---

## Outbound Ports

### `ProjectRepository`

```typescript
export interface ProjectRepository {
  save(project: Project): Promise<Result<void, RepositoryError>>;
  load(id: string): Promise<Result<Project, RepositoryError>>;
  list(): Promise<Result<ProjectMetadata[], RepositoryError>>;
  delete(id: string): Promise<Result<void, RepositoryError>>;
}
```

Adapters: `LocalStorageProjectRepository` (default), `IndexedDBProjectRepository` (fallback for projects > ~5 MB serialised).

### `ExportService`

```typescript
export interface ExportService {
  exportJSON(project: Project): Promise<Result<Blob, ExportError>>;
  exportCSV(project: Project): Promise<Result<Blob, ExportError>>;
  exportPDF(project: Project): Promise<Result<Blob, ExportError>>;
}
```

Adapters: `JSONExportService`, `CSVExportService`, `PDFExportService`.

### `TelemetryService`

Optional, no-op default. Adapters implement to capture anonymised usage metrics.

---

## Error Handling

The codebase uses a `Result<T, E>` discriminated union for **expected** failure modes:

- Validation errors (factor count too low, invalid Saaty intensity).
- Domain rule violations (non-reciprocal pairwise matrix, oversized seed space).
- Repository / export errors (storage quota exceeded, blob generation failed).

**Exceptions are reserved for unexpected failures** (browser API explosions, bugs). Adapters catch raw exceptions at the I/O boundary and convert to `Result.err` before crossing into the application layer. The domain layer must never see a thrown exception from outside.

---

## Naming Conventions

| Concept | Convention | Example |
|---|---|---|
| Entity | `PascalCase` noun | `Project`, `Factor`, `ScenarioSeed` |
| Value Object | `PascalCase` noun | `SaatyIntensity`, `ArrivalWindow` |
| Domain Service | `PascalCase` + role suffix | `AHPCalculator`, `SeedScorer`, `SeedSelector` |
| Use Case | `PascalCase` imperative verb phrase | `DefineFactors`, `GenerateSeeds`, `NameAndTagSeeds` |
| Inbound Port | `PascalCase` + `Facade` | `ProjectFacade` |
| Outbound Port | `PascalCase` + role | `ProjectRepository`, `ExportService` |
| Adapter | `PascalCase` + tech + role | `LocalStorageProjectRepository`, `JSONExportService` |
| DTO | `PascalCase` + `DTO` or `Input` | `ProjectDTO`, `FactorInput` |
| Result type | `Result<OkType, ErrType>` | `Result<ProjectDTO, DomainError>` |

The full naming guide lives in `_docs/port-naming-conventions.md`.

---

## Implementation Gap (as of 2026-05-08)

The current implementation is **not yet** structured per the target architecture above. The current state is:

| Layer | Target | Current |
|---|---|---|
| Domain | `src/domain/` with pure TS classes and services | Inline JS helpers and constants in `tuna-scenario-tool.jsx` |
| Application | `src/application/` with use cases and ports | Not present — orchestration is React `useState` + `useMemo` |
| Adapters → UI | `src/adapters/ui/react/` decomposed into steps | Single 2,957-line component containing all 9 steps |
| Adapters → persistence | `LocalStorage` + `IndexedDB` adapters | None — no persistence implemented yet |
| Adapters → export | `JSON` / `CSV` / `PDF` services | Replaced in commit `85a5bc4` with prompt-as-text-file download |
| Composition | `src/composition/compose.ts` | None |
| Shared | `Result<T, E>`, branded types | None — uses thrown errors and nullable types |
| Language | TypeScript strict | JavaScript (JSX) |

**Migration plan (per spec §12, the seven phases):**

1. Phase 1 — Domain core: SaatyIntensity, PairwiseMatrix, PriorityVector, ConsistencyRatio, AHPCalculator. Vitest + fast-check coverage.
2. Phase 2 — Morphological core: ArrowProfile, CouplingMatrix, MorphologicalSpaceGenerator, SeedScorer, SeedSelector, ArrivalEstimator. Snapshot regression on default fixture.
3. Phase 3 — Application layer: Project aggregate, all use cases, in-memory ProjectRepository.
4. Phase 4 — UI scaffolding: routing, ProjectFacade React adapter, theme tokens, step shell.
5. Phase 5 — UI steps 1–5: factors, criteria, weighting, scoring, synthesis.
6. Phase 6 — UI steps 6–9: arrows, states, coupling, seeds with all visualisations.
7. Phase 7 — Persistence and export: LocalStorage, IndexedDB, JSON/CSV/PDF.

Each phase ends with a tagged release; no phase begins until the previous phase passes CI.

---

## What This Architecture Buys Us

- **Replaceable UI.** The methodology survives a UI rewrite. If React 23 invents a new paradigm, only `src/adapters/ui/react/` changes.
- **Replaceable persistence.** LocalStorage today, IndexedDB tomorrow, server sync the day after — only adapters change.
- **Testable mathematics.** The domain is pure; tests run without a DOM, without storage, without any framework. Snapshot regression on the default fixture catches numerical regressions immediately.
- **Defensible audit trail.** Every transformation is named, scoped, and tested. When a stakeholder asks "why these four scenarios", every step from intensity slider to selected seed is traceable through use case → domain service → formula in spec §4.
- **Privacy by construction.** The domain has no network primitives. There is no "accidentally sent telemetry to a server" pathway because the layer that could do that doesn't exist in the domain.

---

*This document is generated by the `/ddd` command. Regenerate to update; do not edit manually.*
