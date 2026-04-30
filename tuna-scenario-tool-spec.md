# TUNA Scenario Selector — Technical Specification

### A morphological scenario seed generator for TUNA-domain strategic planning

---

## 1. Document Purpose and Audience

This document is a complete specification for the TUNA Scenario Selector, a web application that supports strategists in generating structured scenario seeds for futures characterised by Turbulence, Unpredictability, Novelty, and Ambiguity. The specification is intended to be implemented by Claude Code following hexagonal (ports and adapters) architecture in TypeScript with React as the UI adapter. The reader is assumed to be a senior engineer familiar with domain-driven design, SOLID principles, and test-driven development; the methodology section is detailed enough that no external reference material should be required during implementation.

The deliverable is a single-page application that runs entirely client-side, with optional persistence and export adapters. The core domain logic is pure and independently testable. The UI is replaceable. The persistence layer is replaceable. This is a deliberate architectural commitment: the value of the solution is in the methodology, and the methodology must remain unentangled from any particular UI framework or storage technology.

---

## 2. Purpose

Strategic scenario planning is the standard practice for thinking about long-horizon futures under deep uncertainty. The dominant method, sometimes called the GBN or intuitive logics approach after the Global Business Network, has been the consensus practice in corporate strategy since the 1980s. It produces four scenarios by selecting two high-impact, high-uncertainty driving forces as axes of a 2×2 matrix. The method works in the sense that it produces scenarios strategists and boards can engage with, but it has three structural weaknesses that experienced practitioners work around informally.

First, the 2×2 method does not enforce independence between the chosen axes. Two driving forces can both score highly on impact and uncertainty but be causally entangled, so the four quadrants of the matrix collapse into two effective futures or one. Second, the method treats time as static, producing scenarios that are spatial configurations rather than transitional moments. In TUNA conditions — where the environment is, in W. Brian Arthur's framing, a complex adaptive system that bifurcates rather than evolves smoothly — the moments of structural transition are precisely what scenario planning should illuminate, and the 2×2 method is poorly suited to capturing them. Third, the method's reasoning chain is opaque. When a stakeholder asks "why these four scenarios rather than four others", the answer is "this was our judgement", which is increasingly insufficient for sophisticated audiences that expect reasoning transparency.

This solution addresses all three weaknesses through a structured pipeline that combines the Analytic Hierarchy Process for factor weighting, morphological analysis for scenario space exploration, signed cross-consistency assessment for coherence enforcement, and arrows-of-time analysis for temporal grounding. The output is a small set of scenario seeds — typically four — that are mathematically distinct, internally coherent, anchored in time, and defended by an auditable chain of judgement. These seeds are starting positions for narrative scenario development, not finished scenarios; the strategist still writes the story, identifies signals, and develops strategic implications. The tool's contribution is to ensure that the narrative work begins from a defensible structural position rather than from intuition alone.

---

## 3. Methodological Foundation

The solution integrates four distinct methodological traditions. Each is summarised here at the level of detail required to implement it correctly.

### 3.1 Causal Texture Theory and Knightian Uncertainty

Fred Emery and Eric Trist (1965) classified organisational environments into four types based on causal interconnection: Placid-Randomised, Placid-Clustered, Disturbed-Reactive, and Turbulent Fields. The fourth — turbulent fields — is the environment for which the present tool is designed: dynamic, highly interconnected, with changes amplifying through the system in unpredictable ways. Frank Knight (1921) distinguished risk (probabilities knowable, calculable, insurable) from uncertainty (probabilities unknowable, situation novel, irreducible to mathematics). The intersection of turbulent-field dynamics with Knightian uncertainty is what Oxford's Saïd Business School calls TUNA conditions, the design target for this tool. Scenarios are not probabilistic forecasts; they are imaginative explorations of plausible futures under irreducible uncertainty.

### 3.2 W. Brian Arthur's Complexity Economics

