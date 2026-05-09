# OSPA Factor Extraction Prompt

A prompt for extracting morphological-analysis-ready factors from a corpus of source material — podcasts, transcripts, reports, articles, primary documents — for input to the TUNA Scenario Selector tool.

Built on the Oxford Scenario Planning Approach (Ramírez & Wilkinson, 2016) with explicit anti-failure-mode engineering.

---

## How to use this prompt

1. **Assemble your corpus.** Anything text-based: podcast transcripts, research reports, white papers, board minutes, expert interviews, news articles, primary documents. Two to ten substantial sources tends to work best. Fewer than two and the factor set will be thin; more than ten and the model may struggle to synthesise.

2. **Define your strategic question.** Be specific about the decision the scenarios will inform. "What does AI mean for our business?" is too broad; "Should we acquire an AI capability or build it, given a 5-year horizon?" is the right level. A clear question tightens factor selection significantly.

3. **Set your horizon.** Five years for tactical questions, ten to fifteen for strategic, twenty-plus for foresight. The horizon affects which factors qualify — a factor that resolves outside the horizon has low time-horizon-fit.

4. **Decide your audience.** Investors, board, executive team, policy, mixed. This affects how factors should be framed.

5. **Paste the prompt below into Claude (Sonnet 4.5 or Opus 4.7), append your corpus, and run.**

6. **Review the output critically.** The prompt is engineered to surface candidate factors that the tool can use, but the strategist still owns the final selection. Treat the output as a strong first draft, not a finished factor list.

7. **Import the JSON into the tool** via the existing import format (matches `ai-economy-factors.json`).

---

## The prompt

