# Ubiquitous Language — TUNA Scenario Finder

**Last Updated:** 2026-05-08

This glossary is the canonical vocabulary for the domain. Use these terms exactly — in code (class names, method names, variables), in conversations, in PR descriptions, and in user-facing copy. Synonyms are listed where the domain has a "do not use" alternative drawn from adjacent traditions.

---

## A

### AHP (Analytic Hierarchy Process)

Saaty's (1977) method for deriving priority weights from pairwise comparisons. Decomposes a decision into criteria and alternatives, asks the decision-maker for ratio-scale comparisons (1–9), and computes a priority vector via the principal eigenvector (here approximated by geometric mean).

- *Technical implementation:* `AHPCalculator` domain service consumes a `PairwiseMatrix` and returns a `PriorityVector` and `ConsistencyRatio`.
- *Use it when:* describing how criterion weights or per-criterion factor priorities are derived.

### Arrival Window

The time envelope (in years) during which a seed's qualifying factors arrive at non-trivial states. Reported as a triple `(min, median, max)` plus per-factor years.

- *Technical implementation:* `ArrivalWindow` value object; `ArrivalEstimator` domain service.
- *Formula:* `years[i] = (1 - velocity[i]) · HORIZON_YEARS`, qualifying factors only.

### Arrows of Time

Oxford OSPA's three temporal arrows. Distinguishes:
- **Red arrow** — the contextual future arriving at the organisation (velocity, proximity).
- **Blue arrow** — the past catching up with the present (path-dependency, accumulated lock-in).
- **Green arrow** — the organisation's intentional movement toward a target (strategy). *Out of scope* in v1; addressed downstream of seed selection in OSPA itself.

- *Technical implementation:* `ArrowProfile` value object captures red and blue arrows per factor.
- *Use it when:* describing why a factor is critical, when it's likely to arrive, or how locked-in it is.

---

## B

### Bifurcation

A critical threshold at which a complex adaptive system reorganises into a qualitatively new state. Borrowed from chaos theory; central to W. Brian Arthur's complexity economics. The strategist's task is not to predict which bifurcation will occur but to imagine plausible post-bifurcation realities and prepare for them.

- *Technical implementation:* The `BifurcationPhase` value object tags seeds; the `Convergence` score identifies seeds at the structural moment of bifurcation.

### Bifurcation Phase

A narrative tag indicating where on the bifurcation a seed sits. Enum: `Pre | Mid | Post | Steady`.

- *Use it when:* curating a final seed set for narrative development.

---

## C

### Coherence

A seed-level property measuring internal consistency under coupling constraints. High when reinforcing-coupled factors share state direction *and* damping-coupled factors oppose. Computed in `[0, 1]`; `1.0` means no coupling violations.