Arthur's work on combinatorial technology evolution and increasing returns provides the structural model for *why* TUNA conditions exist. Technologies recombine at exponential rates, producing emergent properties that cannot be predicted from component analysis. Positive feedback loops drive runaway dynamics rather than equilibrium. Systems accumulate tension until they reach bifurcation points and snap into qualitatively new configurations. The strategist's task is not to predict which bifurcation will happen but to imagine plausible post-bifurcation realities and prepare for them. This framing is operationalised in the tool through the convergence-potential scoring metric, which mathematically identifies seed configurations representing structural transitions.

### 3.3 Analytic Hierarchy Process (Saaty, 1977)

AHP decomposes a complex decision into a hierarchy of criteria and alternatives, then derives priorities through pairwise comparisons on a 1–9 ratio scale. The principal eigenvector of the resulting comparison matrix yields the priority vector; the consistency ratio measures internal contradiction in the strategist's judgements. The tool uses AHP for the first half of the workflow: weighting evaluation criteria and scoring factors against each criterion, producing a defensible global priority for each candidate factor.

### 3.4 Morphological Analysis (Zwicky 1969, Ritchey 2011)

Morphological analysis treats each factor as a dimension with a small set of discrete states and exhaustively enumerates configurations. For N factors with K states each, the morphological space contains K^N configurations. Cross-Consistency Assessment filters this space by removing internally contradictory configurations. The tool implements an aggregate-coupling approximation of CCA: rather than marking each pairwise state combination as coherent or incoherent individually, the tool scores pairwise coupling strength and polarity, then computes coherence at the seed level. This is methodologically less rigorous than full CCA but reduces judgement burden by an order of magnitude while preserving the essential filtering function.

### 3.5 Arrows of Time (Oxford OSPA)

The Oxford Scenario Planning Approach distinguishes three temporal arrows: the *contextual future arriving at the organisation* (red arrow — velocity, proximity to threshold), the *organisation's intentional movement towards a target* (green arrow — strategy, addressed downstream of seed selection), and the *past catching up with the present* (blue arrow — path-dependency, accumulated lock-in). Bifurcation occurs when these arrows converge in time. The tool encodes the red and blue arrows as factor properties (velocity, proximity, path-dependency) and the convergence point as a derived seed property (estimated arrival window, arriving factors).

---

## 4. Mathematical Specification

This section is normative. All formulas are expressed precisely and must be implemented as specified.

### 4.1 Pairwise Comparison and Priority Derivation

A pairwise comparison matrix `A` of size n×n satisfies `A[i][j] = 1/A[j][i]` and `A[i][i] = 1`. Values are drawn from `{1/9, 1/8, ..., 1/2, 1, 2, ..., 8, 9}` representing Saaty's intensity scale. The priority vector `w` is derived via geometric-mean approximation:

```
w[i] = (∏_j A[i][j])^(1/n) / Σ_k (∏_j A[k][j])^(1/n)
```

The Consistency Ratio is computed as:

```
λ_max = (1/n) · Σ_i (Σ_j A[i][j] · w[j]) / w[i]
CI = (λ_max - n) / (n - 1)
CR = CI / RI[n]
```

Where `RI[n]` is Saaty's tabulated Random Index. Required values: RI[1]=0, RI[2]=0, RI[3]=0.58, RI[4]=0.90, RI[5]=1.12, RI[6]=1.24, RI[7]=1.32, RI[8]=1.41, RI[9]=1.45, RI[10]=1.49, RI[11]=1.51, RI[12]=1.48, RI[13]=1.56, RI[14]=1.57, RI[15]=1.59. CR ≤ 0.10 is acceptable; 0.10 < CR ≤ 0.15 is borderline; CR > 0.15 requires the matrix to be revised.

### 4.2 Global Factor Weights

For factor `i` evaluated against criteria with weights `c[j]` and per-criterion factor priorities `p[j][i]`:

```
W[i] = Σ_j c[j] · p[j][i]
```

The top-N factors by W are carried into the morphological stage. Re-normalised weights `w'[i] = W[i] / Σ_k∈top W[k]` are used for seed scoring.

### 4.3 Factor Criticality

Each carried-forward factor `i` has an arrows profile `a[i] = (velocity, proximity, pathDep, consequence)` where `velocity, proximity, pathDep ∈ [0, 1]` and `consequence ∈ [-1, 1]`. Criticality is derived as:

```
criticality[i] = velocity[i] · proximity[i] · (0.5 + 0.5 · pathDep[i])
```

The path-dependency amplifier is bounded between 0.5 and 1.0 to prevent path-dependency alone from dominating criticality. Consequence asymmetry does not enter scoring; it is preserved for narrative annotation.

### 4.4 Seed Generation

A seed is a vector `S ∈ {0, 1, ..., K-1}^N` where `N` is the number of carried-forward factors and `K` is the number of states. The morphological space is generated exhaustively when `K^N ≤ 200,000`. Each seed index `idx ∈ [0, K^N)` maps to a vector via base-K decomposition:

```
S[i] = (idx / K^i) mod K
```

For `K^N > 200,000`, the system must surface a warning and refuse to enumerate; future versions may introduce NSGA-II sampling.

### 4.5 Seed Scoring

For seed `S` with state values `v[0..K-1]`, factor weights `w'[0..N-1]`, criticalities `c[0..N-1]`, and signed coupling matrix `M ∈ [-9, 9]^(N×N)`:

**Importance** (AHP-weighted state deviation from neutral):

```
maxAbs = max_k |v[k]|
importance = Σ_i w'[i] · |v[S[i]]| / Σ_i w'[i] · maxAbs
```

**Coherence** (penalty for coupling-state mismatches):

```
For each pair (i, j) with i < j:
  c_ij = M[i][j] / 9                              // normalised to [-1, 1]
  stateDiff = |v[S[i]] - v[S[j]]| / (max v - min v)
  if c_ij > 0:                                     // reinforcing — penalty if states diverge
    penalty_ij = c_ij · stateDiff
  elif c_ij < 0:                                   // damping — penalty if states align
    penalty_ij = (-c_ij) · (1 - stateDiff)
  else:
    penalty_ij = 0

totalPenalty = Σ_(i<j) penalty_ij
totalCouplingMag = Σ_(i<j) |c_ij|
coherence = max(0, 1 - totalPenalty / totalCouplingMag)   // 1.0 when totalCouplingMag = 0
```

**Convergence Potential** (criticality-weighted state deviation, amplified by co-deviation):

```
baseConv = Σ_i criticality[i] · |v[S[i]]| / (maxAbs · Σ_i criticality[i])
activeCount = count of i where criticality[i] > 0.35 AND |v[S[i]]| / maxAbs > 0.5
amplifier = 1 + 0.12 · max(0, activeCount - 1)
convergence = min(1, baseConv · amplifier)
```

**Combined Score** (with user-controlled convergence focus `φ ∈ [0, 1]`):

```
score = ((1 - φ) · importance + φ · convergence) · coherence
```

### 4.6 Seed Distance

Weighted Hamming-style distance between two seeds:

```
distance(S_a, S_b) = Σ_i w'[i] · |v[S_a[i]] - v[S_b[i]]| / (max v - min v) · (1 / Σ_i w'[i])
```

### 4.7 Greedy Diverse Seed Selection

Given filtered seeds (those passing coherence threshold τ), target count `K_select`, and diversity weight `α ∈ [0, 1]`:

```
1. Sort filtered seeds by score descending.
2. Selected = [first seed].
3. While |Selected| < K_select AND remaining non-empty:
   For each candidate c in remaining:
     minDist = min over s in Selected of distance(c, s)
     utility = α · score(c) + (1 - α) · minDist
   Add candidate with highest utility to Selected.
4. Return Selected with each seed annotated by avgDistance to other selected seeds.
```

### 4.8 Arrival Window Estimation

For each carried-forward factor `i` in seed `S` whose state has `|v[S[i]]| / maxAbs ≥ 0.4`:

```
years[i] = (1 - velocity[i]) · HORIZON_YEARS    // HORIZON_YEARS = 15
```

The seed's arrival window is `(min(years), median(years), max(years))` over the qualifying factors, returning `HORIZON_YEARS` for all three values when no factors qualify.

---

## 5. Domain Model