```
You are an Oxford Scenario Planning Approach (OSPA) practitioner working under
the Ramírez and Wilkinson methodology. Your task is to extract a structured
factor set from a corpus of source material that can be used as input to a
morphological scenario analysis tool.

This is not PESTLE analysis. It is not driver-mapping. It is OSPA — which means
factors must come from the contextual environment (forces over which the
strategist has no direct control), must be plausible drivers of bifurcation
under TUNA conditions (Turbulent, Unpredictable, Novel, Ambiguous), and must
respect the three arrows of time: forces flowing backward from the contextual
future, forces flowing forward from path-dependent accumulated past, and the
strategic intent projected from the present.

Bifurcation occurs not when these arrows "converge in time" but when forces
from different temporal origins INTERACT to produce emergent states neither
force alone would produce. Your factor selection must enable that kind of
interaction analysis.

# === STRATEGIC QUESTION ===
[INSERT YOUR STRATEGIC QUESTION HERE — e.g.:
"What configurations of AI capability, compute supply, and economic integration
should we plan for over a 15-year horizon, given an investment thesis in
AI-enabled enterprise software?"]

# === PLANNING HORIZON ===
[INSERT NUMBER OF YEARS — e.g. 15]

# === AUDIENCE ===
[INSERT AUDIENCE — e.g. "Investment committee at a technology-focused PE fund"]

# === CORPUS ===
[PASTE OR ATTACH SOURCE MATERIAL HERE. For each source, include:
- Source name and date
- Source type (podcast transcript / report / article / primary document)
- Source URL if available
- Full text or substantial excerpt]


# === YOUR TASK ===

Work through the following six stages. Show your work for stages 1-4 in
<thinking> tags, then produce the final structured output as JSON in the
specified schema.

## Stage 1: Corpus inventory

For each source in the corpus, identify:
- The source's central thesis or claim
- The implicit time horizon the source operates on
- The factors the source treats as fixed vs. uncertain
- The source's stated or implied position on the strategic question

This stage is descriptive. Do not synthesise yet.

## Stage 2: Candidate factor generation (cast wide)

Generate 15-25 candidate driving forces. For each candidate:
- Name it as a noun phrase describing a force, not an event or outcome
  (✓ "Memory supply scaling rate"  ✗ "Memory crunch happens in 2027")
- Note which source(s) it appears in, with at least one direct quote
- Note whether it operates on contextual environment (uncontrollable) or
  transactional environment (negotiable). OSPA factors must be contextual.
- Note its temporal origin: future-bearing (regulation, demographic shifts,
  technology maturity), past-bearing (lock-in, infrastructure, accumulated
  capital), or present-bearing (strategic commitments now being made)

Cast wide. It is better to over-generate at this stage and prune in stage 3.

## Stage 3: Candidate filtering

From the candidate list, eliminate factors that fail any of these tests:

- TRANSACTIONAL: Factor is in the strategist's direct control or negotiable
  with named counterparties. Drop it.

- DOWNSTREAM: Factor is an outcome or symptom of deeper variables already in
  the list. Replace with the deeper variable.

- COLLAPSED: Factor is empirically near-identical to another factor (correlation
  > 0.8 in expected behaviour). Merge them or drop one.

- HORIZON-MISMATCHED: Factor resolves entirely before the start of the horizon
  or has not begun to move within the horizon. Drop unless its resolution
  shapes the early period.

- UNGROUNDED: Factor is supported by zero direct quotes from the corpus and
  appears to come from your training data rather than the source material.
  Drop it.

- VAGUE: Factor cannot be assigned three plausible distinct future states
  with concrete labels. Drop it.

State explicitly which candidates you are eliminating and why.

## Stage 4: Final factor selection

From the survivors, select 6-10 final factors. Optimise for:

- INDEPENDENCE: Factors should move on at least partly independent dynamics.
  A configuration where all factors move together is a single scenario, not
  a morphological space.

- BIFURCATION POTENTIAL: At least 3 factors should be capable of producing
  qualitatively different futures depending on which state they land in.

- INTERACTION DENSITY: Factors should be coupled in ways that, when at extreme
  states, produce emergent third states (e.g., regulation-from-future plus
  underinvestment-from-past produces stranded-asset crisis).

- TEMPORAL SPREAD: The factor set should include forces from at least two of
  the three temporal origins (future-bearing, past-bearing, present-bearing).

- CORPUS GROUNDING: Each final factor must be supported by at least one direct
  quote from the corpus.

For each final factor, prepare:

(a) A snake_case ID (lowercase, underscores, max 30 chars)
(b) A noun-phrase name (max 50 chars)
(c) A description (60-150 words) explaining why it's a driving force
(d) ONE direct quote from the corpus that grounds the factor, with attribution
(e) Three concrete state labels (low/mid/high) that describe genuinely
    distinct futures, not just "less of it / some / more of it"

## Stage 5: Arrow profile estimation

For each final factor, estimate four properties on a 0-to-1 scale, with
explicit reasoning grounded in the corpus:

- VELOCITY: How fast is the factor currently moving toward an extreme state?
  0 = static, 1 = moving rapidly. Look for corpus claims about pace of change.

- PROXIMITY: How close is the factor to a threshold or tipping point?
  0 = far from threshold, 1 = at threshold. Look for corpus claims about
  imminent transitions.

- PATH-DEPENDENCY: How much does accumulated past lock in the trajectory?
  0 = no lock-in, fluid; 1 = decades of accumulated structure. Look for
  corpus claims about sunk infrastructure, supplier relationships, etc.

- CONSEQUENCE-ASYMMETRY: How asymmetric is the consequence between low and
  high states? 0 = symmetric, 1 = civilisation-shaping in one direction
  vs. trivial in the other. Look for corpus claims about the magnitude of
  outcomes.

State your reasoning for each value. Don't anchor to defaults.

## Stage 6: Coupling and triggering

Identify the meaningful relationships between final factors:

- COUPLING (signed -9 to +9): Symmetric structural relationship. Positive =
  reinforcing (factors tend to move together); negative = damping (factors
  tend to move oppositely). 0 = independent. Only encode pairs where the
  corpus supports a non-zero relationship — do not invent couplings.

- TRIGGERING (directional): Asymmetric causal relationship. "A triggers B"
  means a state change in A causally drives a state change in B but not
  vice versa. Use sparingly.

For each coupling and triggering relationship, cite the corpus support.

# === OUTPUT FORMAT ===

Produce a single JSON object that conforms exactly to the following schema.
This output is consumed directly by the TUNA Scenario Selector tool. Do not
include markdown fences, preamble, or commentary — just the JSON object,
starting with { and ending with }.

{
  "version": 1,
  "name": "[Concise name for this factor set, e.g. 'AI economy — 15-year futures']",
  "description": "[2-3 sentence summary of corpus and analytical scope]",
  "horizonYears": [number],

  "factors": [
    {
      "id": "[snake_case_id]",
      "name": "[Noun phrase name]",
      "description": "[60-150 word description]",
      "sourceQuote": "[Direct quote — Author, source]",
      "stateLabels": {
        "low": "[Concrete distinct future at low state]",
        "mid": "[Concrete distinct future at mid state]",
        "high": "[Concrete distinct future at high state]"
      }
    }
    // ... 6-10 factors total
  ],

  "criteria": [
    { "id": "impact", "name": "Impact Magnitude", "description": "How large is the consequence if the factor moves to an extreme state?" },
    { "id": "uncertainty", "name": "Uncertainty", "description": "How wide is the range of plausible outcomes? Knightian-uncertainty factors score high." },
    { "id": "decision_relevance", "name": "Decision Relevance", "description": "How much does the factor's resolution change what an investor or operator should do today?" },
    { "id": "time_horizon_fit", "name": "Time Horizon Fit", "description": "Does the factor resolve within the horizon, or is it slower or faster?" },
    { "id": "causal_independence", "name": "Causal Independence", "description": "Does the factor move independently of the others, or is it a proxy for something deeper?" }
  ],

  "factorArrows": {
    "[factor_id]": {
      "velocity": [0.0-1.0],
      "proximity": [0.0-1.0],
      "pathDep": [0.0-1.0],
      "consequence": [0.0-1.0]
    }
    // ... one entry per factor
  },

  "factorArrowsExplanation": {
    "velocity": "[1-2 sentences explaining how velocity values were assigned across the factor set]",
    "proximity": "[1-2 sentences]",
    "pathDep": "[1-2 sentences]",
    "consequence": "[1-2 sentences]"
  },

  "couplingNotes": [
    "[factor_a] ↔ [factor_b]: [reinforcing|damping] ([signed value]). [Mechanism, citing corpus]"
    // ... one entry per non-zero coupling
  ],

  "triggerNotes": [
    "[factor_source] → [factor_target]: [Mechanism, citing corpus]"
    // ... one entry per triggering relationship
  ],

  "strategicContext": {
    "purpose": "[The strategic question this factor set is designed to inform]",
    "audience": "[Audience descriptor]",
    "documents": [
      {
        "name": "[Source name and date]",
        "sourceUrl": "[URL if available]",
        "summary": "[2-3 sentence summary of source's central thesis and contribution to factor set]"
      }
      // ... one entry per major source in the corpus
    ]
  }
}

# === FINAL DISCIPLINE CHECK ===

Before producing the JSON, verify:

[ ] Every factor is grounded in a direct corpus quote.
[ ] No factor is in the strategist's direct control (transactional environment).
[ ] No two factors are near-identical proxies for the same underlying variable.
[ ] State labels are concrete distinct futures, not generic intensity gradients.
[ ] Arrow values vary across the factor set (no clustering at 0.5).
[ ] Couplings are corpus-supported, not invented to fill the matrix.
[ ] At least one coupling is damping (negative); not all relationships are reinforcing.
[ ] The factor set as a whole could plausibly generate scenarios that surprise
    a thoughtful reader of the corpus.

If any check fails, return to the relevant stage and fix it before producing
the JSON.

Begin Stage 1 now.
```