- *Technical implementation:* `SeedScorer.coherence(seed)`.
- *Formula:* `coherence = max(0, 1 - totalPenalty / totalCouplingMag)`.
- *Synonym to avoid:* "consistency" (collides with AHP's Consistency Ratio).

### Consistency Ratio (CR)

Saaty's measure of internal contradiction in a pairwise matrix. CR ≤ 0.10 is acceptable; 0.10 < CR ≤ 0.15 is borderline; CR > 0.15 requires the matrix to be revised.

- *Technical implementation:* `ConsistencyRatio` value object with `isConsistent / isBorderline / isInconsistent`.
- *Synonym to avoid:* "coherence" (that term is reserved for seed-level coupling consistency — see above).

### Convergence (Convergence Potential)

A seed-level property measuring the degree to which high-criticality factors are simultaneously at extreme states. High convergence indicates the structural moment of bifurcation. Amplified by 12% per additional active critical factor beyond the first.

- *Technical implementation:* `SeedScorer.convergence(seed)`.
- *Formula:* `convergence = min(1, baseConv · (1 + 0.12 · max(0, activeCount - 1)))`.

### Coupling

Signed pairwise interaction strength between factors. Positive (reinforcing) means factors trend together; negative (damping) means they oppose.

- *Technical implementation:* `CouplingMatrix` value object; symmetric, zero diagonal, values in `[-9, 9]`.
- *UI representation:* an 11-position slider per factor pair.

### Criterion

A dimension along which factors are evaluated to determine which deserve a seat in the morphological space. Examples: Impact Magnitude, Uncertainty, Decision Relevance, Time Horizon Fit, Causal Independence.

- *Technical implementation:* `Criterion` entity.
- *Synonym to avoid:* "metric" (too generic and loaded with quantitative connotations).

### Criticality

A per-factor metric identifying how likely the factor is to drive a bifurcation. `criticality = velocity · proximity · (0.5 + 0.5 · pathDep)`. The path-dependency amplifier is bounded between 0.5 and 1.0 to prevent path-dependency alone from dominating criticality.

- *Technical implementation:* `ArrowProfile.criticality()`.
- *UI representation:* colour-coded readout (red > 0.5, amber 0.3–0.5, slate < 0.3).

### Cross-Consistency Assessment (CCA)

Ritchey's method for filtering a morphological space by removing internally contradictory configurations. The full method requires marking each pairwise *state* combination as coherent or incoherent. **This tool implements an aggregate-coupling approximation:** pairwise *coupling strength and polarity* is scored once, then coherence is computed at the seed level. Less rigorous but reduces judgement burden by an order of magnitude.

- *Technical implementation:* `CouplingMatrix` + `SeedScorer.coherence`.

---

## F

### Factor

A driving force in the strategic environment whose future state is uncertain and whose state shapes the scenario.

- *Technical implementation:* `Factor` entity.
- *Synonym to avoid:* "variable" (too mathematical), "trend" (presupposes direction), "driver" (acceptable in user-facing copy but not in code).

### Factor State

A discrete level a factor can take in a seed (typically Low / Mid / High at -1 / 0 / +1, expandable to 5 levels). Numeric values are global across factors; labels can be overridden per factor for narrative clarity.

- *Technical implementation:* `FactorState` entity with global `value` plus per-factor `labelOverride`.

---

## G

### GBN (Global Business Network)

The consultancy where the intuitive-logics scenario method (the dominant 2×2 driving-force approach) was codified by Schwartz, Wack, and Ogilvy in the 1980s. The TUNA tool's purpose is to address structural weaknesses of the GBN method — see spec §2.

---

## I

### Importance

A seed-level property measuring AHP-weighted state deviation from neutral. High importance means the seed pushes the high-priority factors toward extreme states.

- *Technical implementation:* `SeedScorer.importance(seed)`.
- *Formula:* `importance = Σ_i w'[i] · |v[S[i]]| / Σ_i w'[i] · maxAbs`.

---

## M

### Morphological Analysis

Zwicky's (1969) method for systematically exploring multi-dimensional configuration spaces by enumerating combinations of factor states. For N factors with K states, the morphological space contains `K^N` configurations.

- *Technical implementation:* `MorphologicalSpaceGenerator` domain service. Capped at 200,000 configurations.

### Morphological Space

The exhaustive set of factor-state configurations for the carried-forward factors. Enumerated by base-K decomposition of the seed index.

---

## O

### OSPA (Oxford Scenario Planning Approach)

Saïd Business School's variant of intuitive-logics scenario planning. Distinguished by the three arrows of time and the contextual/transactional environment split. The TUNA tool draws its temporal grounding directly from OSPA.

---

## P

### Path-Dependency

The degree to which a factor's future state is constrained by accumulated past commitments and lock-in (the *blue arrow*). High path-dependency means the factor cannot easily move regardless of velocity or proximity.

- *Technical implementation:* `ArrowProfile.pathDep ∈ [0, 1]`.

### Pairwise Comparison

The atomic operation in AHP — the user compares two items on Saaty's 1–9 ratio scale. Used to weight criteria against each other (step 3) and factors against each other under each criterion (step 4).

- *Technical implementation:* `PairwiseMatrix` value object.

### Priority Vector

The output of AHP — a probability vector summing to 1 representing the relative priority of each item under comparison.

- *Technical implementation:* `PriorityVector` value object.

### Project

The aggregate root containing a complete scenario analysis session. Holds factors, criteria, all pairwise matrices, arrows, states, coupling, and selected seeds.

- *Technical implementation:* `Project` entity (aggregate root).

### Proximity (to Threshold)

How close a factor is to a state-changing threshold (part of the *red arrow*). High proximity means the factor is on the edge of qualitative change.

- *Technical implementation:* `ArrowProfile.proximity ∈ [0, 1]`.

---

## S

### Saaty Intensity

A discrete value on Saaty's 1–9 ratio scale, with reciprocals: `{1/9, 1/8, ..., 1/2, 1, 2, ..., 8, 9}`. Encodes the strength of a pairwise preference: 1 = equal, 3 = moderate, 5 = strong, 7 = very strong, 9 = extreme.

- *Technical implementation:* `SaatyIntensity` value object.

### Scenario Seed (Seed)

A vector of factor-state assignments representing a starting position for narrative scenario development. **Not a finished scenario** — the strategist still writes the story, identifies signals, and develops strategic implications. The tool's contribution is to ensure narrative work begins from a defensible structural position.

- *Technical implementation:* `ScenarioSeed` entity carrying a seed vector and a `SeedScore`.
- *Synonym to avoid:* "scenario" alone — this is reserved for the finished narrative product, which is *not* what the tool produces.

### Seed Distance

Weighted Hamming-style distance between two seeds, used by the `SeedSelector` to enforce diversity. `distance(S_a, S_b) = Σ_i w'[i] · |v[S_a[i]] - v[S_b[i]]| / (max v - min v) · (1 / Σ_i w'[i])`.

### Seed Score

The triple `(importance, coherence, convergence)` plus the combined `score = ((1-φ)·imp + φ·conv) · coherence`. φ is the user-controlled convergence focus.

- *Technical implementation:* `SeedScore` value object.

### Seed Set

The user-facing collection of selected seeds — typically 4 — produced by the `SeedSelector` from the filtered morphological space.

### Synthesis

The step where per-criterion factor priorities are combined with criterion weights into global factor weights, and the top-N factors are carried forward into the morphological stage.

- *Technical implementation:* `FactorWeightSynthesizer` domain service; `SynthesizeFactors` use case.

---

## T

### Trigger

A directional causal trigger from one factor to another (factor A's extreme state pushes factor B). Distinct from coupling — coupling is symmetric strength; triggers are asymmetric directional pushes.

- *Technical implementation:* `TriggerMatrix` value object; boolean, asymmetric, zero diagonal.

### TUNA

Turbulent, Unpredictable, Novel, Ambiguous. Oxford's term for the conditions that justify scenario planning over forecasting. The intersection of Emery & Trist's turbulent fields (1965) with Knightian uncertainty (1921).

---

## V

### Velocity

The rate at which a factor's contextual future is arriving (part of the *red arrow*). High velocity means the future is approaching fast.

- *Technical implementation:* `ArrowProfile.velocity ∈ [0, 1]`. Drives the arrival-window computation: `years[i] = (1 - velocity[i]) · HORIZON_YEARS`.

---

## Synonyms To Avoid

| Avoid | Use Instead | Why |
|---|---|---|
| variable, driver, trend | factor | Domain-precise; matches spec |
| metric | criterion | "Metric" is ambiguous and quantitative-flavoured |
| consistency (for seeds) | coherence | "Consistency" is reserved for AHP's CR |
| coherence (for matrices) | consistency ratio | Symmetric to the above |
| scenario | scenario seed | The tool produces seeds, not finished scenarios |
| weight (for arrows) | criticality | "Weight" is reserved for AHP-derived factor priorities |
| score (unqualified) | importance / coherence / convergence / combined score | Be specific; "score" alone is ambiguous |
| dimension (for factor states) | state | "Dimension" is sometimes used informally for factors themselves |
| matrix (unqualified) | pairwise / coupling / trigger matrix | Three different matrix types coexist |

---

*This glossary is generated by the `/ddd` command. Regenerate to update; do not edit manually.*