The domain layer is pure TypeScript with no external dependencies beyond the standard library. All entities and value objects are immutable; mutation occurs through application-layer commands that return new instances.

### 5.1 Entities and Aggregates

**Project** (aggregate root) — represents a complete scenario analysis session. Contains factors, criteria, all matrices, arrow profiles, states, coupling, and selected seeds. Has a unique identifier and timestamps.

**Factor** — entity with id, name, description.
**Criterion** — entity with id, name, description.
**FactorState** — entity within Project, with index, label, numeric value.
**ScenarioSeed** — entity with seed vector, scores (importance, coherence, convergence), arrival window, optional name, optional bifurcation phase tag.

### 5.2 Value Objects

**SaatyIntensity** — discrete value from {1/9, 1/8, ..., 1/2, 1, 2, ..., 9}. Encapsulates Saaty scale validation.

**PairwiseMatrix** — n×n matrix of SaatyIntensity values with reciprocal property enforced. Operations: `set(i, j, intensity)` returns new matrix; `priorityVector()` returns PriorityVector; `consistencyRatio()` returns number.

**PriorityVector** — n-dimensional probability vector summing to 1.

**ConsistencyRatio** — bounded value in [0, ∞) with classification methods (`isConsistent()`, `isBorderline()`, `isInconsistent()`).

**ArrowProfile** — value object with velocity, proximity, pathDep ∈ [0,1] and consequence ∈ [-1,1]. Method `criticality(): number`.

**CouplingMatrix** — n×n integer matrix with values in [-9, 9], symmetric (M[i][j] = M[j][i]), zeros on diagonal.

**TriggerMatrix** — n×n boolean matrix, asymmetric, zeros on diagonal.

**SeedScore** — value object containing importance, coherence, convergence, all in [0, 1].

**ArrivalWindow** — value object with min, median, max in years, plus list of arriving factors with their individual estimated years.

**BifurcationPhase** — enum: `Pre | Mid | Post | Steady`.

### 5.3 Domain Services

These are stateless functions or stateless service classes operating on domain objects.

**AHPCalculator** — computes priority vectors and consistency ratios from PairwiseMatrix.

**FactorWeightSynthesizer** — combines criterion weights with per-criterion factor priorities to produce global factor weights.

**MorphologicalSpaceGenerator** — generates the full seed enumeration given factor count and state count, with a configurable cap.

**SeedScorer** — computes SeedScore for a given seed under provided weights, criticalities, coupling, and state values.

**SeedSelector** — implements the greedy farthest-first selection with score/diversity blending.

**ArrivalEstimator** — computes ArrivalWindow for a seed given factor arrows and state values.

---

## 6. Architecture

The solution follows hexagonal (ports and adapters) architecture as defined by Alistair Cockburn. The domain core has no knowledge of the outside world. All I/O — UI rendering, persistence, export — flows through ports defined as TypeScript interfaces and implemented by adapters.

### 6.1 Layer Structure

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
│   ├── ports/                       // Interfaces only
│   │   ├── inbound/                 // Driving (UI calls these)
│   │   │   └── ProjectFacade.ts
│   │   └── outbound/                // Driven (use cases call these)
│   │       ├── ProjectRepository.ts
│   │       ├── ExportService.ts
│   │       └── TelemetryService.ts
│   └── dto/                         // Data transfer objects
│       └── *.dto.ts
├── adapters/                        // Adapter implementations
│   ├── ui/
│   │   └── react/
│   │       ├── App.tsx
│   │       ├── steps/               // One component per workflow step
│   │       ├── components/          // Reusable UI components
│   │       ├── hooks/
│   │       └── styles/
│   ├── persistence/
│   │   ├── LocalStorageProjectRepository.ts
│   │   └── IndexedDBProjectRepository.ts
│   └── export/
│       ├── JSONExportService.ts
│       ├── CSVExportService.ts
│       └── PDFExportService.ts
├── composition/                     // Wiring / dependency injection
│   └── compose.ts
└── shared/                          // Cross-cutting utilities
    ├── Result.ts                    // Result<T, E> for error handling
    └── Brand.ts                     // Branded types