---

## Notes on the prompt's design

A few decisions worth understanding if you adapt the prompt for different domains.

**Stage 2 is deliberately wider than the final output.** Asking the model to generate 15-25 candidates and then prune to 6-10 is materially better than asking it for 6-10 directly. The pruning stage forces the model to articulate elimination reasoning, which catches the failure modes (transactional drift, downstream proxies, vagueness) that single-pass generation tends to commit silently.

**The "anti-failure-mode" tests in Stage 3 are deliberately harsh.** Most LLM-generated factor lists fail at least three of these tests when produced naively. Naming the failure modes explicitly forces the model to either fix them or declare which compromises it is making, which is more honest than producing a clean-looking list that quietly contains transactional or downstream factors.

**Direct quotes are required.** Without this constraint, the model regresses to its training data and generates factors that sound right for the domain but are not actually present in your corpus. The quote requirement disciplines the extraction toward what your specific sources actually say.

**The temporal-origin tagging in Stage 2 connects directly to the OSPA three-arrows model.** Asking the model to label each factor as future-bearing, past-bearing, or present-bearing makes the temporal spread requirement in Stage 4 enforceable. Without explicit tagging, models tend to over-index on present-bearing factors (the easiest to articulate) and miss the bifurcation potential that comes from future-past interaction.

**The final discipline check is genuine.** The model is told to return to earlier stages if checks fail. In practice, with Sonnet 4.5 or Opus 4.7, the check catches roughly 30-50% of first-pass outputs and produces a measurably better final factor set. With weaker models it may need to be enforced manually.

**Stage 5 (arrow estimation) is the weakest stage methodologically.** LLMs are not well-calibrated for these kinds of probability-like estimates. The values it produces should be treated as a starting point for the strategist's own elicitation in the tool's Step 6, not as final values. The prompt asks for explicit reasoning grounded in the corpus to make the estimates auditable rather than hidden.

**Stage 6 (coupling) is also weak.** The prompt errs on the side of asking for fewer couplings, only those clearly corpus-supported. Empty cells in the coupling matrix are better than invented values, because invented values mislead the morphological filter into rejecting genuinely plausible seeds.

**The output schema matches the tool's import format exactly.** That means the JSON can be saved to a file and imported through the existing fixture-loading path with no transformation. If you change the tool's schema in future, the prompt will need to be updated to match.

---

## When to adapt the prompt

The prompt is built for AI/technology/economics-style strategic questions because that is the validated domain. For meaningfully different domains, consider these adaptations:

- **Geopolitics/macro:** Add a stage between 2 and 3 that asks the model to identify factors operating at different scales (global, regional, national, sectoral) and ensure spread across scales in the final set.
- **Healthcare/regulated industries:** Add a regulatory-cycle factor explicitly, and tighten the velocity scale because regulatory change has a different tempo than commercial change.
- **Climate/long-horizon:** Increase the planning horizon to 30+ years, and adapt the path-dependency scale because climate factors operate on timescales where path-dependency saturates.
- **Internal organisational change:** This is mostly a transactional environment, so OSPA is not the right framework. Use a different methodology.

---

## Validation: testing the prompt against a known-good output

You can validate the prompt's output by running it on a corpus you have already processed manually. The expected pattern:

- Factor count should land in the 6-10 range (not all 25 candidates).
- Each factor should have a corpus quote.
- Arrow values should vary meaningfully (not cluster at 0.5).
- Couplings should be sparse (typically 5-12 non-zero couplings for 8 factors, not 28).
- At least one coupling should be damping.
- The factor set should include forces from at least two temporal origins.

If the output fails these checks, the prompt should be re-run with stronger emphasis on the failed dimension, or run on a stronger model.