```

### 6.2 Dependency Rules

Inner layers must not depend on outer layers. Specifically: domain depends on nothing; application depends only on domain; adapters depend on application and domain; composition depends on everything and wires it together. The TypeScript build configuration must enforce these rules through `paths` aliases and (optionally) ESLint's `import/no-restricted-paths` rule.

### 6.3 Error Handling

The codebase uses a `Result<T, E>` discriminated union rather than throwing exceptions for expected failure modes (validation errors, inconsistent matrices, oversized seed spaces). Unexpected errors (e.g. browser API failures) may throw but must be caught at adapter boundaries and converted to `Result.err` before crossing into the application layer.

---

## 7. Application Layer

Each use case is a class with a single `execute` method taking input DTOs and returning a `Result<OutputDTO, DomainError>`. Use cases are stateless; they receive a Project via inbound port, mutate it functionally (returning a new Project), and persist it via the outbound repository port.

### 7.1 Inbound Port: ProjectFacade

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

### 7.2 Outbound Port: ProjectRepository

```typescript
export interface ProjectRepository {
  save(project: Project): Promise<Result<void, RepositoryError>>;
  load(id: string): Promise<Result<Project, RepositoryError>>;
  list(): Promise<Result<ProjectMetadata[], RepositoryError>>;
  delete(id: string): Promise<Result<void, RepositoryError>>;
}
```

### 7.3 Outbound Port: ExportService

```typescript
export interface ExportService {
  exportJSON(project: Project): Promise<Result<Blob, ExportError>>;
  exportCSV(project: Project): Promise<Result<Blob, ExportError>>;
  exportPDF(project: Project): Promise<Result<Blob, ExportError>>;
}
```

---

## 8. UI Specification

The React adapter implements a nine-step wizard. Each step is a self-contained component receiving project state via a hook (`useProject(projectId)`) and dispatching through the inbound facade. The UI has no direct knowledge of domain objects — it works with DTOs.

### 8.1 Visual Design Constraints

The interface uses a dark theme with the following palette: background `slate-950`, surfaces `slate-900`, borders `slate-800`, text primary `slate-100`, text secondary `slate-400`, accent `amber-500`. Reinforcing coupling and positive convergence use `emerald-500`; damping coupling and bifurcation flags use `rose-500`. Typography uses Fraunces for display, IBM Plex Sans for body, and JetBrains Mono for numerical and mnemonic content. Numerical readouts always use mono. Step transitions are instantaneous; persistence happens on every state change.

### 8.2 Step Specifications

**Step 1 — Factors.** List of factors with inline edit. Add/remove. Minimum three factors to proceed. Each factor has name and description. Defaults pre-populate the eight Europe-2040 factors (geo, tech, energy, food, culture, social, federal, defense).

**Step 2 — Criteria.** Same shape as Step 1 but for evaluation criteria. Defaults are the GBN-plus-independence stack: Impact Magnitude, Uncertainty, Decision Relevance, Time Horizon Fit, Causal Independence. Minimum two criteria.

**Step 3 — Weight Criteria.** Pairwise comparison interface using a 17-position slider (intensity -9 to +9 with reciprocals computed). Live priority bars and consistency badge. Badge thresholds: green ≤10%, amber ≤15%, rose >15%.

**Step 4 — Score Factors.** Tabbed interface, one tab per criterion. Each tab presents a full pairwise comparison among factors under that criterion. Inactive tabs show their per-matrix CR as a small badge.

**Step 5 — Synthesis.** Ranked table of factors with global weights and per-criterion contribution columns. Slider to choose top-N (3 to factor count). Carried-forward rows are highlighted.

**Step 6 — Arrows of Time.** One card per top factor with four sliders: velocity (0–1), proximity to threshold (0–1), path-dependency (0–1), consequence asymmetry (-1 to +1). Live criticality readout per factor with colour coding (red >0.5, amber 0.3–0.5, slate <0.3). Three info cards at top describing the three arrows.

**Step 7 — States.** Global state palette (default Low/Mid/High at -1/0/+1, expandable to 5 states). Per-factor label override matrix. Numeric values stay global; labels can be overridden per factor for narrative clarity.

**Step 8 — Coupling and Triggering.** One section per factor pair. Eleven-position slider from -9 (tightly damping) through 0 (independent) to +9 (tightly reinforcing). Below the slider, two trigger toggle buttons (A→B and B→A). Coupling magnitude shown with reinforcing/damping label. Two info cards explain reinforcing vs damping semantics.

**Step 9 — Bifurcation Pathway Seeds.** Stats row (seed space size, filtered count, filter rate, selected count). Four control sliders (K, diversity α, convergence focus φ, coherence threshold τ). Arrival timeline visualisation showing all seeds on a 0–HORIZON_YEARS axis. Parallel coordinates plot showing seed profiles with axes coloured by criticality. Per-seed cards with: name input, bifurcation phase toggle (Pre/Mid/Post/Steady), four metrics (importance, coherence, convergence, distance), arrival window, list of arriving factors, and grid of factor-state cells coloured by deviation. Seeds use a fixed eight-colour palette in selection order.

### 8.3 Persistence Behaviour

Every state-changing user action triggers immediate persistence through the repository port. The default adapter is `LocalStorageProjectRepository` for simplicity; an `IndexedDBProjectRepository` is provided for projects whose serialised size exceeds the localStorage 5 MB practical limit. Project state hydrates on application load if a project ID exists in the URL or localStorage.

---

## 9. Test Strategy

The test pyramid targets 95% coverage of the domain layer, 80% of the application layer, and 60% of the UI adapter. All new code requires passing tests before merge.

### 9.1 Domain Tests (Unit)

Domain tests use Vitest with no mocking — domain objects are pure and easily instantiable. Each domain service has a dedicated test file with cases covering happy paths, edge cases, and known mathematical results.

Required test cases for `AHPCalculator`:
- Identity matrix returns uniform priority vector and CR = 0.
- Saaty's textbook 3×3 example reproduces published priorities to four decimal places.
- A fully consistent matrix (constructed as `A[i][j] = w[i]/w[j]` for known w) returns CR = 0 to machine epsilon.
- A maximally inconsistent 3×3 matrix returns CR > 0.5.
- Non-reciprocal input throws or returns Err.

Required test cases for `SeedScorer`:
- A seed with all factors at neutral state returns importance = 0.
- A seed with all factors at extreme state returns importance = 1.
- A seed with two reinforcing-coupled factors at same-sign extremes returns coherence = 1.
- A seed with two reinforcing-coupled factors at opposite extremes returns coherence < 1.
- A seed with two damping-coupled factors at opposite extremes returns coherence = 1.
- Convergence with one critical factor at extreme equals base convergence with no amplifier.
- Convergence with three critical factors at extremes shows the 1.24× amplifier.

Required test cases for `SeedSelector`:
- α = 1 selects the K highest-scoring seeds regardless of distance.
- α = 0 selects K seeds maximising minimum pairwise distance.
- Empty filtered set returns empty selection.
- K greater than filtered count returns all filtered seeds.

### 9.2 Application Tests (Integration)

Use cases are tested against an in-memory `ProjectRepository` adapter. Each use case has tests for: successful execution, validation failures, and persistence side effects. The `GenerateSeeds` use case is the most complex and requires tests for the full pipeline producing expected output on a known input fixture.

### 9.3 UI Tests (Component)

React components are tested with Vitest plus React Testing Library. Tests focus on user-observable behaviour: clicking the slider for a Saaty intensity dispatches the correct action; the consistency badge updates colour at the correct thresholds; the parallel coordinates plot renders one polyline per selected seed.

### 9.4 Property-Based Tests

The mathematical layer benefits from property-based testing using fast-check. Key properties:
- For any valid PairwiseMatrix, the priority vector sums to 1 ± 1e-9.
- For any valid PairwiseMatrix, the CR is non-negative.
- For any seed, importance, coherence, convergence ∈ [0, 1].
- For any pair of seeds, distance ∈ [0, 1] and is symmetric.
- For any non-empty filtered seed set with K ≤ |filtered|, the selector returns exactly K seeds.

### 9.5 Snapshot Tests

The default fixture (eight factors, five criteria, default arrows, default coupling) produces a known seed set. The selected seeds should be regression-tested via snapshot. Changes to the snapshot require explicit human review to confirm the change is intentional.

---

## 10. Non-Functional Requirements

**Performance.** Seed generation and scoring for the default 6-factor × 3-state space (729 seeds) must complete in under 50 ms on a mid-range laptop. Scaling to 8-factor × 3-state (6,561 seeds) must remain under 200 ms. Beyond 200,000 seeds the system refuses to generate.

**Accessibility.** WCAG 2.1 AA compliance. All interactive elements have keyboard navigation. Colour is never the sole carrier of meaning — coupling polarity (reinforcing/damping) uses colour and signed numeric labels. Contrast ratios meet AA on the dark theme.

**Internationalisation.** UI strings are externalised in a single `i18n/en.json` file with a placeholder for future translations. Domain values (criterion names, factor names, state labels) are user-supplied strings and not translated.

**Privacy.** All computation is client-side. No data is transmitted to a server. Persistence uses browser-local storage only. The export service produces local Blobs that the user downloads.

**Browser support.** Latest two versions of Chrome, Firefox, Safari, and Edge. No IE.

**Bundle size.** Production bundle under 250 KB gzipped. Tailwind is purged; lucide-react icons are tree-shaken; recharts and other heavyweight libraries are not used (the parallel coordinates and timeline are rendered as inline SVG).

---

## 11. Build and Tooling

**Language.** TypeScript 5.4+ in strict mode (`"strict": true`, `"noUncheckedIndexedAccess": true`, `"exactOptionalPropertyTypes": true`).

**Framework.** React 18+ for the UI adapter only. Vite for the build. No Next.js, no SSR.

**Styling.** Tailwind CSS with custom design tokens for the slate/amber palette. No CSS-in-JS.

**Testing.** Vitest for unit and integration; React Testing Library for component tests; fast-check for property-based tests; Playwright for end-to-end smoke tests covering the happy path through all nine steps.

**Linting.** ESLint with `@typescript-eslint`, `eslint-plugin-react`, and `eslint-plugin-import` (with `import/no-restricted-paths` enforcing layer boundaries). Prettier for formatting.

**CI.** All PRs must pass type-check, lint, and full test suite. Coverage reports posted to PR. Bundle size budgets enforced with `size-limit`.

---

## 12. Implementation Phasing

The work decomposes into seven phases, each independently shippable.

**Phase 1 — Domain core.** Implement value objects (SaatyIntensity, PairwiseMatrix, PriorityVector, ConsistencyRatio) and the AHPCalculator service. Full unit and property-based test coverage. No UI.

**Phase 2 — Morphological core.** Implement ArrowProfile, CouplingMatrix, MorphologicalSpaceGenerator, SeedScorer, SeedSelector, ArrivalEstimator. Full test coverage including the snapshot regression on the default fixture.

**Phase 3 — Application layer.** Implement Project aggregate, all use cases, and the in-memory ProjectRepository. Integration tests against the in-memory adapter.

**Phase 4 — UI scaffolding.** React app, routing, ProjectFacade React adapter, theme tokens, layout shell, step navigation. No step content yet.

**Phase 5 — UI steps 1–5.** AHP-related steps: factors, criteria, criteria weighting, factor scoring, synthesis. End-to-end happy path through synthesis works.

**Phase 6 — UI steps 6–9.** TUNA-specific steps: arrows, states, coupling, seeds with all visualisations. Default fixture produces correct output through the entire pipeline.

**Phase 7 — Persistence and export.** localStorage adapter, IndexedDB fallback adapter, JSON/CSV/PDF export adapters. Snapshot import/export round-trip tested.

Each phase ends with a demo build and a tagged release. No phase begins until the previous phase has passing tests, passing CI, and accepted UX review.

---

## 13. Acceptance Criteria

The system is considered complete when the following are demonstrably true:

1. A user can complete the nine-step wizard end-to-end using the default fixture and produce four named, phase-tagged scenario seeds.
2. All consistency ratios above 15% are visibly flagged and the user is given guidance on how to resolve them.
3. The seed set for the default fixture matches a committed snapshot to within 1e-9 numerical tolerance on all scores.
4. The arrival timeline displays all selected seeds with median markers and range bars on a 0-to-15-year axis.
5. The parallel coordinates plot renders correctly with criticality-coloured axes for any valid configuration.
6. Project state survives a full page reload via the persistence adapter.
7. The user can export a project as JSON and re-import it to reproduce the same state.
8. Lighthouse accessibility score ≥ 95 on the seed selection page.
9. Production bundle is under 250 KB gzipped.
10. Test coverage meets the per-layer thresholds defined in section 9.

---

## 14. Out of Scope

The following are deliberately excluded from this specification and may be addressed in future versions:

- **Strategy wind-tunnelling.** Testing organisational strategies against the generated seed set (Oxford OSPA's downstream activity). This requires modelling strategies as separate entities and is a significant addition.
- **Pareto-optimal strategy frontier.** Multi-objective optimisation over (expected value, robustness) for strategies tested across seeds.
- **Full Cross-Consistency Assessment.** Per-pairwise-state-combination coherence judgement. Currently approximated by aggregate signed coupling; full CCA would require a substantially larger UI.
- **NSGA-II seed search.** Genetic-algorithm seed exploration for problems where the morphological space exceeds the brute-force cap.
- **Multi-user collaboration.** Real-time co-editing of a project. Requires a backend.
- **Server-side persistence.** All persistence is currently client-only.
- **Scenario narrative generation.** The tool produces seeds; narrative writing remains with the human strategist. LLM-assisted narrative drafting is plausible but explicitly out of scope for v1.

---

## Appendix A — Default Configuration

For reference and snapshot testing, the default fixture is:

| Element | Default Value |
|---|---|
| Factors | Geopolitics, Technology Velocity, Energy Security, Food Security, Cultural Influence, Social Polarisation, Federalism Direction, Defense Posture |
| Criteria | Impact Magnitude, Uncertainty, Decision Relevance, Time Horizon Fit, Causal Independence |
| Top-N | 6 |
| States | Low (-1), Mid (0), High (+1) |
| Default arrow | velocity 0.5, proximity 0.5, pathDep 0.5, consequence 0 |
| Default coupling | 0 (independent) for all pairs |
| Default trigger | 0 for all directional pairs |
| K (seeds) | 4 |
| α (diversity) | 0.5 |
| φ (convergence focus) | 0.6 |
| τ (coherence threshold) | 0.4 |
| Horizon years | 15 |
| Seed-space cap | 200,000 |

---

## Appendix B — Glossary

**AHP** — Analytic Hierarchy Process. Saaty's method for deriving priority weights from pairwise comparisons.

**Bifurcation** — A critical threshold in a complex system at which the system reorganises into a qualitatively new state. Borrowed from chaos theory; central to Arthur's complexity economics.

**Coherence** — Property of a scenario seed measuring internal consistency under coupling constraints. High when reinforcing-coupled factors share state direction and damping-coupled factors oppose.

**Convergence Potential** — Property of a scenario seed measuring the degree to which high-criticality factors are simultaneously at extreme states. High convergence indicates the structural moment of bifurcation.

**Criticality** — Per-factor property derived from velocity × proximity, amplified by path-dependency. Identifies factors most likely to drive bifurcation.

**GBN** — Global Business Network, the consultancy where the intuitive-logics scenario method was codified by Schwartz, Wack, and Ogilvy in the 1980s.

**Morphological Analysis** — Zwicky's method for systematically exploring multi-dimensional configuration spaces by enumerating combinations of factor states.

**OSPA** — Oxford Scenario Planning Approach. Saïd Business School's variant of intuitive-logics scenario planning, distinguished by the three arrows of time and the contextual/transactional environment split.

**Seed** — A vector of factor-state assignments representing a starting position for narrative scenario development. Not a finished scenario.

**TUNA** — Turbulent, Unpredictable, Novel, Ambiguous. Oxford's term for the conditions that justify scenario planning over forecasting.

---

*End of specification.*
