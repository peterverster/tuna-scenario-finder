import React, { useState, useMemo, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Plus, X, AlertCircle, RotateCcw, Info, Sparkles, ArrowRight, Clock, Zap, Anchor, Target, Download, Upload, Check, BookOpen, Compass, Layers, Activity, Ban, FileText, Share2, Copy, AlertTriangle, Sun, Moon } from 'lucide-react';

// ============================================================
// CONSTANTS
// ============================================================

const RI = {
  1: 0, 2: 0, 3: 0.58, 4: 0.9, 5: 1.12, 6: 1.24,
  7: 1.32, 8: 1.41, 9: 1.45, 10: 1.49, 11: 1.51,
  12: 1.48, 13: 1.56, 14: 1.57, 15: 1.59
};

// ============================================================
// DEFAULT FIXTURE — AI and the economy, 15-year horizon
// Derived from Karpathy (Oct 2025) and Dylan Patel (Mar 2026) on Dwarkesh
// ============================================================

const DEFAULT_FACTORS = [
  { id: 'capability_rate',     name: 'AI Capability Progress Rate', description: 'Pace at which the cognitive deficits Karpathy identifies — continual learning, distillation, agent robustness — get resolved. Decade-of-agents thesis.' },
  { id: 'rl_replacement',      name: 'RL Paradigm Replacement',     description: 'Whether the review-and-distill replacement for outcome-based RL gets cracked. "Sucking supervision through a straw." Discrete bifurcation candidate.' },
  { id: 'asml_supply',         name: 'ASML / EUV Tool Production',  description: 'EUV tool production rate — currently 70/yr, projected ~100 by 2030. Dylan: most binding constraint on AI compute by 2030.' },
  { id: 'memory_supply',       name: 'Memory Supply (HBM/DRAM)',    description: 'HBM/DRAM scaling and the consumer-demand-destruction release valve. 30% of hyperscaler CapEx is memory.' },
  { id: 'lab_agi_pill',        name: 'Lab AGI-Pilledness',          description: 'How aggressively leading labs commit compute on long timelines. OpenAI > Anthropic > Google through 2025; Nvidia "AGI-pilled minus one".' },
  { id: 'china_west',          name: 'China-West Divergence',       description: 'Whether China indigenises the semiconductor supply chain by 2030, and at what scale. DUV likely; EUV in lab but not at scale.' },
  { id: 'us_power',            name: 'US Power & Data Centre Scaling', description: 'Whether power emerges as a binding constraint or stays solved by aeroderivatives, reciprocating engines, fuel cells, peaker absorption.' },
  { id: 'agi_gdp_integration', name: 'AGI Economic Integration Mode', description: 'Whether AGI blends into the 2% GDP exponential (Karpathy) or produces a regime-change to 10-20%+ growth. The transcripts\' deepest disagreement.' },
];

const DEFAULT_CRITERIA = [
  { id: 'impact',       name: 'Impact Magnitude',     description: 'How much could this factor reshape the future?' },
  { id: 'uncertainty',  name: 'Uncertainty',          description: 'How unpredictable is the trajectory?' },
  { id: 'relevance',    name: 'Decision Relevance',   description: 'Does it change what an investor or operator should do today?' },
  { id: 'horizon',      name: 'Time Horizon Fit',     description: 'Does it manifest within a 15-year window?' },
  { id: 'independence', name: 'Causal Independence',  description: 'Does it operate independently of the other factors?' },
];

const DEFAULT_STATES = [
  { value: -1, label: 'Low' },
  { value: 0, label: 'Mid' },
  { value: 1, label: 'High' },
];

const DEFAULT_ARROW = { velocity: 0.5, pathDep: 0.5, proximity: 0.5, consequence: 0 };

// Per-factor arrows derived from transcript claims (see ai-economy-factors.json)
const DEFAULT_FACTOR_ARROWS = {
  capability_rate:     { velocity: 0.75, proximity: 0.65, pathDep: 0.40, consequence: 0.70 },
  rl_replacement:      { velocity: 0.55, proximity: 0.70, pathDep: 0.20, consequence: 0.60 },
  asml_supply:         { velocity: 0.30, proximity: 0.55, pathDep: 0.85, consequence: 0.65 },
  memory_supply:       { velocity: 0.80, proximity: 0.85, pathDep: 0.55, consequence: 0.40 },
  lab_agi_pill:        { velocity: 0.65, proximity: 0.50, pathDep: 0.35, consequence: 0.55 },
  china_west:          { velocity: 0.40, proximity: 0.45, pathDep: 0.80, consequence: 0.75 },
  us_power:            { velocity: 0.55, proximity: 0.60, pathDep: 0.50, consequence: 0.30 },
  agi_gdp_integration: { velocity: 0.25, proximity: 0.30, pathDep: 0.90, consequence: 0.95 },
};

// Per-factor state-label overrides (concrete meanings of Low/Mid/High per factor)
const DEFAULT_STATE_LABELS = {
  capability_rate:     { 0: 'Stalled — RL holds',    1: 'Karpathy decade',           2: 'Rapid — AGI <5y' },
  rl_replacement:      { 0: 'RL persists',           1: 'Hybrid emerges',            2: 'Paradigm shift' },
  asml_supply:         { 0: '~70/yr ceiling',        1: '~100/yr as projected',      2: 'Aggressive expansion' },
  memory_supply:       { 0: 'Crunch intensifies',    1: 'Smartphone destruction',    2: '3D DRAM unlocks' },
  lab_agi_pill:        { 0: 'Pull-back',             1: 'Current asymmetry',         2: 'Uniform aggression' },
  china_west:          { 0: 'China stays trailing',  1: 'Trailing-edge match',       2: 'Indigenous EUV at scale' },
  us_power:            { 0: 'Belief throttles CapEx', 1: 'Non-binding as Dylan says', 2: 'Power abundance' },
  agi_gdp_integration: { 0: 'Karpathy mode (2%)',    1: 'Inflection (4-6%)',         2: 'Regime change (10-20%)' },
};

// AHP criteria pairwise matrix — produces priorities approximately [0.19, 0.16, 0.31, 0.10, 0.25]
// Reflects: Decision Relevance dominant, Causal Independence high, Horizon lowest. CR ~0.016.
const DEFAULT_CRITERIA_MATRIX = [
  [1,    1,    1/2,  2,    1   ],
  [1,    1,    1/2,  2,    1/2 ],
  [2,    2,    1,    3,    1   ],
  [1/2,  1/2,  1/3,  1,    1/2 ],
  [1,    2,    1,    2,    1   ],
];

// AHP factor matrices — one per criterion. Order matches DEFAULT_FACTORS.
// All CRs verified < 0.02 (well within Saaty's 0.10 threshold).
const DEFAULT_FACTOR_MATRICES = {
  // Impact: capability_rate, agi_gdp, asml highest
  impact: [
    [1,    2,    1,    2,    3,    2,    3,    1   ],
    [1/2,  1,    1/2,  1,    1,    1,    2,    1/2 ],
    [1,    2,    1,    2,    2,    2,    3,    1   ],
    [1/2,  1,    1/2,  1,    1,    1,    2,    1/2 ],
    [1/3,  1,    1/2,  1,    1,    1,    1,    1/3 ],
    [1/2,  1,    1/2,  1,    1,    1,    2,    1/2 ],
    [1/3,  1/2,  1/3,  1/2,  1,    1/2,  1,    1/3 ],
    [1,    2,    1,    2,    3,    2,    3,    1   ],
  ],
  // Uncertainty: agi_gdp, rl_replacement, china_west highest
  uncertainty: [
    [1,    1/2,  1,    1,    1,    1/2,  2,    1/2 ],
    [2,    1,    2,    2,    2,    1,    3,    1   ],
    [1,    1/2,  1,    1,    1,    1/2,  2,    1/2 ],
    [1,    1/2,  1,    1,    1/2,  1/2,  1,    1/3 ],
    [1,    1/2,  1,    2,    1,    1,    2,    1/2 ],
    [2,    1,    2,    2,    1,    1,    3,    1   ],
    [1/2,  1/3,  1/2,  1,    1/2,  1/3,  1,    1/3 ],
    [2,    1,    2,    3,    2,    1,    3,    1   ],
  ],
  // Decision Relevance: asml, memory, lab_agi_pill highest — actionable today
  relevance: [
    [1,    2,    1/2,  1/2,  1/2,  2,    2,    1   ],
    [1/2,  1,    1/3,  1/2,  1/2,  1,    1,    1   ],
    [2,    3,    1,    1,    1,    3,    3,    2   ],
    [2,    2,    1,    1,    1,    2,    3,    2   ],
    [2,    2,    1,    1,    1,    2,    3,    2   ],
    [1/2,  1,    1/3,  1/2,  1/2,  1,    1,    1   ],
    [1/2,  1,    1/3,  1/3,  1/3,  1,    1,    1/2 ],
    [1,    1,    1/2,  1/2,  1/2,  1,    2,    1   ],
  ],
  // Time Horizon Fit: memory, capability, lab_agi_pill resolve in window
  horizon: [
    [1,    2,    2,    1,    1,    3,    2,    2   ],
    [1/2,  1,    1,    1/2,  1/2,  2,    2,    2   ],
    [1/2,  1,    1,    1/2,  1/2,  2,    1,    1   ],
    [1,    2,    2,    1,    1,    3,    3,    3   ],
    [1,    2,    2,    1,    1,    3,    2,    2   ],
    [1/3,  1/2,  1/2,  1/3,  1/3,  1,    1,    1   ],
    [1/2,  1/2,  1,    1/3,  1/2,  1,    1,    1   ],
    [1/2,  1/2,  1,    1/3,  1/2,  1,    1,    1   ],
  ],
  // Causal Independence: agi_gdp, china_west, asml, us_power most independent
  independence: [
    [1,    1,    1/2,  1,    1,    1/2,  1/2,  1   ],
    [1,    1,    1/2,  1,    1,    1/2,  1/2,  1   ],
    [2,    2,    1,    2,    2,    1,    1,    2   ],
    [1,    1,    1/2,  1,    1,    1/2,  1/2,  1   ],
    [1,    1,    1/2,  1,    1,    1/2,  1/2,  1   ],
    [2,    2,    1,    2,    2,    1,    1,    2   ],
    [2,    2,    1,    2,    2,    1,    1,    2   ],
    [1,    1,    1/2,  1,    1,    1/2,  1/2,  1   ],
  ],
};

// Coupling matrix — 8×8, signed -9 to +9. Reflects transcript-derived structural relations.
// Order matches DEFAULT_FACTORS (capability, rl, asml, memory, lab, china, power, agi_gdp).
const DEFAULT_COUPLING = [
  // cap   rl    asml  mem   lab   chin  pow   gdp
  [  0,    8,    0,    0,    4,    0,    0,    7  ],  // capability_rate
  [  8,    0,    0,    0,    3,    0,    0,    5  ],  // rl_replacement
  [  0,    0,    0,    5,    6,   -6,    2,    0  ],  // asml_supply
  [  0,    0,    5,    0,    4,    0,    0,    0  ],  // memory_supply
  [  4,    3,    6,    4,    0,    0,    3,    4  ],  // lab_agi_pill
  [  0,    0,   -6,    0,    0,    0,    0,   -3  ],  // china_west
  [  0,    0,    2,    0,    3,    0,    0,    0  ],  // us_power
  [  7,    5,    0,    0,    4,   -3,    0,    0  ],  // agi_gdp_integration
];

// Triggering chains — directional. trigger[i][j] = 1 means i triggers j.
const DEFAULT_TRIGGERS = [
  // cap  rl  asml mem  lab  chin pow  gdp
  [  0,   0,  0,   0,   0,   0,   0,   1  ],  // capability_rate → agi_gdp
  [  1,   0,  0,   0,   0,   0,   0,   0  ],  // rl_replacement → capability_rate
  [  0,   0,  0,   1,   0,   0,   0,   0  ],  // asml_supply → memory_supply
  [  0,   0,  0,   0,   1,   0,   0,   0  ],  // memory_supply → lab_agi_pill (crunch shakes confidence)
  [  0,   0,  1,   1,   0,   0,   1,   0  ],  // lab_agi_pill → asml, memory, power (commitment cascades)
  [  0,   0,  0,   0,   0,   0,   0,   0  ],
  [  0,   0,  0,   0,   0,   0,   0,   0  ],
  [  0,   0,  0,   0,   0,   0,   0,   0  ],
];

const DEFAULT_PURPOSE = `Stress-testing investment thesis for AI-product and AI-infrastructure positions over a 15-year horizon. Want to identify configurations where conventional bull-case assumptions fail — particularly scenarios where capability progress is real but compute supply throttles deployment, or where compute scales but capability stalls. Factor set derived from Andrej Karpathy (Oct 2025, "AGI is still a decade away") and Dylan Patel (March 2026, "Three big bottlenecks to scaling AI compute") on the Dwarkesh Podcast.`;

const DEFAULT_DOCUMENTS = [
  {
    id: 'doc_karpathy',
    name: 'Karpathy on Dwarkesh — Oct 2025 (summary)',
    content: `Andrej Karpathy on the Dwarkesh Podcast, 17 Oct 2025. "AGI is still a decade away."

Core claims:
- Decade of agents, not year of agents. Cognitive deficits are tractable but still difficult.
- Reinforcement learning is terrible — "sucking supervision through a straw" — but everything before it was worse. Need 3-5 more major algorithmic updates.
- Models silently collapse during training; humans collapse over time too. Synthetic data alone can't fix this.
- We're not building animals (evolution); we're building "ghosts" via internet imitation. Different starting point.
- Cognitive cores can be ~1B parameters if pre-training data improves. Internet is mostly garbage.
- AGI will blend into the 2.5 centuries of 2% GDP growth, not produce a discontinuous jump. Industrial Revolution was the singular event; AI continues the same exponential.
- LLMs work for code because code is text and infrastructure exists. Other domains lag because diff/preview infrastructure isn't built.
- Coding models are like compilers, not employee replacements — productivity tool, not labour replacement.`,
    included: true,
  },
  {
    id: 'doc_dylan',
    name: 'Dylan Patel on Dwarkesh — March 2026 (summary)',
    content: `Dylan Patel of SemiAnalysis on the Dwarkesh Podcast, 13 March 2026. "Deep dive on the 3 big bottlenecks to scaling AI compute."

Core claims:
- Three bottlenecks: logic, memory, power. By 2030 the binding one is ASML.
- ASML produces 70 EUV tools/year today, ~100 by 2030 under aggressive expansion. Each gigawatt of Rubin needs ~3.5 EUV tools.
- Hopper H100 is worth more today than 3 years ago — value is bounded by what models can extract from it, not by hardware specs.
- Memory crunch: 30% of hyperscaler CapEx is memory. Smartphone volumes may halve to free DRAM for AI. Consumer revolt likely.
- Nvidia secured TSMC allocation early; Google is squeezed and now catching up (Gemini 3 + Nano Banana revenue inflection woke them up).
- Anthropic was conservative on compute, now constrained. OpenAI YOLO-signed deals and has more access. Lab AGI-pilledness is asymmetric.
- China indigenises DUV by 2030, EUV working in lab but not high-volume. By 2030+ if takeoff is slow, Chinese vertical integration matters.
- Power is "not really a problem" — aeroderivatives, reciprocating engines, ship engines, Bloom fuel cells, peaker absorption all available.
- AGI-pilledness cascades down supply chain: labs > Nvidia > foundries > equipment makers. Each builds X-1 or X/2 because not pilled enough.
- 3D DRAM by end of decade could unlock memory; still requires EUV.`,
    included: true,
  },
];

const STEPS = [
  { num: 1, label: 'Factors' },
  { num: 2, label: 'Criteria' },
  { num: 3, label: 'Weight' },
  { num: 4, label: 'Score' },
  { num: 5, label: 'Synthesis' },
  { num: 6, label: 'Arrows' },
  { num: 7, label: 'States' },
  { num: 8, label: 'Coupling' },
  { num: 9, label: 'Context' },
  { num: 10, label: 'Seeds' },
];

const AUDIENCE_PRESETS = [
  { id: 'investors', label: 'Investors / VC' },
  { id: 'board', label: 'Board / executive' },
  { id: 'policy', label: 'Policy / public sector' },
  { id: 'academic', label: 'Academic / research' },
  { id: 'workshop', label: 'Strategy workshop' },
  { id: 'mixed', label: 'Mixed / general' },
  { id: 'custom', label: 'Custom (specify)' },
];

const SEED_COLORS = [
  '#f59e0b', '#10b981', '#0ea5e9', '#f43f5e',
  '#a855f7', '#06b6d4', '#f97316', '#84cc16'
];

const HORIZON_YEARS = 15; // velocity 0 → 15 yrs out, velocity 1 → 0 yrs

// Persistence + sharing
const SCHEMA_VERSION = 'tuna-scenario/v1';
const SCENARIO_PATH_PREFIX = '/scenarios/';
const SCENARIO_FETCH_TIMEOUT_MS = 5000;
const PUBLISH_HEAD_TIMEOUT_MS = 1000;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// ============================================================
// MATH
// ============================================================

// Saaty convention: button on the LEFT side of centre means LEFT item dominates.
// A[i][j] > 1 ⇔ left item (i) more important; A[i][j] < 1 ⇔ right item (j) more important.
// Therefore: negative pos (left button) → A[i][j] > 1; positive pos (right button) → A[i][j] < 1.
const posToVal = (p) => {
  if (p === 0) return 1;
  return p < 0 ? Math.abs(p) + 1 : 1 / (p + 1);
};
const valToPos = (v) => {
  if (Math.abs(v - 1) < 1e-9) return 0;
  if (v > 1) return -Math.round(v - 1);   // left item dominant → left-side button (negative)
  return Math.round(1 / v - 1);            // right item dominant → right-side button (positive)
};

function priorityVector(matrix) {
  const n = matrix.length;
  if (n === 0) return [];
  const geo = matrix.map(row => Math.pow(row.reduce((a, b) => a * b, 1), 1 / n));
  const sum = geo.reduce((a, b) => a + b, 0);
  return geo.map(g => g / sum);
}

function consistencyRatio(matrix, w) {
  const n = matrix.length;
  if (n < 3) return 0;
  const Aw = matrix.map(row => row.reduce((s, v, j) => s + v * w[j], 0));
  const lambda = Aw.reduce((s, v, i) => s + v / w[i], 0) / n;
  const CI = (lambda - n) / (n - 1);
  const ri = RI[n] || 1.59;
  return ri > 0 ? CI / ri : 0;
}

function identityMatrix(n) {
  return Array.from({ length: n }, () => Array.from({ length: n }, () => 1));
}

function setMatrixVal(matrix, i, j, val) {
  const m = matrix.map(r => [...r]);
  m[i][j] = val;
  m[j][i] = 1 / val;
  return m;
}

function generateAllSeeds(numFactors, numStates, cap = 200000) {
  const total = Math.pow(numStates, numFactors);
  if (total > cap) return { seeds: null, total };
  const seeds = new Array(total);
  for (let idx = 0; idx < total; idx++) {
    const seed = new Array(numFactors);
    let n = idx;
    for (let i = 0; i < numFactors; i++) {
      seed[i] = n % numStates;
      n = Math.floor(n / numStates);
    }
    seeds[idx] = seed;
  }
  return { seeds, total };
}

// Per-factor criticality from arrows
function calcCriticality(arrow) {
  const v = arrow.velocity ?? 0.5;
  const p = arrow.proximity ?? 0.5;
  const d = arrow.pathDep ?? 0.5;
  // velocity × proximity, amplified by path-dependency (0.5 base, up to 1.0)
  return v * p * (0.5 + 0.5 * d);
}

function scoreSeed(seed, factorWeights, criticalities, signedCoupling, stateValues) {
  const N = seed.length;
  const maxAbs = Math.max(...stateValues.map(Math.abs)) || 1;
  const valueRange = (Math.max(...stateValues) - Math.min(...stateValues)) || 1;

  // Importance (AHP-weighted state deviation)
  let totalImp = 0;
  let maxImp = 0;
  for (let i = 0; i < N; i++) {
    const v = stateValues[seed[i]];
    totalImp += factorWeights[i] * Math.abs(v);
    maxImp += factorWeights[i] * maxAbs;
  }
  const importance = maxImp > 0 ? totalImp / maxImp : 0;

  // Coherence with signed coupling
  // c > 0 (reinforcing): penalty if states diverge
  // c < 0 (damping): penalty if states align
  let totalPenalty = 0;
  let totalCouplingMag = 0;
  for (let i = 0; i < N; i++) {
    for (let j = i + 1; j < N; j++) {
      const c = (signedCoupling[i]?.[j] ?? 0) / 9;
      if (c === 0) continue;
      const stateDiff = Math.abs(stateValues[seed[i]] - stateValues[seed[j]]) / valueRange;
      let pairPenalty;
      if (c > 0) {
        pairPenalty = c * stateDiff;
      } else {
        pairPenalty = (-c) * (1 - stateDiff);
      }
      totalPenalty += pairPenalty;
      totalCouplingMag += Math.abs(c);
    }
  }
  const coherence = totalCouplingMag > 0 ? Math.max(0, 1 - (totalPenalty / totalCouplingMag)) : 1;

  // Convergence potential: criticality-weighted state deviation, amplified by co-deviation
  let convWeighted = 0;
  let convMax = 0;
  let activeCritical = 0;
  for (let i = 0; i < N; i++) {
    const dev = Math.abs(stateValues[seed[i]]) / maxAbs;
    convWeighted += criticalities[i] * dev;
    convMax += criticalities[i];
    if (criticalities[i] > 0.35 && dev > 0.5) activeCritical++;
  }
  const baseConv = convMax > 0 ? convWeighted / convMax : 0;
  const amplifier = 1 + 0.12 * Math.max(0, activeCritical - 1);
  const convergence = Math.min(1, baseConv * amplifier);

  return { importance, coherence, convergence };
}

function combinedScore(s, convergenceFocus) {
  // Coherence is always required (multiplicative)
  // Blend importance and convergence based on focus slider
  const blended = (1 - convergenceFocus) * s.importance + convergenceFocus * s.convergence;
  return blended * s.coherence;
}

function weightedSeedDistance(a, b, factorWeights, stateValues) {
  const valueRange = (Math.max(...stateValues) - Math.min(...stateValues)) || 1;
  let dist = 0;
  let maxDist = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = Math.abs(stateValues[a[i]] - stateValues[b[i]]) / valueRange;
    dist += factorWeights[i] * diff;
    maxDist += factorWeights[i];
  }
  return maxDist > 0 ? dist / maxDist : 0;
}

function selectDiverseSeeds(scoredSeeds, K, alpha, factorWeights, stateValues, convergenceFocus) {
  if (scoredSeeds.length === 0) return [];
  const withScore = scoredSeeds.map(s => ({ ...s, score: combinedScore(s, convergenceFocus) }));
  const sorted = [...withScore].sort((a, b) => b.score - a.score);
  const selected = [sorted[0]];
  const remaining = new Set(sorted.slice(1));

  while (selected.length < K && remaining.size > 0) {
    let best = null;
    let bestUtility = -Infinity;
    for (const cand of remaining) {
      let minDist = Infinity;
      for (const sel of selected) {
        const d = weightedSeedDistance(cand.seed, sel.seed, factorWeights, stateValues);
        if (d < minDist) minDist = d;
      }
      const utility = alpha * cand.score + (1 - alpha) * minDist;
      if (utility > bestUtility) { bestUtility = utility; best = cand; }
    }
    if (best) { selected.push(best); remaining.delete(best); } else break;
  }

  // === Hill-climbing refinement ===
  // Greedy farthest-first is myopic — it commits early choices that might be
  // suboptimal once K is filled. We refine by iteratively swapping each selected
  // seed against its best alternative, keeping the swap if it raises the global
  // utility (alpha-weighted blend of mean score and minimum pairwise distance).
  // Converges in 2-4 passes for typical K.
  const refinedSet = refineSelection(selected, withScore, K, alpha, factorWeights, stateValues);

  return refinedSet.map((s, i) => {
    let totalD = 0; let count = 0;
    refinedSet.forEach((other, j) => {
      if (i !== j) {
        totalD += weightedSeedDistance(s.seed, other.seed, factorWeights, stateValues);
        count++;
      }
    });
    return { ...s, avgDistance: count > 0 ? totalD / count : 0 };
  });
}

// Hill-climbing pass over the selected K-set. For each slot, try swapping with
// every non-selected candidate; accept the swap if it improves the global
// utility. Repeat until a full pass produces no improvement (capped at 8 passes).
function refineSelection(initial, allCandidates, K, alpha, factorWeights, stateValues) {
  if (initial.length < 2) return initial;

  const score = (set) => globalUtility(set, alpha, factorWeights, stateValues);

  let current = [...initial];
  let currentScore = score(current);

  const selectedSeeds = new Set(current.map(c => c.seed.join(',')));
  const pool = allCandidates.filter(c => !selectedSeeds.has(c.seed.join(',')));

  let improved = true;
  let passes = 0;
  const MAX_PASSES = 8;

  while (improved && passes < MAX_PASSES) {
    improved = false;
    passes++;
    for (let slot = 0; slot < current.length; slot++) {
      let bestSwap = null;
      let bestSwapScore = currentScore;
      for (const cand of pool) {
        const trial = [...current];
        trial[slot] = cand;
        const trialScore = score(trial);
        if (trialScore > bestSwapScore + 1e-9) {
          bestSwapScore = trialScore;
          bestSwap = cand;
        }
      }
      if (bestSwap) {
        const ejected = current[slot];
        current[slot] = bestSwap;
        currentScore = bestSwapScore;
        // Update pool: ejected returns, swapped-in is removed
        const idx = pool.indexOf(bestSwap);
        if (idx !== -1) pool.splice(idx, 1);
        pool.push(ejected);
        improved = true;
      }
    }
  }

  return current;
}

// Global utility of a candidate set: alpha-weighted blend of mean score and
// minimum pairwise distance. Identical objective to the greedy step but
// evaluated over the whole set rather than incrementally.
function globalUtility(set, alpha, factorWeights, stateValues) {
  if (set.length === 0) return 0;
  const meanScore = set.reduce((s, x) => s + x.score, 0) / set.length;
  let minDist = Infinity;
  for (let i = 0; i < set.length; i++) {
    for (let j = i + 1; j < set.length; j++) {
      const d = weightedSeedDistance(set[i].seed, set[j].seed, factorWeights, stateValues);
      if (d < minDist) minDist = d;
    }
  }
  if (minDist === Infinity) minDist = 0;
  return alpha * meanScore + (1 - alpha) * minDist;
}

// Estimate arrival window for a seed in years
// === Hard vetoes ===
//
// Vetoes are factor-state pairs the strategist marks as logically impossible
// regardless of other context. They override the soft coherence score and act
// as an absolute filter — any seed containing a vetoed pair is removed before
// scoring. This addresses the "compensation effect" failure mode of pure
// aggregate-coupling: a fatal contradiction between two factors cannot be
// masked by alignment elsewhere in the seed.
//
// A veto is encoded as a string key "i:s_a|j:s_b" where i<j and s_a, s_b are
// state indices. The Set form is JSON-serialisable as an array of keys.

function vetoKey(i, sa, j, sb) {
  // Normalise so smaller factor index is first
  if (i > j) { [i, j] = [j, i]; [sa, sb] = [sb, sa]; }
  return `${i}:${sa}|${j}:${sb}`;
}

function parseVetoKey(key) {
  const [a, b] = key.split('|');
  const [i, sa] = a.split(':').map(Number);
  const [j, sb] = b.split(':').map(Number);
  return { i, sa, j, sb };
}

function seedViolatesVeto(seed, vetoes) {
  if (!vetoes || vetoes.size === 0) return null;
  for (let i = 0; i < seed.length; i++) {
    for (let j = i + 1; j < seed.length; j++) {
      const key = vetoKey(i, seed[i], j, seed[j]);
      if (vetoes.has(key)) return key;
    }
  }
  return null;
}


//
// Replaces the previous linear `years = (1 - velocity) * H` with a saturating
// sigmoid keyed on the full criticality product (velocity × proximity × pathDep).
// This encodes the complexity-economics intuition: factors with weak criticality
// drift toward the horizon at a near-linear rate, while factors with strong
// criticality cluster their arrivals tightly near the bifurcation point as
// reinforcing dynamics compound.
//
// Shape: a logistic curve centred at criticality=0.5, with steepness alpha=8.
// At criticality 0   → arrival ≈ H
// At criticality 0.5 → arrival ≈ H / 2
// At criticality 1   → arrival ≈ 0
function arrivalFromCriticality(velocity, proximity, pathDep, horizon) {
  const criticality = velocity * proximity * (0.5 + 0.5 * pathDep);
  const alpha = 8;
  const x = criticality - 0.5;
  // Logistic decay: 1 / (1 + exp(alpha * x)) maps [0,1] criticality → [~1, ~0]
  const decay = 1 / (1 + Math.exp(alpha * x));
  return horizon * decay;
}

function estimateArrival(seed, arrows, factors, stateValues) {
  const yearsList = [];
  const arrivingFactors = [];
  const maxAbs = Math.max(...stateValues.map(Math.abs)) || 1;
  for (let i = 0; i < seed.length; i++) {
    const dev = Math.abs(stateValues[seed[i]]) / maxAbs;
    if (dev < 0.4) continue;
    const a = arrows[factors[i].id] || DEFAULT_ARROW;
    const yrs = arrivalFromCriticality(a.velocity, a.proximity, a.pathDep, HORIZON_YEARS);
    yearsList.push(yrs);
    arrivingFactors.push({ factor: factors[i], years: yrs, arrow: a, deviation: dev });
  }
  if (yearsList.length === 0) return { min: HORIZON_YEARS, max: HORIZON_YEARS, median: HORIZON_YEARS, arriving: [] };
  yearsList.sort((a, b) => a - b);
  return {
    min: yearsList[0],
    max: yearsList[yearsList.length - 1],
    median: yearsList[Math.floor(yearsList.length / 2)],
    arriving: arrivingFactors.sort((a, b) => a.years - b.years),
  };
}

// ============================================================
// PERSISTENCE
// ============================================================

// Generate a UUID v4. Uses crypto.randomUUID where available, with a Math.random
// fallback for older browsers (good enough for unique identifiers; warns once).
let _uuidWarned = false;
function generateUuid() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  if (!_uuidWarned) {
    console.warn('crypto.randomUUID unavailable; falling back to Math.random UUID v4.');
    _uuidWarned = true;
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function isValidUuid(s) {
  return typeof s === 'string' && UUID_REGEX.test(s);
}

// Convert a Set of veto keys into a stable, sorted array for serialisation.
function serialiseVetoes(vetoesSet) {
  return Array.from(vetoesSet || []).sort();
}

// Build the canonical project file (FR-001 schema).
function serializeProject(state) {
  const {
    scenarioId, projectName,
    factors, criteria, criteriaMatrix, factorMatrices, topN,
    factorArrows, factorStates, stateLabelOverrides,
    couplingMatrix, triggerMatrix, vetoes,
    K, alpha, convergenceFocus, coherenceThreshold,
    seedNames, seedPhases,
    purpose, audiencePreset, audienceCustom, documents,
  } = state;
  return {
    schema: SCHEMA_VERSION,
    scenarioId,
    meta: {
      exportedAt: new Date().toISOString(),
      appVersion: import.meta?.env?.VITE_APP_VERSION || 'dev',
      projectName: (projectName && projectName.trim()) || 'Untitled',
    },
    project: {
      factors,
      criteria,
      criteriaMatrix,
      factorMatrices,
      topN,
      factorArrows,
      factorStates,
      stateLabelOverrides,
      couplingMatrix,
      triggerMatrix,
      vetoes: serialiseVetoes(vetoes),
      generation: { K, alpha, convergenceFocus, coherenceThreshold },
      seedNames,
      seedPhases,
      context: { purpose, audiencePreset, audienceCustom, documents },
    },
  };
}

// Lightweight structural validation. Returns { ok, error?, state? } where state is
// a flat shape ready for setters in TUNAScenarioTool.
function deserializeProject(parsed) {
  if (!parsed || typeof parsed !== 'object') {
    return { ok: false, error: "That file isn't valid JSON." };
  }
  if (typeof parsed.schema !== 'string') {
    return { ok: false, error: 'This file is missing schema info — it may not be a TUNA project export.' };
  }
  if (parsed.schema !== SCHEMA_VERSION) {
    if (parsed.schema.startsWith('tuna-scenario/v')) {
      return { ok: false, error: 'This file was created by a different version of the tool.' };
    }
    return { ok: false, error: `Unknown schema "${parsed.schema}".` };
  }
  if (!isValidUuid(parsed.scenarioId)) {
    return { ok: false, error: 'This file is missing or has an invalid scenario ID.' };
  }
  const p = parsed.project;
  if (!p || typeof p !== 'object') {
    return { ok: false, error: 'This file is missing project data.' };
  }
  const required = [
    'factors', 'criteria', 'criteriaMatrix', 'factorMatrices', 'topN',
    'factorArrows', 'factorStates', 'stateLabelOverrides',
    'couplingMatrix', 'triggerMatrix', 'vetoes', 'generation',
    'seedNames', 'seedPhases', 'context',
  ];
  for (const k of required) {
    if (!(k in p)) return { ok: false, error: `This file is missing required data ("${k}").` };
  }
  if (!Array.isArray(p.factors) || p.factors.length === 0) {
    return { ok: false, error: 'Factors must be a non-empty array.' };
  }
  if (!Array.isArray(p.criteria) || p.criteria.length === 0) {
    return { ok: false, error: 'Criteria must be a non-empty array.' };
  }
  if (!Array.isArray(p.criteriaMatrix) || p.criteriaMatrix.length !== p.criteria.length) {
    return { ok: false, error: "The criteria pairwise matrix doesn't match the criteria count." };
  }
  for (const row of p.criteriaMatrix) {
    if (!Array.isArray(row) || row.length !== p.criteria.length) {
      return { ok: false, error: 'Criteria matrix is not square.' };
    }
  }
  if (!Array.isArray(p.couplingMatrix)) {
    return { ok: false, error: 'Coupling matrix is malformed.' };
  }
  const N = p.couplingMatrix.length;
  for (let i = 0; i < N; i++) {
    if (!Array.isArray(p.couplingMatrix[i]) || p.couplingMatrix[i].length !== N) {
      return { ok: false, error: 'Coupling matrix is not square.' };
    }
    if (p.couplingMatrix[i][i] !== 0) {
      return { ok: false, error: 'Coupling matrix diagonal must be zero.' };
    }
    for (let j = i + 1; j < N; j++) {
      if (p.couplingMatrix[i][j] !== p.couplingMatrix[j][i]) {
        return { ok: false, error: 'Coupling matrix must be symmetric.' };
      }
    }
  }
  // Seed-space cap (BR-007)
  if (Array.isArray(p.factorStates) && Number.isFinite(p.topN)) {
    const total = Math.pow(p.factorStates.length, Math.min(p.topN, p.factors.length));
    if (total > 200000) {
      return { ok: false, error: 'This project has too many seed candidates to enumerate.' };
    }
  }
  // Validation passed; flatten for state setters.
  return {
    ok: true,
    state: {
      scenarioId: parsed.scenarioId,
      projectName: parsed.meta?.projectName || 'Untitled',
      factors: p.factors,
      criteria: p.criteria,
      criteriaMatrix: p.criteriaMatrix,
      factorMatrices: p.factorMatrices,
      topN: p.topN,
      factorArrows: p.factorArrows,
      factorStates: p.factorStates,
      stateLabelOverrides: p.stateLabelOverrides,
      couplingMatrix: p.couplingMatrix,
      triggerMatrix: p.triggerMatrix,
      vetoes: new Set(Array.isArray(p.vetoes) ? p.vetoes : []),
      K: p.generation?.K ?? 4,
      alpha: p.generation?.alpha ?? 0.5,
      convergenceFocus: p.generation?.convergenceFocus ?? 0.6,
      coherenceThreshold: p.generation?.coherenceThreshold ?? 0.4,
      seedNames: p.seedNames || {},
      seedPhases: p.seedPhases || {},
      purpose: p.context?.purpose || '',
      audiencePreset: p.context?.audiencePreset || 'mixed',
      audienceCustom: p.context?.audienceCustom || '',
      documents: Array.isArray(p.context?.documents) ? p.context.documents : [],
    },
  };
}

// Trigger a Blob download for a JSON object with the given filename.
function triggerJsonDownload(filename, jsonObj) {
  const blob = new Blob([JSON.stringify(jsonObj, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Resolve the canonical host for share URLs. VITE_PUBLIC_HOST overrides
// window.location.origin (useful when the dev URL is localhost but you want to
// generate links pointing at the deployed host).
function getPublicOrigin() {
  const env = import.meta?.env?.VITE_PUBLIC_HOST;
  if (env && typeof env === 'string') return env.replace(/\/+$/, '');
  return typeof window !== 'undefined' ? window.location.origin : '';
}

// Build the share URL + JSON Blob for a state. Pure; no HTTP.
function buildShareUrl(state) {
  const id = state.scenarioId;
  const url = `${getPublicOrigin()}${SCENARIO_PATH_PREFIX}${id}`;
  const json = serializeProject(state);
  return { url, scenarioId: id, json };
}

// Extract a UUID from a `/scenarios/<uuid>` pathname; null otherwise.
function parseScenarioPath(pathname) {
  if (typeof pathname !== 'string') return null;
  const m = pathname.match(/^\/scenarios\/([0-9a-f-]{36})\/?$/i);
  if (!m) return null;
  if (!isValidUuid(m[1])) return null;
  return m[1];
}

// HEAD request with a tight timeout to detect whether <uuid>.json is reachable.
async function checkPublishStatus(uuid) {
  if (!isValidUuid(uuid)) return 'unknown';
  try {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), PUBLISH_HEAD_TIMEOUT_MS);
    const res = await fetch(`${SCENARIO_PATH_PREFIX}${uuid}.json`, { method: 'HEAD', signal: ctl.signal });
    clearTimeout(timer);
    if (res.ok) return 'live';
    if (res.status === 404) return 'not-yet';
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

// Fetch the static JSON file for a UUID and validate it. Returns
// { ok, state? , errorKind: 'not-found' | 'network' | 'format' }.
async function fetchScenarioJson(uuid) {
  if (!isValidUuid(uuid)) {
    return { ok: false, errorKind: 'format' };
  }
  try {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), SCENARIO_FETCH_TIMEOUT_MS);
    const res = await fetch(`${SCENARIO_PATH_PREFIX}${uuid}.json`, { signal: ctl.signal });
    clearTimeout(timer);
    if (res.status === 404) return { ok: false, errorKind: 'not-found' };
    if (!res.ok) return { ok: false, errorKind: 'network' };
    const parsed = await res.json();
    const result = deserializeProject(parsed);
    if (!result.ok) return { ok: false, errorKind: 'format' };
    return { ok: true, state: result.state };
  } catch {
    return { ok: false, errorKind: 'network' };
  }
}

// Read a File and return its parsed JSON content.
function readJsonFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        resolve(JSON.parse(reader.result));
      } catch {
        reject(new Error("That file isn't valid JSON."));
      }
    };
    reader.onerror = () => reject(new Error('Could not read file.'));
    reader.readAsText(file);
  });
}

// ============================================================
// SHARED UI
// ============================================================

// Fonts (Inter + Noto Sans Mono) load via index.html; Tailwind tokens map the family classes.
// font-display tightens letter-spacing and enables Inter's display-friendly OpenType features.
const fontStack = `
  .font-display { letter-spacing: -0.02em; font-feature-settings: 'cv11', 'ss01', 'ss03'; }
  .font-body { font-feature-settings: 'cv11'; }
`;

function ConsistencyBadge({ cr }) {
  const pct = (cr * 100).toFixed(1);
  let cls, label;
  if (cr <= 0.1) { cls = 'bg-signal-advisory/10 text-signal-advisory border-signal-advisory/30'; label = 'Consistent'; }
  else if (cr <= 0.15) { cls = 'bg-brand-fire/10 text-brand-fire border-brand-fire/30'; label = 'Borderline'; }
  else { cls = 'bg-signal-press/10 text-signal-press border-signal-press/30'; label = 'Inconsistent'; }
  return (
    <span className={`inline-flex items-center gap-2 text-xs font-mono px-2.5 py-1 rounded border ${cls}`}>
      CR {pct}% · {label}
    </span>
  );
}

function PairwiseRow({ nameA, nameB, value, onChange }) {
  const pos = valToPos(value);
  const positions = [-8, -7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8];
  const intensityLabel = (p) => {
    const a = Math.abs(p);
    if (a === 0) return 'Equal';
    if (a <= 2) return 'slightly';
    if (a <= 4) return 'moderately';
    if (a <= 6) return 'strongly';
    return 'extremely';
  };
  // pos < 0 → left button → left item (nameA) is dominant
  // pos > 0 → right button → right item (nameB) is dominant
  const dominant = pos === 0 ? null : pos < 0 ? nameA : nameB;
  const description = pos === 0
    ? 'Equally important'
    : `${dominant} is ${intensityLabel(pos)} more important (${Math.abs(pos) + 1}×)`;

  const aClass = pos === 0
    ? 'text-ink-secondary'
    : pos < 0 ? 'text-brand-fire/80' : 'text-ink-muted';
  const bClass = pos === 0
    ? 'text-ink-secondary'
    : pos > 0 ? 'text-brand-fire/80' : 'text-ink-muted';

  return (
    <div className="py-3 border-b border-surface-border last:border-0">
      <div className="flex items-center gap-4 mb-2">
        <div className={`flex-1 text-right text-sm font-medium transition-colors ${aClass}`}>{nameA}</div>
        <div className="text-xs font-mono text-ink-muted px-2">vs</div>
        <div className={`flex-1 text-left text-sm font-medium transition-colors ${bClass}`}>{nameB}</div>
      </div>
      <div className="flex justify-center gap-0.5">
        {positions.map(p => {
          const isCenter = p === 0;
          const active = pos === p;
          return (
            <button
              key={p}
              onClick={() => onChange(posToVal(p))}
              className={`
                ${isCenter ? 'w-8' : 'w-7'} h-8 text-xs font-mono rounded transition-all
                ${active
                  ? 'bg-brand-fire text-surface-base font-semibold shadow-lg shadow-brand-fire/20'
                  : isCenter
                    ? 'bg-surface-border text-ink-secondary hover:bg-ink-muted'
                    : 'bg-surface-border text-ink-muted hover:bg-surface-border hover:text-ink-secondary'
                }
              `}
              title={isCenter ? 'Equal' : `${Math.abs(p) + 1}× ${p < 0 ? nameA : nameB}`}
            >
              {isCenter ? '1' : Math.abs(p) + 1}
            </button>
          );
        })}
      </div>
      <div className="text-center mt-2 text-xs font-mono text-ink-muted">{description}</div>
    </div>
  );
}

function SmallSlider({ label, icon: Icon, value, onChange, min = 0, max = 1, step = 0.05, leftLabel, rightLabel, signed }) {
  const pct = signed
    ? ((value - min) / (max - min)) * 100
    : (value / (max - min)) * 100;
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <div className="flex items-center gap-1.5 text-xs font-mono text-ink-secondary uppercase tracking-wider">
          {Icon && <Icon size={11} />}
          {label}
        </div>
        <div className="text-xs font-mono text-brand-fire">
          {signed ? (value > 0 ? '+' : '') + value.toFixed(2) : value.toFixed(2)}
        </div>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-brand-fire"
      />
      <div className="flex justify-between text-[10px] font-mono text-ink-muted mt-1">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  );
}

function ShareModal({ isOpen, onClose, scenarioId, projectName, onProjectNameChange, onDownloadJson, onDuplicate }) {
  const [publishStatus, setPublishStatus] = useState('checking');
  const [copied, setCopied] = useState(false);
  const url = scenarioId ? `${getPublicOrigin()}${SCENARIO_PATH_PREFIX}${scenarioId}` : '';
  useEffect(() => {
    if (!isOpen || !scenarioId) return undefined;
    setPublishStatus('checking');
    setCopied(false);
    let cancelled = false;
    checkPublishStatus(scenarioId).then(s => { if (!cancelled) setPublishStatus(s); });
    return () => { cancelled = true; };
  }, [isOpen, scenarioId]);

  const onCopy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const ta = document.createElement('textarea');
        ta.value = url;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const StatusBadge = () => {
    if (publishStatus === 'live') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono bg-signal-advisory/15 text-signal-advisory border border-signal-advisory/30">
          <Check size={10} /> Published — URL is live
        </span>
      );
    }
    if (publishStatus === 'not-yet') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono bg-signal-thought/15 text-signal-thought border border-signal-thought/30">
          <AlertTriangle size={10} /> Not yet published
        </span>
      );
    }
    if (publishStatus === 'checking') {
      return <span className="text-[10px] font-mono text-ink-muted">checking…</span>;
    }
    return null;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share scenario" maxWidth="max-w-xl">
      <div className="space-y-5">
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-widest text-ink-muted mb-1.5">Project name</label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => onProjectNameChange(e.target.value)}
            placeholder="Untitled project"
            className="w-full bg-surface-base border border-surface-border rounded px-3 py-2 text-sm text-ink-primary placeholder-ink-muted focus:border-brand-fire focus:outline-none transition"
          />
          <p className="text-[10px] text-ink-muted mt-1">Used in `meta.projectName` of the export. Optional — does not affect the URL.</p>
        </div>

        <div>
          <div className="flex items-baseline justify-between mb-1.5">
            <label className="block text-[10px] font-mono uppercase tracking-widest text-ink-muted">Public URL</label>
            <StatusBadge />
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={url}
              onFocus={(e) => e.target.select()}
              className="flex-1 bg-surface-base border border-surface-border rounded px-3 py-2 text-sm font-mono text-ink-primary"
            />
            <button
              onClick={onCopy}
              className="flex items-center gap-1.5 px-3 py-2 rounded text-sm bg-brand-fire/15 hover:bg-brand-fire/25 text-brand-fire border border-brand-fire/40 transition"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        <div className="border-t border-surface-border pt-4">
          <div className="text-xs text-ink-secondary leading-relaxed mb-3">
            To make this URL live, save the JSON to <code className="font-mono text-brand-fire/80 text-[11px]">public/scenarios/{scenarioId}.json</code> in this repo, commit, and push. Vercel will redeploy and the link will resolve.
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={onDownloadJson}
              className="flex items-center gap-1.5 px-3 py-2 rounded text-sm bg-brand-fire hover:bg-brand-fire/90 text-ink-inverse font-medium transition"
            >
              <Download size={14} /> Download JSON
            </button>
            <button
              onClick={onDuplicate}
              className="flex items-center gap-1.5 px-3 py-2 rounded text-sm text-ink-secondary hover:text-ink-primary border border-surface-border hover:border-ink-muted transition"
              title="Mint a new UUID so this becomes a fork — useful when adapting a published scenario without overwriting the original."
            >
              <Sparkles size={14} /> Fork as new scenario
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) {
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`${maxWidth} w-full bg-surface-raised border border-surface-border rounded-lg shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-surface-border">
          <h2 className="font-display text-lg text-ink-primary leading-tight">{title}</h2>
          <button onClick={onClose} className="text-ink-muted hover:text-ink-primary transition" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function Toast({ message, kind = 'info', onClose }) {
  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [message, onClose]);
  if (!message) return null;
  const color = kind === 'error' ? 'border-signal-press text-signal-press'
              : kind === 'success' ? 'border-signal-advisory text-signal-advisory'
              : 'border-brand-fire/60 text-ink-primary';
  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm">
      <div className={`bg-surface-raised border rounded-lg shadow-xl px-4 py-3 text-sm ${color}`}>
        {message}
      </div>
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================

export default function TUNAScenarioTool() {
  const [step, setStep] = useState(0);
  // Theme — persisted in localStorage; defaults to dark; written to <html data-theme>.
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'dark';
    return window.localStorage.getItem('tuna-theme') || 'dark';
  });
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.setAttribute('data-theme', theme);
    window.localStorage.setItem('tuna-theme', theme);
  }, [theme]);
  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');
  // Project identity — UUID generated lazily on first export/share; persists across imports.
  const [scenarioId, setScenarioId] = useState(null);
  const [projectName, setProjectName] = useState('');
  // UI: portability dialogs and toast
  const [importError, setImportError] = useState(null);
  const [importConfirmFile, setImportConfirmFile] = useState(null);
  const [toast, setToast] = useState(null); // { message, kind }
  const [shareOpen, setShareOpen] = useState(false);
  const [loadError, setLoadError] = useState(null); // { kind: 'not-found'|'network'|'format', uuid }
  const [hydratingFromUrl, setHydratingFromUrl] = useState(() => parseScenarioPath(typeof window !== 'undefined' ? window.location.pathname : '') !== null);
  const [factors, setFactors] = useState(DEFAULT_FACTORS);
  const [criteria, setCriteria] = useState(DEFAULT_CRITERIA);
  const [criteriaMatrix, setCriteriaMatrix] = useState(() => DEFAULT_CRITERIA_MATRIX.map(r => [...r]));
  const [factorMatrices, setFactorMatrices] = useState(() => {
    const m = {};
    DEFAULT_CRITERIA.forEach(c => {
      const dm = DEFAULT_FACTOR_MATRICES[c.id];
      m[c.id] = dm ? dm.map(r => [...r]) : identityMatrix(DEFAULT_FACTORS.length);
    });
    return m;
  });
  const [topN, setTopN] = useState(8);
  const [factorArrows, setFactorArrows] = useState(() => {
    const a = {};
    DEFAULT_FACTORS.forEach(f => {
      a[f.id] = DEFAULT_FACTOR_ARROWS[f.id] ? { ...DEFAULT_FACTOR_ARROWS[f.id] } : { ...DEFAULT_ARROW };
    });
    return a;
  });
  const [factorStates, setFactorStates] = useState(DEFAULT_STATES);
  const [stateLabelOverrides, setStateLabelOverrides] = useState(() => {
    const overrides = {};
    DEFAULT_FACTORS.forEach(f => {
      if (DEFAULT_STATE_LABELS[f.id]) overrides[f.id] = { ...DEFAULT_STATE_LABELS[f.id] };
    });
    return overrides;
  });
  // Signed coupling: -9 to +9
  const [couplingMatrix, setCouplingMatrix] = useState(() => DEFAULT_COUPLING.map(r => [...r]));
  // Asymmetric trigger matrix: trigger[i][j] = does i trigger j? (0 or 1)
  const [triggerMatrix, setTriggerMatrix] = useState(() => DEFAULT_TRIGGERS.map(r => [...r]));
  // Hard vetoes — Set of vetoKey() strings. Seeds containing any vetoed pair
  // are filtered out before scoring, regardless of coherence.
  const [vetoes, setVetoes] = useState(() => new Set());
  const [K, setK] = useState(4);
  const [alpha, setAlpha] = useState(0.5);
  const [convergenceFocus, setConvergenceFocus] = useState(0.6);
  const [coherenceThreshold, setCoherenceThreshold] = useState(0.4);
  const [seedNames, setSeedNames] = useState({});
  const [seedPhases, setSeedPhases] = useState({});
  // Strategic context for AI generation
  const [purpose, setPurpose] = useState(DEFAULT_PURPOSE);
  const [audiencePreset, setAudiencePreset] = useState('investors');
  const [audienceCustom, setAudienceCustom] = useState('');
  const [documents, setDocuments] = useState(DEFAULT_DOCUMENTS.map(d => ({ ...d })));
  // AI scenario generation state
  // Errors from building the AI prompt download (kept; download itself can't fail
  // visibly, but a malformed buildPrompt could throw)
  const [generationErrors, setGenerationErrors] = useState({});

  // On mount: if URL is /scenarios/<uuid>, fetch and hydrate. Otherwise no-op.
  // We deliberately preserve the URL after hydration (refresh re-fetches).
  useEffect(() => {
    const uuid = parseScenarioPath(typeof window !== 'undefined' ? window.location.pathname : '');
    if (!uuid) return;
    let cancelled = false;
    (async () => {
      const result = await fetchScenarioJson(uuid);
      if (cancelled) return;
      if (result.ok) {
        applyHydratedState(result.state);
        setStep(10);
      } else {
        setLoadError({ kind: result.errorKind, uuid });
        setStep(0);
      }
      setHydratingFromUrl(false);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync matrices when factors / criteria change
  useEffect(() => {
    setCriteriaMatrix(prev => prev.length === criteria.length ? prev : identityMatrix(criteria.length));
    setFactorMatrices(prev => {
      const next = {};
      criteria.forEach(c => {
        const old = prev[c.id];
        next[c.id] = (old && old.length === factors.length) ? old : identityMatrix(factors.length);
      });
      return next;
    });
    setFactorArrows(prev => {
      const next = {};
      factors.forEach(f => {
        next[f.id] = prev[f.id] || { ...DEFAULT_ARROW };
      });
      return next;
    });
  }, [factors, criteria]);

  // === AHP computations ===

  const criteriaWeights = useMemo(() => priorityVector(criteriaMatrix), [criteriaMatrix]);
  const criteriaCR = useMemo(() => consistencyRatio(criteriaMatrix, criteriaWeights), [criteriaMatrix, criteriaWeights]);

  const factorWeightsByCriterion = useMemo(() => {
    const out = {};
    criteria.forEach(c => {
      const m = factorMatrices[c.id] || identityMatrix(factors.length);
      out[c.id] = priorityVector(m);
    });
    return out;
  }, [factorMatrices, criteria, factors]);

  const factorCRByCriterion = useMemo(() => {
    const out = {};
    criteria.forEach(c => {
      const m = factorMatrices[c.id] || identityMatrix(factors.length);
      out[c.id] = consistencyRatio(m, factorWeightsByCriterion[c.id] || []);
    });
    return out;
  }, [factorMatrices, criteria, factors, factorWeightsByCriterion]);

  const globalFactorWeights = useMemo(() => {
    return factors.map((f, i) => {
      let w = 0;
      criteria.forEach((c, j) => {
        w += (criteriaWeights[j] || 0) * (factorWeightsByCriterion[c.id]?.[i] || 0);
      });
      return { factor: f, weight: w };
    }).sort((a, b) => b.weight - a.weight);
  }, [factors, criteria, criteriaWeights, factorWeightsByCriterion]);

  const topFactors = useMemo(() => globalFactorWeights.slice(0, topN), [globalFactorWeights, topN]);

  // Resize coupling and trigger matrices when topN changes
  useEffect(() => {
    setCouplingMatrix(prev => {
      if (prev.length === topN) return prev;
      return Array.from({ length: topN }, (_, i) =>
        Array.from({ length: topN }, (_, j) => {
          if (i === j) return 0;
          return prev[i] && prev[i][j] !== undefined ? prev[i][j] : 0;
        })
      );
    });
    setTriggerMatrix(prev => {
      if (prev.length === topN) return prev;
      return Array.from({ length: topN }, (_, i) =>
        Array.from({ length: topN }, (_, j) => {
          if (i === j) return 0;
          return prev[i] && prev[i][j] !== undefined ? prev[i][j] : 0;
        })
      );
    });
  }, [topN]);

  // === Morphological computations ===

  const stateValues = useMemo(() => factorStates.map(s => s.value), [factorStates]);

  const topFactorWeights = useMemo(() => {
    const sum = topFactors.reduce((s, f) => s + f.weight, 0);
    return topFactors.map(f => sum > 0 ? f.weight / sum : 1 / topFactors.length);
  }, [topFactors]);

  const topCriticalities = useMemo(() => {
    return topFactors.map(tf => calcCriticality(factorArrows[tf.factor.id] || DEFAULT_ARROW));
  }, [topFactors, factorArrows]);

  const seedSpace = useMemo(() => {
    return generateAllSeeds(topFactors.length, factorStates.length);
  }, [topFactors.length, factorStates.length]);

  // Hard-veto filter — runs before scoring to enforce absolute exclusions.
  // The compensation effect of pure aggregate-coupling cannot mask a vetoed
  // factor-state pair regardless of how internally coherent the rest of the
  // seed appears.
  const vetoSurvivors = useMemo(() => {
    if (!seedSpace.seeds) return { seeds: [], rejected: 0 };
    if (vetoes.size === 0) return { seeds: seedSpace.seeds, rejected: 0 };
    const ok = [];
    let rejected = 0;
    for (const seed of seedSpace.seeds) {
      if (seedViolatesVeto(seed, vetoes)) rejected++;
      else ok.push(seed);
    }
    return { seeds: ok, rejected };
  }, [seedSpace, vetoes]);

  const scoredSeeds = useMemo(() => {
    if (!vetoSurvivors.seeds || vetoSurvivors.seeds.length === 0) return [];
    return vetoSurvivors.seeds.map(seed => ({
      seed,
      ...scoreSeed(seed, topFactorWeights, topCriticalities, couplingMatrix, stateValues),
    }));
  }, [vetoSurvivors, topFactorWeights, topCriticalities, couplingMatrix, stateValues]);

  const filteredSeeds = useMemo(() => {
    return scoredSeeds.filter(s => s.coherence >= coherenceThreshold);
  }, [scoredSeeds, coherenceThreshold]);

  const selectedSeeds = useMemo(() => {
    return selectDiverseSeeds(filteredSeeds, K, alpha, topFactorWeights, stateValues, convergenceFocus);
  }, [filteredSeeds, K, alpha, topFactorWeights, stateValues, convergenceFocus]);

  // Add arrival metadata to selected seeds
  const enrichedSeeds = useMemo(() => {
    return selectedSeeds.map(s => ({
      ...s,
      arrival: estimateArrival(s.seed, factorArrows, topFactors.map(tf => tf.factor), stateValues),
    }));
  }, [selectedSeeds, factorArrows, topFactors, stateValues]);

  // === Validation ===
  const canProceed = {
    0: true,
    1: factors.length >= 3, 2: criteria.length >= 2, 3: true, 4: true,
    5: true, 6: true, 7: factorStates.length >= 2, 8: true, 9: true, 10: true,
  };

  // === Project identity helpers ===
  // Returns the current scenarioId, generating one lazily if missing.
  const ensureScenarioId = () => {
    if (scenarioId) return scenarioId;
    const id = generateUuid();
    setScenarioId(id);
    return id;
  };

  // Snapshot all serialisable state. The id passed in lets callers force a fresh UUID.
  const collectState = (id) => ({
    scenarioId: id,
    projectName,
    factors, criteria, criteriaMatrix, factorMatrices, topN,
    factorArrows, factorStates, stateLabelOverrides,
    couplingMatrix, triggerMatrix, vetoes,
    K, alpha, convergenceFocus, coherenceThreshold,
    seedNames, seedPhases,
    purpose, audiencePreset, audienceCustom, documents,
  });

  // Apply a hydrated, validated state object to all React setters atomically.
  const applyHydratedState = (s) => {
    setScenarioId(s.scenarioId);
    setProjectName(s.projectName || '');
    setFactors(s.factors);
    setCriteria(s.criteria);
    setCriteriaMatrix(s.criteriaMatrix);
    setFactorMatrices(s.factorMatrices);
    setTopN(s.topN);
    setFactorArrows(s.factorArrows);
    setFactorStates(s.factorStates);
    setStateLabelOverrides(s.stateLabelOverrides);
    setCouplingMatrix(s.couplingMatrix);
    setTriggerMatrix(s.triggerMatrix);
    setVetoes(s.vetoes);
    setK(s.K);
    setAlpha(s.alpha);
    setConvergenceFocus(s.convergenceFocus);
    setCoherenceThreshold(s.coherenceThreshold);
    setSeedNames(s.seedNames);
    setSeedPhases(s.seedPhases);
    setPurpose(s.purpose);
    setAudiencePreset(s.audiencePreset);
    setAudienceCustom(s.audienceCustom);
    setDocuments(s.documents);
    setGenerationErrors({});
  };

  // === Export / Import / Share ===
  const handleExport = () => {
    const id = ensureScenarioId();
    const json = serializeProject(collectState(id));
    triggerJsonDownload(`${id}.json`, json);
    setToast({ message: 'Scenario exported.', kind: 'success' });
  };

  const handleShareOpen = () => {
    ensureScenarioId();
    setShareOpen(true);
  };

  // Mint a new UUID for a fork — used when the user wants a variant of a
  // published scenario without overwriting the original.
  const handleDuplicate = () => {
    const newId = generateUuid();
    setScenarioId(newId);
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', '/');
    }
    setToast({ message: 'Forked. New scenario ID assigned.', kind: 'success' });
  };

  const handleImportClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      // Confirm if the user has done meaningful work (i.e., an existing scenarioId)
      if (scenarioId) {
        setImportConfirmFile(file);
      } else {
        await runImport(file);
      }
    };
    input.click();
  };

  const runImport = async (file) => {
    setImportError(null);
    try {
      const parsed = await readJsonFile(file);
      const result = deserializeProject(parsed);
      if (!result.ok) {
        setImportError(result.error);
        setToast({ message: result.error, kind: 'error' });
        return;
      }
      applyHydratedState(result.state);
      setStep(10);
      setToast({ message: 'Scenario imported.', kind: 'success' });
    } catch (e) {
      const msg = e.message || 'Could not read file.';
      setImportError(msg);
      setToast({ message: msg, kind: 'error' });
    }
  };

  // === Reset ===
  const handleReset = () => {
    if (!confirm('Reset all data to the AI-and-economy fixture?')) return;
    setScenarioId(null);
    setProjectName('');
    setLoadError(null);
    if (typeof window !== 'undefined' && parseScenarioPath(window.location.pathname)) {
      window.history.pushState(null, '', '/');
    }
    setFactors(DEFAULT_FACTORS);
    setCriteria(DEFAULT_CRITERIA);
    setCriteriaMatrix(DEFAULT_CRITERIA_MATRIX.map(r => [...r]));
    const fm = {};
    DEFAULT_CRITERIA.forEach(c => {
      const dm = DEFAULT_FACTOR_MATRICES[c.id];
      fm[c.id] = dm ? dm.map(r => [...r]) : identityMatrix(DEFAULT_FACTORS.length);
    });
    setFactorMatrices(fm);
    setTopN(8);
    const fa = {};
    DEFAULT_FACTORS.forEach(f => {
      fa[f.id] = DEFAULT_FACTOR_ARROWS[f.id] ? { ...DEFAULT_FACTOR_ARROWS[f.id] } : { ...DEFAULT_ARROW };
    });
    setFactorArrows(fa);
    setFactorStates(DEFAULT_STATES);
    const overrides = {};
    DEFAULT_FACTORS.forEach(f => {
      if (DEFAULT_STATE_LABELS[f.id]) overrides[f.id] = { ...DEFAULT_STATE_LABELS[f.id] };
    });
    setStateLabelOverrides(overrides);
    setCouplingMatrix(DEFAULT_COUPLING.map(r => [...r]));
    setTriggerMatrix(DEFAULT_TRIGGERS.map(r => [...r]));
    setVetoes(new Set());
    setK(4); setAlpha(0.5); setConvergenceFocus(0.6); setCoherenceThreshold(0.4);
    setSeedNames({}); setSeedPhases({});
    setPurpose(DEFAULT_PURPOSE);
    setAudiencePreset('investors');
    setAudienceCustom('');
    setDocuments(DEFAULT_DOCUMENTS.map(d => ({ ...d })));
    setGenerationErrors({});
    setStep(1);
  };

  // === Step renderer ===

  const renderStep = () => {
    switch (step) {
      case 0: return <StepIntro onBegin={() => setStep(1)} />;
      case 1: return <StepFactors factors={factors} setFactors={setFactors} />;
      case 2: return <StepCriteria criteria={criteria} setCriteria={setCriteria} />;
      case 3: return <StepWeightCriteria criteria={criteria} matrix={criteriaMatrix} setMatrix={setCriteriaMatrix} weights={criteriaWeights} cr={criteriaCR} />;
      case 4: return <StepScoreFactors factors={factors} criteria={criteria} matrices={factorMatrices} setMatrices={setFactorMatrices} weightsByCriterion={factorWeightsByCriterion} crByCriterion={factorCRByCriterion} />;
      case 5: return <StepSynthesis factors={factors} criteria={criteria} factorWeightsByCriterion={factorWeightsByCriterion} globalFactorWeights={globalFactorWeights} topN={topN} setTopN={setTopN} />;
      case 6: return <StepArrows topFactors={topFactors} factorArrows={factorArrows} setFactorArrows={setFactorArrows} />;
      case 7: return <StepStates factorStates={factorStates} setFactorStates={setFactorStates} topFactors={topFactors} stateLabelOverrides={stateLabelOverrides} setStateLabelOverrides={setStateLabelOverrides} />;
      case 8: return <StepCoupling topFactors={topFactors} couplingMatrix={couplingMatrix} setCouplingMatrix={setCouplingMatrix} triggerMatrix={triggerMatrix} setTriggerMatrix={setTriggerMatrix} vetoes={vetoes} setVetoes={setVetoes} factorStates={factorStates} stateLabelOverrides={stateLabelOverrides} />;
      case 9: return <StepContext purpose={purpose} setPurpose={setPurpose} audiencePreset={audiencePreset} setAudiencePreset={setAudiencePreset} audienceCustom={audienceCustom} setAudienceCustom={setAudienceCustom} documents={documents} setDocuments={setDocuments} />;
      case 10: return <StepSeeds topFactors={topFactors} factorStates={factorStates} stateLabelOverrides={stateLabelOverrides} seedSpace={seedSpace} vetoSurvivors={vetoSurvivors} vetoes={vetoes} scoredSeeds={scoredSeeds} filteredSeeds={filteredSeeds} selectedSeeds={enrichedSeeds} K={K} setK={setK} alpha={alpha} setAlpha={setAlpha} convergenceFocus={convergenceFocus} setConvergenceFocus={setConvergenceFocus} coherenceThreshold={coherenceThreshold} setCoherenceThreshold={setCoherenceThreshold} seedNames={seedNames} setSeedNames={setSeedNames} seedPhases={seedPhases} setSeedPhases={setSeedPhases} topFactorWeights={topFactorWeights} topCriticalities={topCriticalities} factorArrows={factorArrows} couplingMatrix={couplingMatrix} triggerMatrix={triggerMatrix} generationErrors={generationErrors} setGenerationErrors={setGenerationErrors} purpose={purpose} audiencePreset={audiencePreset} audienceCustom={audienceCustom} documents={documents} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-surface-base text-ink-primary font-body">
      <style>{fontStack}</style>

      <div className="border-b border-surface-border bg-surface-raised/50 backdrop-blur sticky top-0 z-10">
        {step === 0 ? (
          /* === Landing header — quiet wordmark + nav (per design) === */
          <div className="max-w-[1240px] mx-auto px-6 lg:px-8 py-[18px] flex items-center justify-between gap-6">
            <div className="flex items-baseline gap-3">
              <span className="font-semibold text-[16px] tracking-[-0.01em] text-ink-primary">Peter Verster</span>
              <span className="inline-block w-[22px] h-px bg-ink-muted mx-1" aria-hidden="true" />
              <span className="font-mono text-[11px] tracking-[0.04em] text-ink-muted">TUNA Scenario Finder</span>
            </div>
            <nav className="flex items-center gap-7">
              <a href="#problem" className="hidden md:inline text-[13px] font-medium text-ink-secondary hover:text-ink-primary transition">The problem</a>
              <a href="#method" className="hidden md:inline text-[13px] font-medium text-ink-secondary hover:text-ink-primary transition">Method</a>
              <button
                onClick={toggleTheme}
                className="text-ink-secondary hover:text-ink-primary transition p-1.5"
                title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
                aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              >
                {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
              </button>
              <button
                onClick={() => setStep(1)}
                className="text-[13px] font-medium text-ink-primary px-3.5 py-2 border border-surface-border hover:border-ink-primary rounded-full bg-surface-raised transition"
              >
                Begin →
              </button>
            </nav>
          </div>
        ) : (
          /* === Wizard header — full chrome (Import/Export/Share/Reset etc.) === */
          <div className="max-w-6xl mx-auto px-6 py-5">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setStep(0)}
                className="text-left group"
                title="Return to introduction"
              >
                <h1 className="font-display text-2xl text-ink-primary leading-tight group-hover:text-brand-fire transition">TUNA Scenario Finder</h1>
                <p className="text-xs font-mono text-ink-muted mt-0.5">
                  <span className="text-ink-secondary font-semibold">T</span>urbulent · <span className="text-ink-secondary font-semibold">U</span>npredictable · <span className="text-ink-secondary font-semibold">N</span>ovel · <span className="text-ink-secondary font-semibold">A</span>mbiguous
                </p>
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setStep(0)}
                  className="text-xs font-mono text-ink-muted hover:text-ink-secondary flex items-center gap-1.5 px-3 py-1.5 rounded border border-surface-border transition"
                >
                  <BookOpen size={12} /> About
                </button>
                <button
                  onClick={toggleTheme}
                  className="text-xs font-mono text-ink-muted hover:text-ink-secondary flex items-center gap-1.5 px-3 py-1.5 rounded border border-surface-border transition"
                  title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
                  aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
                >
                  {theme === 'dark' ? <Sun size={12} /> : <Moon size={12} />}
                </button>
                <button
                  onClick={handleImportClick}
                  className="text-xs font-mono text-ink-muted hover:text-ink-secondary flex items-center gap-1.5 px-3 py-1.5 rounded border border-surface-border transition"
                  title="Import a previously exported scenario JSON"
                >
                  <Upload size={12} /> Import
                </button>
                <button
                  onClick={handleExport}
                  className="text-xs font-mono text-ink-muted hover:text-ink-secondary flex items-center gap-1.5 px-3 py-1.5 rounded border border-surface-border transition"
                  title="Export this scenario as JSON"
                >
                  <Download size={12} /> Export
                </button>
                <button
                  onClick={handleShareOpen}
                  className="text-xs font-mono text-ink-muted hover:text-ink-secondary flex items-center gap-1.5 px-3 py-1.5 rounded border border-surface-border transition"
                  title="Get a shareable URL for this scenario"
                >
                  <Share2 size={12} /> Share
                </button>
                <button
                  onClick={handleReset}
                  className="text-xs font-mono text-ink-muted hover:text-ink-secondary flex items-center gap-1.5 px-3 py-1.5 rounded border border-surface-border transition"
                >
                  <RotateCcw size={12} /> Reset
                </button>
              </div>
            </div>

            <div className="flex items-center gap-1 overflow-x-auto">
              {STEPS.map((s, idx) => (
                <React.Fragment key={s.num}>
                  <button
                    onClick={() => s.num < step && setStep(s.num)}
                    disabled={s.num > step}
                    className={`
                      flex-1 py-1.5 text-xs font-mono transition relative whitespace-nowrap
                      ${s.num === step ? 'text-brand-fire' : s.num < step ? 'text-ink-secondary hover:text-ink-primary cursor-pointer' : 'text-ink-muted'}
                    `}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span className={`
                        w-5 h-5 rounded-full flex items-center justify-center text-[10px] flex-shrink-0
                        ${s.num === step ? 'bg-brand-fire text-ink-inverse' : s.num < step ? 'bg-surface-border text-ink-secondary' : 'bg-surface-border text-ink-muted'}
                      `}>
                        {s.num < step ? '✓' : s.num}
                      </span>
                      <span className="hidden lg:inline">{s.label}</span>
                    </div>
                  </button>
                  {idx < STEPS.length - 1 && <div className="w-2 h-px bg-surface-border" />}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className={step === 0 ? 'pb-24' : 'max-w-6xl mx-auto px-6 py-10 pb-32'}>
        {hydratingFromUrl && (
          <div className="px-6 py-4 text-sm font-mono text-ink-muted">Loading scenario…</div>
        )}
        {!hydratingFromUrl && step === 0 && loadError && (
          <div className="max-w-[1100px] mx-auto px-6 lg:px-8 pt-6 -mb-2">
            <div className="border border-signal-press/40 bg-signal-press/10 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle size={18} className="text-signal-press flex-shrink-0 mt-0.5" />
              <div className="text-sm text-ink-primary">
                <div className="font-medium mb-1">
                  {loadError.kind === 'not-found' && `Scenario ${loadError.uuid.slice(0, 8)} not found`}
                  {loadError.kind === 'network' && `Couldn't load scenario ${loadError.uuid.slice(0, 8)}`}
                  {loadError.kind === 'format' && `Scenario ${loadError.uuid.slice(0, 8)} is in an unsupported format`}
                </div>
                <div className="text-ink-secondary text-xs">
                  {loadError.kind === 'not-found' && 'It may have been removed, or the publisher hasn\'t pushed it yet. The default fixture has been loaded as a fallback.'}
                  {loadError.kind === 'network' && 'Check your connection and refresh. The default fixture has been loaded as a fallback.'}
                  {loadError.kind === 'format' && 'It may have been created by a different version of the tool. The default fixture has been loaded as a fallback.'}
                </div>
              </div>
            </div>
          </div>
        )}
        {!hydratingFromUrl && renderStep()}
      </div>

      {step > 0 && (
        <div className="border-t border-surface-border bg-surface-raised/50 backdrop-blur fixed bottom-0 left-0 right-0">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <button
              onClick={() => setStep(s => Math.max(0, s - 1))}
              disabled={step === 0}
              className="flex items-center gap-2 text-sm font-medium text-ink-secondary hover:text-ink-primary disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft size={16} /> Back
            </button>
            <div className="text-xs font-mono text-ink-muted">
              {`Step ${step} / ${STEPS.length}`}
            </div>
            <button
              onClick={() => setStep(s => Math.min(STEPS.length, s + 1))}
              disabled={step === STEPS.length || !canProceed[step]}
              className="flex items-center gap-2 text-sm font-medium bg-brand-fire hover:brightness-110 text-ink-inverse px-5 py-2 rounded disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              {step === STEPS.length ? 'Done' : 'Continue'} <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Share modal */}
      <ShareModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        scenarioId={scenarioId}
        projectName={projectName}
        onProjectNameChange={setProjectName}
        onDownloadJson={() => { handleExport(); }}
        onDuplicate={() => { handleDuplicate(); setShareOpen(false); }}
      />

      {/* Import confirmation modal */}
      <Modal
        isOpen={!!importConfirmFile}
        onClose={() => setImportConfirmFile(null)}
        title="Replace current scenario?"
      >
        <p className="text-sm text-ink-secondary leading-relaxed mb-5">
          Importing will replace the project you're currently working on. This can't be undone in-app — make sure to Export first if you want to keep it.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setImportConfirmFile(null)}
            className="px-4 py-2 rounded text-sm font-medium text-ink-secondary hover:text-ink-primary hover:bg-surface-muted transition"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              const f = importConfirmFile;
              setImportConfirmFile(null);
              if (f) await runImport(f);
            }}
            className="px-4 py-2 rounded text-sm font-medium bg-brand-fire hover:bg-brand-fire/90 text-ink-inverse transition"
          >
            Replace and import
          </button>
        </div>
      </Modal>

      {/* Toast notifications */}
      <Toast
        message={toast?.message}
        kind={toast?.kind}
        onClose={() => setToast(null)}
      />
    </div>
  );
}

// ============================================================
// STEP 0 — INTRODUCTION / LANDING
// ============================================================

const TUNA_LETTERS = [
  { char: 'T', word: 'turbulent' },
  { char: 'U', word: 'unpredictable' },
  { char: 'N', word: 'novel' },
  { char: 'A', word: 'ambiguous' },
];

const LANDING_PROBLEMS = [
  {
    num: '01',
    accent: 'signal-press',
    title: 'Two axes flatten reality.',
    body: 'Picking two drivers forces you to discard everything else. Real futures are shaped by ten or more entangled forces — the 2×2 collapses them into a cartoon.',
    tag: 'Reductive structure',
  },
  {
    num: '02',
    accent: 'signal-thought',
    title: "Quadrants don't have to be coherent.",
    body: 'A 2×2 cell is just an intersection. Nothing in the method guarantees the world it describes is internally consistent — you get four boxes, not four worlds.',
    tag: 'Coherence not enforced',
  },
  {
    num: '03',
    accent: 'signal-advisory',
    title: 'No anchor in time.',
    body: "The four scenarios float. There's no mechanism to pin them to a horizon, sequence the events that get you there, or stress-test how they unfold over decades.",
    tag: 'Temporally untethered',
  },
];

const LANDING_STEPS = [
  { num: '01', title: 'Frame the focal question', hint: 'scope · horizon' },
  { num: '02', title: 'Identify driving forces', hint: '10–15 drivers' },
  { num: '03', title: 'Specify driver states', hint: '3–5 each' },
  { num: '04', title: 'Build the morphological field', hint: 'cross-impact', active: true },
  { num: '05', title: 'Score consistency pairs', hint: '−2 → +2' },
  { num: '06', title: 'Sample candidate configurations', hint: 'algorithmic' },
  { num: '07', title: 'Filter for distinctness', hint: 'Hamming d ≥ k' },
  { num: '08', title: 'Test for coherence', hint: 'internal logic' },
  { num: '09', title: 'Anchor to a horizon', hint: 'timeline' },
  { num: '10', title: 'Export seeds for narrative', hint: 'JSON · markdown' },
];

const LANDING_AUDIENCE = ['Foresight teams', 'Strategy advisors', 'Boards & planning', 'Policy & risk', 'Researchers'];

// Morphological field preview — 5 drivers × 5 states with one cell active per row.
const MORPH_PREVIEW = [
  { label: 'Geopolitics',     cells: ['dim', 'on',   '',   'dim', ''   ] },
  { label: 'AI capability',   cells: [''  , 'dim',  'fire','',   'dim' ] },
  { label: 'Energy mix',      cells: ['dim','on',   '',   '',    'dim' ] },
  { label: 'Capital flows',   cells: ['',   '',     'on', 'dim', ''    ] },
  { label: 'Social trust',    cells: ['dim','',     '',   'on',  'dim' ] },
];

function MorphCell({ kind }) {
  const base = 'h-[30px] rounded transition-colors';
  if (kind === 'on')    return <div className={`${base} bg-ink-primary`} />;
  if (kind === 'fire')  return <div className={`${base} bg-brand-fire`} />;
  if (kind === 'dim')   return <div className={`${base} bg-surface-muted border border-surface-border/60`} />;
  return <div className={`${base} bg-surface-base/60 border border-surface-border/40`} />;
}

function MethodFigureSVG() {
  return (
    <svg viewBox="0 0 360 280" width="100%" height="280" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="mfFade" x1="0" x2="1">
          <stop offset="0" stopColor="rgb(var(--brand-fire))" stopOpacity="0" />
          <stop offset="0.5" stopColor="rgb(var(--brand-fire))" stopOpacity="0.85" />
          <stop offset="1" stopColor="rgb(var(--brand-fire))" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g stroke="rgb(var(--surface-border))" strokeWidth="1">
        {[40, 80, 120, 160, 200, 240].map(y => <line key={y} x1="0" y1={y} x2="360" y2={y} />)}
      </g>
      <g fontFamily="Noto Sans Mono, monospace" fontSize="9.5" className="fill-ink-muted" letterSpacing="0.04em">
        <text x="0" y="34">D1 · GEOPOLITICS</text>
        <text x="0" y="74">D2 · AI CAPABILITY</text>
        <text x="0" y="114">D3 · ENERGY MIX</text>
        <text x="0" y="154">D4 · CAPITAL FLOWS</text>
        <text x="0" y="194">D5 · SOCIAL TRUST</text>
        <text x="0" y="234">D6 · DEMOGRAPHICS</text>
      </g>
      {[
        { y: 22, fills: [0, 1, 0, 0, 0] },
        { y: 62, fills: [0, 0, 2, 0, 0] }, // 2 = fire
        { y: 102, fills: [0, 1, 0, 0, 0] },
        { y: 142, fills: [0, 0, 1, 0, 0] },
        { y: 182, fills: [0, 0, 0, 1, 0] },
        { y: 222, fills: [0, 1, 0, 0, 0] },
      ].map((row, i) =>
        row.fills.map((kind, j) => {
          const x = 200 + j * 32;
          const fill = kind === 1 ? 'rgb(var(--ink-primary))' : kind === 2 ? 'rgb(var(--brand-fire))' : 'rgb(var(--surface-muted))';
          return <rect key={`${i}-${j}`} x={x} y={row.y} width="28" height="22" rx="3" fill={fill} />;
        })
      )}
      <polyline points="246,33 278,73 246,113 278,153 310,193 246,233" fill="none" stroke="url(#mfFade)" strokeWidth="1.5" strokeDasharray="3 3" />
    </svg>
  );
}

function StepIntro({ onBegin }) {
  const accentToClass = {
    'signal-press':    { dot: 'bg-signal-press',    tag: 'text-signal-press' },
    'signal-thought':  { dot: 'bg-signal-thought',  tag: 'text-signal-thought' },
    'signal-advisory': { dot: 'bg-signal-advisory', tag: 'text-signal-advisory' },
  };

  return (
    <div>
      {/* ===================== HERO ===================== */}
      <section className="px-6 lg:px-8 pt-16 lg:pt-22 pb-20 lg:pb-24">
        <div className="max-w-[1240px] mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] gap-14 lg:gap-20 items-start">
          <div>
            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 pl-2.5 rounded-full bg-surface-raised border border-surface-border/70">
              <span className="relative inline-block w-1.5 h-1.5 rounded-full bg-brand-fire">
                <span className="absolute -inset-1 rounded-full bg-brand-fire/15" />
              </span>
              <span className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-ink-secondary">
                Strategic scenario generation under deep uncertainty
              </span>
            </div>

            <h1 className="mt-7 font-display text-[clamp(2.5rem,5vw,4.25rem)] font-medium leading-[1.04] tracking-[-0.025em] text-ink-primary max-w-[16ch] [text-wrap:pretty]">
              Scenario seeds for <span className="font-semibold text-brand-fire">TUNA</span> conditions.
            </h1>

            <p className="mt-7 text-[clamp(1.125rem,1.6vw,1.375rem)] leading-[1.45] text-ink-secondary max-w-[38ch] [text-wrap:pretty]">
              A morphological seed generator for futures characterised by{' '}
              <span className="text-ink-primary font-medium">turbulence, unpredictability, novelty, and ambiguity</span>{' '}
              — built to address the structural weaknesses of the standard 2×2 driving-forces method.
            </p>

            <div className="mt-10 flex items-center flex-wrap gap-6">
              <button
                onClick={onBegin}
                className="group inline-flex items-center gap-2.5 px-[22px] py-[13px] rounded-md bg-brand-fire hover:brightness-110 text-ink-inverse text-[15px] font-medium tracking-[-0.005em] shadow-[0_1px_0_rgba(0,0,0,0.04),0_6px_18px_-8px_rgba(255,58,5,0.55)] transition"
              >
                Begin
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
              </button>
              <a
                href="#example"
                className="group inline-flex items-center gap-2 text-[14px] font-medium text-ink-primary py-[11px] border-b border-ink-primary transition-all hover:gap-3"
              >
                See an example output
                <ArrowRight size={13} />
              </a>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-x-9 gap-y-2 font-mono text-[11.5px] tracking-wide text-ink-muted">
              <span className="inline-flex items-center gap-2 after:content-[''] after:w-[3px] after:h-[3px] after:rounded-full after:bg-surface-border after:ml-3 last:after:hidden">10 steps</span>
              <span className="inline-flex items-center gap-2 after:content-[''] after:w-[3px] after:h-[3px] after:rounded-full after:bg-surface-border after:ml-3 last:after:hidden">~30 minutes</span>
              <span className="inline-flex items-center gap-2 after:content-[''] after:w-[3px] after:h-[3px] after:rounded-full after:bg-surface-border after:ml-3 last:after:hidden">entirely client-side</span>
              <span className="inline-flex items-center">no account required</span>
            </div>

            {/* TUNA acronym block */}
            <div className="mt-14 relative bg-surface-raised border border-surface-border/70 rounded-[10px] p-7 grid grid-cols-4">
              <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-brand-fire rounded-l" aria-hidden="true" />
              {TUNA_LETTERS.map((l, i) => (
                <div key={l.char} className={`px-4 ${i < TUNA_LETTERS.length - 1 ? 'border-r border-surface-border/70' : ''}`}>
                  <div className="font-display text-[36px] font-semibold leading-none tracking-[-0.02em] text-ink-primary">{l.char}</div>
                  <div className="mt-2 font-mono text-[11px] tracking-[0.04em] text-ink-secondary lowercase">{l.word}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Hero visual: morphological field preview */}
          <aside
            aria-label="Morphological field preview"
            className="relative bg-surface-raised border border-surface-border/70 rounded-[12px] p-[22px] shadow-[0_1px_0_rgba(0,0,0,0.02),0_30px_60px_-40px_rgba(46,46,54,0.18)]"
          >
            <div className="flex items-center justify-between pb-3.5 border-b border-surface-border/60">
              <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-secondary">Morphological field — preview</div>
              <div className="font-mono text-[11px] text-ink-muted">step <span className="text-brand-fire font-medium">06 / 10</span></div>
            </div>

            <div className="pt-4">
              <div className="flex justify-between font-mono text-[10px] uppercase tracking-[0.04em] text-ink-muted mb-2.5">
                <span>Drivers ↓</span>
                <span>States →</span>
              </div>

              <div className="flex flex-col gap-2">
                {MORPH_PREVIEW.map((row, i) => (
                  <div key={i} className="grid grid-cols-[110px_1fr] gap-3.5 items-center">
                    <div className="flex items-center gap-1.5 font-mono text-[10.5px] tracking-[0.02em] text-ink-secondary">
                      <span className="w-1.5 h-1.5 rounded-full bg-surface-border" />
                      {row.label}
                    </div>
                    <div className="grid grid-cols-5 gap-1.5">
                      {row.cells.map((c, j) => <MorphCell key={j} kind={c} />)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="relative h-px mt-5 -mx-[22px] bg-gradient-to-r from-transparent via-surface-border to-transparent overflow-hidden">
                <span className="absolute -top-px h-[3px] w-[60px] bg-gradient-to-r from-transparent via-brand-fire to-transparent animate-tuna-pulse" />
              </div>

              <div className="mt-3.5 flex justify-between items-center font-mono text-[10.5px] text-ink-muted">
                <span>Selected configuration</span>
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-surface-base border border-surface-border/60 rounded">
                  seed-04 · coherence 0.87
                </span>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* ===================== AUDIENCE STRIP ===================== */}
      <div className="border-t border-b border-surface-border/70 bg-surface-muted px-6 lg:px-8 py-5">
        <div className="max-w-[1240px] mx-auto flex flex-wrap items-center gap-x-8 gap-y-2.5 font-mono text-[11.5px] tracking-[0.04em] text-ink-secondary">
          <span className="text-ink-muted text-[10.5px] uppercase">Built for</span>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {LANDING_AUDIENCE.map(a => (
              <span key={a} className="text-ink-primary font-medium">{a}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ===================== PROBLEM ===================== */}
      <section id="problem" className="px-6 lg:px-8 py-24 lg:py-30">
        <div className="max-w-[1100px] mx-auto">
          <div className="inline-flex items-center gap-3 mb-8 font-mono text-[11px] uppercase tracking-[0.08em] text-brand-fire">
            <span className="block w-7 h-px bg-brand-fire" />
            The problem
          </div>
          <h2 className="font-display text-[clamp(1.875rem,3.4vw,2.75rem)] font-medium leading-[1.1] tracking-[-0.02em] text-ink-primary max-w-[22ch] mb-6 [text-wrap:balance]">
            The dominant scenario method has three structural weaknesses.
          </h2>
          <p className="text-[17px] leading-[1.55] text-ink-secondary max-w-[65ch] [text-wrap:pretty]">
            The Global Business Network intuitive-logics method, codified by Schwartz, Wack, and Ogilvy in the 1980s, has been consensus practice in corporate strategy for forty years. It produces four scenarios by selecting two high-impact, high-uncertainty driving forces as axes of a 2×2 matrix. The method works — but experienced practitioners work around three weaknesses informally.
          </p>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-4">
            {LANDING_PROBLEMS.map(p => {
              const cls = accentToClass[p.accent];
              return (
                <article key={p.num} className="group relative bg-surface-raised border border-surface-border/70 rounded-[10px] p-7 transition-all hover:-translate-y-0.5 hover:shadow-[0_1px_0_rgba(0,0,0,0.02),0_24px_40px_-28px_rgba(46,46,54,0.2)]">
                  <div className="flex items-center gap-2.5 mb-5 font-mono text-[11px] tracking-[0.06em] text-ink-muted">
                    <span className={`w-2 h-2 rounded-sm ${cls.dot}`} />
                    Weakness {p.num}
                  </div>
                  <h3 className="font-display text-[19px] font-semibold leading-[1.3] tracking-[-0.015em] text-ink-primary mb-3">
                    {p.title}
                  </h3>
                  <p className="text-[14.5px] leading-[1.55] text-ink-secondary">{p.body}</p>
                  <div className={`mt-5 pt-4 border-t border-dashed border-surface-border/70 font-mono text-[10.5px] uppercase tracking-[0.04em] ${cls.tag}`}>
                    {p.tag}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===================== METHOD ===================== */}
      <section id="method" className="border-t border-b border-surface-border/70 bg-surface-muted px-6 lg:px-8 py-24 lg:py-30">
        <div className="max-w-[1100px] mx-auto">
          <div className="inline-flex items-center gap-3 mb-8 font-mono text-[11px] uppercase tracking-[0.08em] text-brand-fire">
            <span className="block w-7 h-px bg-brand-fire" />
            The method
          </div>
          <h2 className="font-display text-[clamp(1.875rem,3.4vw,2.75rem)] font-medium leading-[1.1] tracking-[-0.02em] text-ink-primary max-w-[22ch] mb-6 [text-wrap:balance]">
            Ten steps, from drivers to seeds.
          </h2>
          <p className="text-[17px] leading-[1.55] text-ink-secondary max-w-[65ch] [text-wrap:pretty]">
            The Finder replaces the 2×2 with a morphological field — a matrix of drivers crossed with possible states. You build it, sample it, and validate the resulting seeds for structural distinctness, internal coherence, and temporal anchoring.
          </p>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16 items-start">
            <div className="border-t border-surface-border/70">
              {LANDING_STEPS.map(s => (
                <div
                  key={s.num}
                  className={`grid grid-cols-[60px_1fr_auto] gap-4 px-2 py-[18px] border-b border-surface-border/70 items-baseline transition-colors hover:bg-surface-raised/60 ${s.active ? '' : ''}`}
                >
                  <div className={`font-mono text-[12px] tracking-[0.04em] ${s.active ? 'text-brand-fire' : 'text-ink-muted'}`}>{s.num}</div>
                  <div className="text-[15px] font-medium tracking-[-0.005em] text-ink-primary">{s.title}</div>
                  <div className="font-mono text-[11px] text-ink-muted">{s.hint}</div>
                </div>
              ))}
            </div>

            <div className="bg-surface-raised border border-surface-border/70 rounded-[10px] p-6 md:sticky md:top-24">
              <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-secondary m-0 mb-4">
                Step 04 — Building the field
              </p>
              <div className="min-h-[280px]">
                <MethodFigureSVG />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== CTA ===================== */}
      <section id="begin" className="bg-ink-primary text-surface-base px-6 lg:px-8 py-24 lg:py-30">
        <div className="max-w-[1100px] mx-auto">
          <div className="inline-flex items-center gap-3 mb-8 font-mono text-[11px] uppercase tracking-[0.08em] text-brand-fire">
            <span className="block w-7 h-px bg-brand-fire" />
            Get started
          </div>
          <h2 className="font-display text-[clamp(2.125rem,4vw,3.5rem)] font-medium leading-[1.05] tracking-[-0.025em] mb-6 max-w-[18ch] [text-wrap:balance]">
            Ten steps. Thirty minutes. <span className="text-brand-fire not-italic">Defensible seeds.</span>
          </h2>
          <p className="text-[17px] leading-[1.55] text-surface-base/70 max-w-[56ch] mb-10">
            Runs entirely in your browser. Nothing is uploaded. Export your scenario seeds as JSON or markdown when you&apos;re done — bring them into your strategy decks, narrative scenarios, or red-team workshops.
          </p>
          <div className="flex items-center gap-6 flex-wrap">
            <button
              onClick={onBegin}
              className="group inline-flex items-center gap-2.5 px-[22px] py-[13px] rounded-md bg-brand-fire hover:brightness-110 text-ink-inverse text-[15px] font-medium tracking-[-0.005em] shadow-[0_6px_18px_-8px_rgba(255,58,5,0.6)] transition"
            >
              Begin the workflow
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
            </button>
            <a
              href="/TUNA_Scenario_Finder.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 text-[14px] font-medium text-surface-base py-[11px] border-b border-surface-base/50 hover:border-surface-base transition-all hover:gap-3"
            >
              Read the methodology paper
              <ArrowRight size={13} />
            </a>
          </div>
        </div>
      </section>

      {/* ===================== FOOTER ===================== */}
      <footer className="border-t border-surface-border/70 bg-surface-base px-6 lg:px-8 py-8">
        <div className="max-w-[1240px] mx-auto flex items-baseline justify-between flex-wrap gap-5 font-mono text-[11px] tracking-[0.02em] text-ink-muted">
          <div>© 2026 Peter Verster — Advisor · Author · Strategist</div>
          <nav className="flex gap-6">
            <a href="#method" className="hover:text-ink-primary transition">Methodology</a>
            <a href="https://github.com/peterverster/tuna-scenario-finder" target="_blank" rel="noreferrer" className="hover:text-ink-primary transition">Source on GitHub</a>
            <a href="https://peterverster.com" target="_blank" rel="noreferrer" className="hover:text-ink-primary transition">peterverster.com</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}

// ============================================================
// STEP 1 — FACTORS
// ============================================================

function StepFactors({ factors, setFactors }) {
  const [draftName, setDraftName] = useState('');
  const [draftDesc, setDraftDesc] = useState('');

  const addFactor = () => {
    if (!draftName.trim()) return;
    const id = draftName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12) + Date.now().toString(36).slice(-3);
    setFactors([...factors, { id, name: draftName.trim(), description: draftDesc.trim() }]);
    setDraftName(''); setDraftDesc('');
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="text-xs font-mono text-brand-fire mb-2">STEP 01</div>
        <h2 className="font-display text-4xl text-ink-primary mb-3">Define your candidate factors</h2>
        <p className="text-ink-secondary max-w-2xl">
          The forces, drivers, and uncertainties shaping the future. Each becomes a dimension in the morphological space — every scenario seed will be a profile across all of them.
        </p>
      </div>

      <div className="space-y-2">
        {factors.map((f, idx) => (
          <div key={f.id} className="group flex items-start gap-3 p-4 bg-surface-raised rounded border border-surface-border hover:border-surface-border transition">
            <div className="text-xs font-mono text-ink-muted w-6 pt-1">{String(idx + 1).padStart(2, '0')}</div>
            <div className="flex-1 space-y-1">
              <input
                value={f.name}
                onChange={(e) => setFactors(factors.map((x, i) => i === idx ? { ...x, name: e.target.value } : x))}
                className="bg-transparent text-ink-primary font-medium w-full focus:outline-none focus:text-brand-fire/80 transition"
              />
              <input
                value={f.description}
                onChange={(e) => setFactors(factors.map((x, i) => i === idx ? { ...x, description: e.target.value } : x))}
                placeholder="Brief description"
                className="bg-transparent text-ink-muted text-sm w-full focus:outline-none focus:text-ink-secondary transition"
              />
            </div>
            <button
              onClick={() => setFactors(factors.filter((_, i) => i !== idx))}
              className="text-surface-border hover:text-signal-press transition opacity-0 group-hover:opacity-100"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      <div className="p-4 bg-surface-raised/50 rounded border border-dashed border-surface-border">
        <div className="flex gap-3">
          <input
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addFactor()}
            placeholder="New factor name"
            className="flex-1 bg-surface-raised text-ink-primary px-3 py-2 rounded border border-surface-border focus:border-brand-fire/50 focus:outline-none text-sm"
          />
          <input
            value={draftDesc}
            onChange={(e) => setDraftDesc(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addFactor()}
            placeholder="Description (optional)"
            className="flex-[2] bg-surface-raised text-ink-primary px-3 py-2 rounded border border-surface-border focus:border-brand-fire/50 focus:outline-none text-sm"
          />
          <button
            onClick={addFactor}
            disabled={!draftName.trim()}
            className="flex items-center gap-1.5 bg-surface-border hover:bg-surface-border text-ink-secondary px-4 py-2 rounded text-sm disabled:opacity-30 transition"
          >
            <Plus size={14} /> Add
          </button>
        </div>
      </div>

      {factors.length < 3 && (
        <div className="flex items-center gap-2 text-brand-fire text-sm">
          <AlertCircle size={14} /> Add at least 3 factors to continue
        </div>
      )}
    </div>
  );
}

// ============================================================
// STEP 2 — CRITERIA
// ============================================================

function StepCriteria({ criteria, setCriteria }) {
  const [draftName, setDraftName] = useState('');
  const [draftDesc, setDraftDesc] = useState('');

  const addCriterion = () => {
    if (!draftName.trim()) return;
    const id = draftName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12) + Date.now().toString(36).slice(-3);
    setCriteria([...criteria, { id, name: draftName.trim(), description: draftDesc.trim() }]);
    setDraftName(''); setDraftDesc('');
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="text-xs font-mono text-brand-fire mb-2">STEP 02</div>
        <h2 className="font-display text-4xl text-ink-primary mb-3">Set your evaluation criteria</h2>
        <p className="text-ink-secondary max-w-2xl">
          The lenses through which you'll judge each factor's importance.
        </p>
      </div>

      <div className="space-y-2">
        {criteria.map((c, idx) => (
          <div key={c.id} className="group flex items-start gap-3 p-4 bg-surface-raised rounded border border-surface-border hover:border-surface-border transition">
            <div className="text-xs font-mono text-ink-muted w-6 pt-1">{String(idx + 1).padStart(2, '0')}</div>
            <div className="flex-1 space-y-1">
              <input
                value={c.name}
                onChange={(e) => setCriteria(criteria.map((x, i) => i === idx ? { ...x, name: e.target.value } : x))}
                className="bg-transparent text-ink-primary font-medium w-full focus:outline-none focus:text-brand-fire/80 transition"
              />
              <input
                value={c.description}
                onChange={(e) => setCriteria(criteria.map((x, i) => i === idx ? { ...x, description: e.target.value } : x))}
                placeholder="Brief description"
                className="bg-transparent text-ink-muted text-sm w-full focus:outline-none focus:text-ink-secondary transition"
              />
            </div>
            <button
              onClick={() => setCriteria(criteria.filter((_, i) => i !== idx))}
              className="text-surface-border hover:text-signal-press transition opacity-0 group-hover:opacity-100"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      <div className="p-4 bg-surface-raised/50 rounded border border-dashed border-surface-border">
        <div className="flex gap-3">
          <input
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCriterion()}
            placeholder="New criterion name"
            className="flex-1 bg-surface-raised text-ink-primary px-3 py-2 rounded border border-surface-border focus:border-brand-fire/50 focus:outline-none text-sm"
          />
          <input
            value={draftDesc}
            onChange={(e) => setDraftDesc(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCriterion()}
            placeholder="Description (optional)"
            className="flex-[2] bg-surface-raised text-ink-primary px-3 py-2 rounded border border-surface-border focus:border-brand-fire/50 focus:outline-none text-sm"
          />
          <button
            onClick={addCriterion}
            disabled={!draftName.trim()}
            className="flex items-center gap-1.5 bg-surface-border hover:bg-surface-border text-ink-secondary px-4 py-2 rounded text-sm disabled:opacity-30 transition"
          >
            <Plus size={14} /> Add
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// STEP 3 — WEIGHT CRITERIA
// ============================================================

function StepWeightCriteria({ criteria, matrix, setMatrix, weights, cr }) {
  const pairs = [];
  for (let i = 0; i < criteria.length; i++) {
    for (let j = i + 1; j < criteria.length; j++) pairs.push([i, j]);
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="text-xs font-mono text-brand-fire mb-2">STEP 03</div>
        <h2 className="font-display text-4xl text-ink-primary mb-3">Weight your criteria</h2>
        <p className="text-ink-secondary max-w-2xl">
          Saaty 1–9: 1 = equal, 3 = moderate, 5 = strong, 7 = very strong, 9 = extreme.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-surface-raised rounded border border-surface-border p-6">
          <div className="text-xs font-mono text-ink-muted uppercase tracking-wider mb-4">Pairwise comparisons</div>
          {pairs.map(([i, j]) => (
            <PairwiseRow
              key={`${i}-${j}`}
              nameA={criteria[i].name}
              nameB={criteria[j].name}
              value={matrix[i][j]}
              onChange={(v) => setMatrix(setMatrixVal(matrix, i, j, v))}
            />
          ))}
        </div>

        <div className="space-y-4">
          <div className="bg-surface-raised rounded border border-surface-border p-5">
            <div className="text-xs font-mono text-ink-muted uppercase tracking-wider mb-3">Resulting weights</div>
            <div className="space-y-2">
              {criteria.map((c, idx) => {
                const w = weights[idx] || 0;
                return (
                  <div key={c.id} className="space-y-1">
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="text-ink-secondary">{c.name}</span>
                      <span className="font-mono text-brand-fire">{(w * 100).toFixed(1)}%</span>
                    </div>
                    <div className="h-1 bg-surface-border rounded overflow-hidden">
                      <div className="h-full bg-brand-fire/60" style={{ width: `${w * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-surface-raised rounded border border-surface-border p-5">
            <div className="text-xs font-mono text-ink-muted uppercase tracking-wider mb-3">Consistency</div>
            <ConsistencyBadge cr={cr} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// STEP 4 — SCORE FACTORS
// ============================================================

function StepScoreFactors({ factors, criteria, matrices, setMatrices, weightsByCriterion, crByCriterion }) {
  const [activeCriterionId, setActiveCriterionId] = useState(criteria[0]?.id);

  const pairs = [];
  for (let i = 0; i < factors.length; i++) {
    for (let j = i + 1; j < factors.length; j++) pairs.push([i, j]);
  }

  const matrix = matrices[activeCriterionId] || identityMatrix(factors.length);
  const updateMatrix = (newM) => setMatrices({ ...matrices, [activeCriterionId]: newM });
  const activeCriterion = criteria.find(c => c.id === activeCriterionId);
  const weights = weightsByCriterion[activeCriterionId] || [];
  const cr = crByCriterion[activeCriterionId] || 0;

  return (
    <div className="space-y-8">
      <div>
        <div className="text-xs font-mono text-brand-fire mb-2">STEP 04</div>
        <h2 className="font-display text-4xl text-ink-primary mb-3">Score factors against each criterion</h2>
        <p className="text-ink-secondary max-w-2xl">Switch tabs to work through each lens. Live consistency check per matrix.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {criteria.map(c => {
          const active = c.id === activeCriterionId;
          const cri = crByCriterion[c.id] || 0;
          return (
            <button
              key={c.id}
              onClick={() => setActiveCriterionId(c.id)}
              className={`
                px-4 py-2 rounded text-sm font-medium transition flex items-center gap-2
                ${active ? 'bg-brand-fire text-surface-base' : 'bg-surface-raised text-ink-secondary border border-surface-border hover:border-surface-border'}
              `}
            >
              {c.name}
              {!active && (
                <span className={`text-[10px] font-mono ${cri <= 0.1 ? 'text-signal-advisory' : cri <= 0.15 ? 'text-brand-fire' : 'text-signal-press'}`}>
                  {(cri * 100).toFixed(0)}%
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-surface-raised rounded border border-surface-border p-6">
          <div className="mb-4">
            <div className="text-xs font-mono text-ink-muted uppercase tracking-wider">Criterion</div>
            <div className="font-display text-xl text-ink-primary mt-1">{activeCriterion?.name}</div>
            {activeCriterion?.description && (
              <div className="text-sm text-ink-muted mt-1">{activeCriterion.description}</div>
            )}
          </div>
          <div className="border-t border-surface-border pt-2">
            {pairs.map(([i, j]) => (
              <PairwiseRow
                key={`${activeCriterionId}-${i}-${j}`}
                nameA={factors[i].name}
                nameB={factors[j].name}
                value={matrix[i][j]}
                onChange={(v) => updateMatrix(setMatrixVal(matrix, i, j, v))}
              />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-surface-raised rounded border border-surface-border p-5">
            <div className="text-xs font-mono text-ink-muted uppercase tracking-wider mb-3">Local weights</div>
            <div className="space-y-2">
              {factors.map((f, idx) => {
                const w = weights[idx] || 0;
                return (
                  <div key={f.id} className="space-y-1">
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="text-ink-secondary truncate">{f.name}</span>
                      <span className="font-mono text-brand-fire text-xs">{(w * 100).toFixed(1)}%</span>
                    </div>
                    <div className="h-1 bg-surface-border rounded overflow-hidden">
                      <div className="h-full bg-brand-fire/60" style={{ width: `${w * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-surface-raised rounded border border-surface-border p-5">
            <div className="text-xs font-mono text-ink-muted uppercase tracking-wider mb-3">Consistency</div>
            <ConsistencyBadge cr={cr} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// STEP 5 — SYNTHESIS
// ============================================================

function StepSynthesis({ factors, criteria, factorWeightsByCriterion, globalFactorWeights, topN, setTopN }) {
  return (
    <div className="space-y-8">
      <div>
        <div className="text-xs font-mono text-brand-fire mb-2">STEP 05</div>
        <h2 className="font-display text-4xl text-ink-primary mb-3">Synthesis</h2>
        <p className="text-ink-secondary max-w-2xl">
          Choose how many top-ranked factors to carry forward. Cost grows as |states|<sup>N</sup> seeds.
        </p>
      </div>

      <div className="bg-surface-raised rounded border border-surface-border overflow-hidden">
        <div className="px-6 py-4 border-b border-surface-border flex items-center justify-between">
          <div className="text-xs font-mono text-ink-muted uppercase tracking-wider">Ranked factors</div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-ink-muted">Carry forward top</span>
            <select
              value={topN}
              onChange={(e) => setTopN(parseInt(e.target.value))}
              className="bg-surface-border text-ink-primary px-3 py-1 rounded border border-surface-border text-sm font-mono focus:outline-none focus:border-brand-fire/50"
            >
              {Array.from({ length: factors.length - 2 }, (_, i) => i + 3).map(n => (
                <option key={n} value={n}>{n} factors</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-raised/50">
              <tr className="text-xs font-mono text-ink-muted uppercase">
                <th className="px-6 py-3 text-left w-10">#</th>
                <th className="px-2 py-3 text-left">Factor</th>
                {criteria.map(c => (
                  <th key={c.id} className="px-3 py-3 text-right">
                    <div className="truncate max-w-24">{c.name.split(' ')[0]}</div>
                  </th>
                ))}
                <th className="px-6 py-3 text-right">Global</th>
              </tr>
            </thead>
            <tbody>
              {globalFactorWeights.map((row, idx) => {
                const isTop = idx < topN;
                return (
                  <tr key={row.factor.id} className={`border-t border-surface-border ${isTop ? 'bg-brand-fire/5' : ''}`}>
                    <td className="px-6 py-3 font-mono text-xs text-ink-muted">{String(idx + 1).padStart(2, '0')}</td>
                    <td className="px-2 py-3">
                      <div className={`font-medium ${isTop ? 'text-brand-fire/80' : 'text-ink-secondary'}`}>{row.factor.name}</div>
                      {row.factor.description && (
                        <div className="text-xs text-ink-muted mt-0.5">{row.factor.description}</div>
                      )}
                    </td>
                    {criteria.map(c => {
                      const factorIdx = factors.findIndex(f => f.id === row.factor.id);
                      const localW = factorWeightsByCriterion[c.id]?.[factorIdx] || 0;
                      return (
                        <td key={c.id} className="px-3 py-3 text-right font-mono text-xs text-ink-muted">
                          {(localW * 100).toFixed(0)}
                        </td>
                      );
                    })}
                    <td className="px-6 py-3 text-right">
                      <div className={`font-mono ${isTop ? 'text-brand-fire font-semibold' : 'text-ink-secondary'}`}>
                        {(row.weight * 100).toFixed(1)}%
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// STEP 6 — ARROWS OF TIME
// ============================================================

function StepArrows({ topFactors, factorArrows, setFactorArrows }) {
  const updateArrow = (factorId, prop, val) => {
    setFactorArrows({
      ...factorArrows,
      [factorId]: { ...(factorArrows[factorId] || DEFAULT_ARROW), [prop]: val }
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="text-xs font-mono text-brand-fire mb-2">STEP 06 · NEW</div>
        <h2 className="font-display text-4xl text-ink-primary mb-3">Arrows of time</h2>
        <p className="text-ink-secondary max-w-2xl">
          For each top factor, characterise the three Oxford arrows: the contextual future arriving at you (velocity, proximity to threshold), the past catching up with you (path-dependency), and the asymmetry of what arrives. Together these determine which factors are bifurcation candidates.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-2">
        <div className="bg-surface-raised/50 rounded border border-surface-border p-4">
          <div className="flex items-center gap-2 text-xs font-mono text-signal-press uppercase tracking-wider mb-2">
            <Zap size={12} /> Red arrow
          </div>
          <div className="text-sm text-ink-secondary">Coming towards you. Velocity & proximity.</div>
        </div>
        <div className="bg-surface-raised/50 rounded border border-surface-border p-4">
          <div className="flex items-center gap-2 text-xs font-mono text-sky-400 uppercase tracking-wider mb-2">
            <Anchor size={12} /> Blue arrow
          </div>
          <div className="text-sm text-ink-secondary">Past catching up. Path-dependency load.</div>
        </div>
        <div className="bg-surface-raised/50 rounded border border-surface-border p-4">
          <div className="flex items-center gap-2 text-xs font-mono text-signal-advisory uppercase tracking-wider mb-2">
            <Target size={12} /> Asymmetry
          </div>
          <div className="text-sm text-ink-secondary">Mostly upside or mostly downside?</div>
        </div>
      </div>

      <div className="space-y-3">
        {topFactors.map((tf, idx) => {
          const a = factorArrows[tf.factor.id] || DEFAULT_ARROW;
          const crit = calcCriticality(a);
          const critColor = crit > 0.5 ? 'text-signal-press border-signal-press/40 bg-signal-press/10'
            : crit > 0.3 ? 'text-brand-fire border-brand-fire/40 bg-brand-fire/10'
            : 'text-ink-secondary border-surface-border bg-surface-border';
          return (
            <div key={tf.factor.id} className="bg-surface-raised rounded border border-surface-border p-5">
              <div className="flex items-baseline justify-between mb-4">
                <div>
                  <div className="text-xs font-mono text-ink-muted mb-1">#{idx + 1} · w {(tf.weight * 100).toFixed(1)}%</div>
                  <div className="font-display text-xl text-ink-primary">{tf.factor.name}</div>
                  {tf.factor.description && (
                    <div className="text-xs text-ink-muted mt-0.5">{tf.factor.description}</div>
                  )}
                </div>
                <div className={`px-3 py-1.5 rounded border text-xs font-mono ${critColor}`}>
                  Criticality {(crit * 100).toFixed(0)}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <SmallSlider
                  label="Velocity" icon={Zap}
                  value={a.velocity}
                  onChange={(v) => updateArrow(tf.factor.id, 'velocity', v)}
                  leftLabel="slowly approaching" rightLabel="imminent"
                />
                <SmallSlider
                  label="Proximity to threshold" icon={Target}
                  value={a.proximity}
                  onChange={(v) => updateArrow(tf.factor.id, 'proximity', v)}
                  leftLabel="far" rightLabel="at threshold"
                />
                <SmallSlider
                  label="Path-dependency" icon={Anchor}
                  value={a.pathDep}
                  onChange={(v) => updateArrow(tf.factor.id, 'pathDep', v)}
                  leftLabel="novel / contingent" rightLabel="locked-in / inevitable"
                />
                <SmallSlider
                  label="Consequence asymmetry" icon={ArrowRight}
                  value={a.consequence}
                  onChange={(v) => updateArrow(tf.factor.id, 'consequence', v)}
                  min={-1} max={1} signed
                  leftLabel="downside" rightLabel="upside"
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-surface-raised/50 rounded border border-surface-border p-5">
        <div className="flex items-start gap-3">
          <Info size={16} className="text-brand-fire mt-0.5 flex-shrink-0" />
          <div className="text-sm text-ink-secondary">
            <span className="text-ink-secondary font-medium">Criticality</span> = velocity × proximity, amplified by path-dependency. Bifurcation happens when high-criticality factors converge — many arrows arriving simultaneously. Factors above 50% criticality drive scenario timing.
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// STEP 7 — FACTOR STATES
// ============================================================

function StepStates({ factorStates, setFactorStates, topFactors, stateLabelOverrides, setStateLabelOverrides }) {
  const addState = () => {
    if (factorStates.length >= 5) return;
    const maxVal = Math.max(...factorStates.map(s => s.value));
    setFactorStates([...factorStates, { value: maxVal + 1, label: 'New' }]);
  };

  const removeState = (idx) => {
    if (factorStates.length <= 2) return;
    setFactorStates(factorStates.filter((_, i) => i !== idx));
    const newOver = {};
    Object.keys(stateLabelOverrides).forEach(fid => {
      newOver[fid] = {};
      Object.keys(stateLabelOverrides[fid]).forEach(si => {
        const i = parseInt(si);
        if (i < idx) newOver[fid][i] = stateLabelOverrides[fid][i];
        else if (i > idx) newOver[fid][i - 1] = stateLabelOverrides[fid][i];
      });
    });
    setStateLabelOverrides(newOver);
  };

  const updateGlobalLabel = (idx, label) => {
    setFactorStates(factorStates.map((s, i) => i === idx ? { ...s, label } : s));
  };

  const updateGlobalValue = (idx, value) => {
    const v = parseFloat(value);
    if (isNaN(v)) return;
    setFactorStates(factorStates.map((s, i) => i === idx ? { ...s, value: v } : s));
  };

  const updateOverride = (factorId, stateIdx, label) => {
    const over = { ...stateLabelOverrides };
    if (!over[factorId]) over[factorId] = {};
    if (label.trim() === '') delete over[factorId][stateIdx];
    else over[factorId][stateIdx] = label;
    setStateLabelOverrides(over);
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="text-xs font-mono text-brand-fire mb-2">STEP 07</div>
        <h2 className="font-display text-4xl text-ink-primary mb-3">Define factor states</h2>
        <p className="text-ink-secondary max-w-2xl">
          Each top factor takes one state per scenario. Default Low/Mid/High at −1, 0, +1. Override labels per factor for narrative clarity.
        </p>
      </div>

      <div className="bg-surface-raised rounded border border-surface-border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs font-mono text-ink-muted uppercase tracking-wider">Global states</div>
          <button
            onClick={addState}
            disabled={factorStates.length >= 5}
            className="flex items-center gap-1.5 bg-surface-border hover:bg-surface-border text-ink-secondary px-3 py-1 rounded text-xs disabled:opacity-30 transition"
          >
            <Plus size={12} /> Add state
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {factorStates.map((s, idx) => (
            <div key={idx} className="bg-surface-base rounded border border-surface-border p-3 group relative">
              <button
                onClick={() => removeState(idx)}
                disabled={factorStates.length <= 2}
                className="absolute top-1 right-1 text-surface-border hover:text-signal-press opacity-0 group-hover:opacity-100 disabled:opacity-0 transition"
              >
                <X size={12} />
              </button>
              <input
                value={s.label}
                onChange={(e) => updateGlobalLabel(idx, e.target.value)}
                className="bg-transparent text-ink-primary font-medium text-sm w-full focus:outline-none focus:text-brand-fire/80 transition"
              />
              <input
                type="number"
                step="0.5"
                value={s.value}
                onChange={(e) => updateGlobalValue(idx, e.target.value)}
                className="bg-transparent text-ink-muted font-mono text-xs w-full mt-1 focus:outline-none focus:text-brand-fire transition"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-surface-raised rounded border border-surface-border overflow-hidden">
        <div className="px-6 py-4 border-b border-surface-border">
          <div className="text-xs font-mono text-ink-muted uppercase tracking-wider">Per-factor label overrides</div>
          <div className="text-xs text-ink-muted mt-1">Numeric values stay global. Leave blank to use the default.</div>
        </div>
        <table className="w-full">
          <thead className="bg-surface-raised/50">
            <tr className="text-xs font-mono text-ink-muted uppercase">
              <th className="px-6 py-3 text-left">Factor</th>
              {factorStates.map((s, idx) => (
                <th key={idx} className="px-3 py-3 text-left">
                  {s.label} <span className="text-surface-border">({s.value})</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {topFactors.map((tf) => (
              <tr key={tf.factor.id} className="border-t border-surface-border">
                <td className="px-6 py-3">
                  <div className="text-ink-secondary text-sm font-medium">{tf.factor.name}</div>
                  <div className="text-xs font-mono text-ink-muted">w = {(tf.weight * 100).toFixed(1)}%</div>
                </td>
                {factorStates.map((s, sIdx) => (
                  <td key={sIdx} className="px-3 py-2">
                    <input
                      value={stateLabelOverrides[tf.factor.id]?.[sIdx] || ''}
                      onChange={(e) => updateOverride(tf.factor.id, sIdx, e.target.value)}
                      placeholder={s.label}
                      className="bg-surface-base text-ink-primary placeholder-surface-border text-sm px-2 py-1 rounded border border-surface-border focus:border-brand-fire/50 focus:outline-none w-full"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================
// STEP 8 — SIGNED COUPLING + TRIGGERING
// ============================================================

function StepCoupling({ topFactors, couplingMatrix, setCouplingMatrix, triggerMatrix, setTriggerMatrix, vetoes, setVetoes, factorStates, stateLabelOverrides }) {
  const updateCoupling = (i, j, val) => {
    const m = couplingMatrix.map(r => [...r]);
    m[i][j] = val;
    m[j][i] = val;
    setCouplingMatrix(m);
  };

  const toggleTrigger = (from, to) => {
    const m = triggerMatrix.map(r => [...r]);
    m[from][to] = m[from][to] ? 0 : 1;
    setTriggerMatrix(m);
  };

  const toggleVeto = (i, sa, j, sb) => {
    const key = vetoKey(i, sa, j, sb);
    const next = new Set(vetoes);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setVetoes(next);
  };

  const stateLabel = (factorId, stateIdx) =>
    stateLabelOverrides[factorId]?.[stateIdx] || factorStates[stateIdx]?.label || '';

  const pairs = [];
  for (let i = 0; i < topFactors.length; i++) {
    for (let j = i + 1; j < topFactors.length; j++) pairs.push([i, j]);
  }

  const couplingLabel = (v) => {
    if (v === 0) return 'Independent';
    const abs = Math.abs(v);
    const polarity = v > 0 ? 'Reinforcing' : 'Damping';
    if (abs <= 2) return `Weakly ${polarity.toLowerCase()}`;
    if (abs <= 4) return `Moderately ${polarity.toLowerCase()}`;
    if (abs <= 6) return `Strongly ${polarity.toLowerCase()}`;
    return `Tightly ${polarity.toLowerCase()}`;
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="text-xs font-mono text-brand-fire mb-2">STEP 08 · ENHANCED</div>
        <h2 className="font-display text-4xl text-ink-primary mb-3">Coupling & triggering chains</h2>
        <p className="text-ink-secondary max-w-2xl">
          For each pair: the magnitude of coupling, its polarity (reinforcing or damping), and whether either factor triggers the other. Reinforcing coupling creates Arthur's positive-feedback loops — the structural signature of an approaching bifurcation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
        <div className="bg-surface-raised/50 rounded border border-surface-border p-4">
          <div className="text-xs font-mono text-signal-advisory uppercase tracking-wider mb-2">Reinforcing (+)</div>
          <div className="text-sm text-ink-secondary">Factors move together. Increasing returns. Amplification.</div>
        </div>
        <div className="bg-surface-raised/50 rounded border border-surface-border p-4">
          <div className="text-xs font-mono text-signal-press uppercase tracking-wider mb-2">Damping (−)</div>
          <div className="text-sm text-ink-secondary">Factors counteract. Negative feedback. Equilibrium-seeking.</div>
        </div>
      </div>

      <div className="bg-surface-raised rounded border border-surface-border p-6 space-y-6">
        {pairs.map(([i, j]) => {
          const v = couplingMatrix[i]?.[j] ?? 0;
          const trigIJ = triggerMatrix[i]?.[j] ?? 0;
          const trigJI = triggerMatrix[j]?.[i] ?? 0;
          return (
            <div key={`${i}-${j}`} className="space-y-3 pb-6 border-b border-surface-border last:border-0 last:pb-0">
              <div className="flex items-baseline justify-between">
                <div className="flex items-baseline gap-3">
                  <span className="font-medium text-ink-primary">{topFactors[i].factor.name}</span>
                  <span className="text-ink-muted text-xs font-mono">↔</span>
                  <span className="font-medium text-ink-primary">{topFactors[j].factor.name}</span>
                </div>
                <span className={`text-xs font-mono ${v > 0 ? 'text-signal-advisory' : v < 0 ? 'text-signal-press' : 'text-ink-muted'}`}>
                  {couplingLabel(v)}
                </span>
              </div>

              <div className="flex items-center gap-1">
                {[-9, -7, -5, -3, -1, 0, 1, 3, 5, 7, 9].map(n => (
                  <button
                    key={n}
                    onClick={() => updateCoupling(i, j, n)}
                    className={`
                      flex-1 py-2 text-xs font-mono rounded transition
                      ${v === n
                        ? n > 0 ? 'bg-signal-advisory text-surface-base font-semibold'
                          : n < 0 ? 'bg-signal-press text-surface-base font-semibold'
                          : 'bg-ink-muted text-surface-base font-semibold'
                        : 'bg-surface-border text-ink-muted hover:bg-surface-border hover:text-ink-secondary'
                      }
                    `}
                  >
                    {n > 0 ? `+${n}` : n}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="font-mono text-ink-muted uppercase tracking-wider">Triggers:</span>
                <button
                  onClick={() => toggleTrigger(i, j)}
                  className={`
                    flex items-center gap-1.5 px-3 py-1 rounded transition
                    ${trigIJ ? 'bg-brand-fire/20 text-brand-fire/80 border border-brand-fire/40' : 'bg-surface-border text-ink-muted border border-surface-border hover:border-surface-border'}
                  `}
                >
                  <span>{topFactors[i].factor.name}</span>
                  <ArrowRight size={11} />
                  <span>{topFactors[j].factor.name}</span>
                </button>
                <button
                  onClick={() => toggleTrigger(j, i)}
                  className={`
                    flex items-center gap-1.5 px-3 py-1 rounded transition
                    ${trigJI ? 'bg-brand-fire/20 text-brand-fire/80 border border-brand-fire/40' : 'bg-surface-border text-ink-muted border border-surface-border hover:border-surface-border'}
                  `}
                >
                  <span>{topFactors[j].factor.name}</span>
                  <ArrowRight size={11} />
                  <span>{topFactors[i].factor.name}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* === Hard vetoes === */}
      <div className="bg-surface-raised rounded-lg border border-signal-press/30 p-6 space-y-4">
        <div className="flex items-baseline justify-between flex-wrap gap-2">
          <div>
            <h3 className="font-display text-xl text-ink-primary mb-1">Hard vetoes</h3>
            <p className="text-sm text-ink-secondary max-w-2xl">
              Mark specific factor-state pairs as logically impossible. Any seed containing a vetoed pair is removed before scoring, regardless of how internally coherent the rest of it appears. This catches structural impossibilities that the soft coherence score might otherwise let through.
            </p>
          </div>
          <span className="text-xs font-mono text-signal-press">
            {vetoes.size} {vetoes.size === 1 ? 'veto' : 'vetoes'} declared
          </span>
        </div>

        <VetoEditor
          topFactors={topFactors}
          factorStates={factorStates}
          stateLabel={stateLabel}
          vetoes={vetoes}
          toggleVeto={toggleVeto}
          setVetoes={setVetoes}
        />
      </div>
    </div>
  );
}

// Veto editor: two factor-pickers + state pickers + add button + list of declared vetoes.
function VetoEditor({ topFactors, factorStates, stateLabel, vetoes, toggleVeto, setVetoes }) {
  const [draftI, setDraftI] = useState(0);
  const [draftSa, setDraftSa] = useState(factorStates.length - 1);
  const [draftJ, setDraftJ] = useState(1);
  const [draftSb, setDraftSb] = useState(0);

  const draftKey = vetoKey(draftI, draftSa, draftJ, draftSb);
  const draftAlreadyExists = vetoes.has(draftKey);
  const draftIsSelfPair = draftI === draftJ;

  const addDraft = () => {
    if (draftIsSelfPair) return;
    if (draftAlreadyExists) return;
    toggleVeto(draftI, draftSa, draftJ, draftSb);
  };

  const clearAll = () => {
    if (vetoes.size === 0) return;
    if (!confirm(`Remove all ${vetoes.size} vetoes?`)) return;
    setVetoes(new Set());
  };

  const declared = Array.from(vetoes).map(k => parseVetoKey(k));

  return (
    <div className="space-y-4">
      {/* Draft builder */}
      <div className="bg-surface-base rounded border border-surface-border p-4">
        <div className="text-xs font-mono uppercase tracking-wider text-ink-muted mb-3">Declare an impossible pair</div>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto] gap-3 items-end">
          {/* Left side */}
          <div className="space-y-2">
            <select
              value={draftI}
              onChange={(e) => setDraftI(Number(e.target.value))}
              className="w-full bg-surface-raised text-ink-primary text-sm px-3 py-2 rounded border border-surface-border focus:border-signal-press/50 focus:outline-none"
            >
              {topFactors.map((tf, idx) => (
                <option key={idx} value={idx}>{tf.factor.name}</option>
              ))}
            </select>
            <select
              value={draftSa}
              onChange={(e) => setDraftSa(Number(e.target.value))}
              className="w-full bg-surface-base text-ink-secondary text-xs font-mono px-3 py-1.5 rounded border border-surface-border focus:border-signal-press/50 focus:outline-none"
            >
              {factorStates.map((s, idx) => (
                <option key={idx} value={idx}>{stateLabel(topFactors[draftI]?.factor.id, idx)}</option>
              ))}
            </select>
          </div>

          {/* Conjunction */}
          <div className="text-center">
            <div className="text-xs font-mono text-signal-press uppercase tracking-wider">cannot coexist with</div>
            <div className="text-signal-press text-2xl mt-1">⊗</div>
          </div>

          {/* Right side */}
          <div className="space-y-2">
            <select
              value={draftJ}
              onChange={(e) => setDraftJ(Number(e.target.value))}
              className="w-full bg-surface-raised text-ink-primary text-sm px-3 py-2 rounded border border-surface-border focus:border-signal-press/50 focus:outline-none"
            >
              {topFactors.map((tf, idx) => (
                <option key={idx} value={idx}>{tf.factor.name}</option>
              ))}
            </select>
            <select
              value={draftSb}
              onChange={(e) => setDraftSb(Number(e.target.value))}
              className="w-full bg-surface-base text-ink-secondary text-xs font-mono px-3 py-1.5 rounded border border-surface-border focus:border-signal-press/50 focus:outline-none"
            >
              {factorStates.map((s, idx) => (
                <option key={idx} value={idx}>{stateLabel(topFactors[draftJ]?.factor.id, idx)}</option>
              ))}
            </select>
          </div>

          {/* Add button */}
          <button
            onClick={addDraft}
            disabled={draftIsSelfPair || draftAlreadyExists}
            className={`
              flex items-center gap-1.5 px-4 py-2 rounded text-sm font-medium transition self-start
              ${draftIsSelfPair || draftAlreadyExists
                ? 'bg-surface-border text-ink-muted cursor-not-allowed'
                : 'bg-signal-press/15 hover:bg-signal-press/25 text-signal-press/80 border border-signal-press/40'
              }
            `}
          >
            <Plus size={14} />
            {draftAlreadyExists ? 'Already vetoed' : draftIsSelfPair ? 'Pick two factors' : 'Add veto'}
          </button>
        </div>
      </div>

      {/* Declared vetoes list */}
      {declared.length > 0 ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-xs font-mono uppercase tracking-wider text-ink-muted">Declared vetoes</div>
            <button
              onClick={clearAll}
              className="text-xs font-mono text-ink-muted hover:text-signal-press transition"
            >
              clear all
            </button>
          </div>
          <ul className="space-y-1.5">
            {declared.map(({ i, sa, j, sb }) => {
              const fi = topFactors[i]?.factor;
              const fj = topFactors[j]?.factor;
              if (!fi || !fj) return null;
              return (
                <li key={vetoKey(i, sa, j, sb)} className="flex items-center justify-between gap-3 bg-signal-press/5 border border-signal-press/20 rounded px-3 py-2">
                  <div className="flex items-baseline gap-2 text-sm flex-1 flex-wrap">
                    <span className="text-ink-secondary">{fi.name}</span>
                    <span className="font-mono text-xs text-signal-press/80 bg-signal-press/10 px-2 py-0.5 rounded">{stateLabel(fi.id, sa)}</span>
                    <span className="text-signal-press font-mono">⊗</span>
                    <span className="text-ink-secondary">{fj.name}</span>
                    <span className="font-mono text-xs text-signal-press/80 bg-signal-press/10 px-2 py-0.5 rounded">{stateLabel(fj.id, sb)}</span>
                  </div>
                  <button
                    onClick={() => toggleVeto(i, sa, j, sb)}
                    className="text-ink-muted hover:text-signal-press transition flex-shrink-0"
                    title="Remove this veto"
                  >
                    <X size={14} />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <div className="text-xs text-ink-muted italic px-1">
          No vetoes declared. The soft coherence score is the only filter.
        </div>
      )}
    </div>
  );
}

// ============================================================
// STEP 9 — STRATEGIC CONTEXT
// ============================================================

function StepContext({ purpose, setPurpose, audiencePreset, setAudiencePreset, audienceCustom, setAudienceCustom, documents, setDocuments }) {
  const [draftDocName, setDraftDocName] = useState('');
  const [draftDocContent, setDraftDocContent] = useState('');

  const addDocument = () => {
    if (!draftDocName.trim() && !draftDocContent.trim()) return;
    const id = 'doc_' + Date.now().toString(36);
    const name = draftDocName.trim() || `Document ${documents.length + 1}`;
    setDocuments([...documents, { id, name, content: draftDocContent, included: true }]);
    setDraftDocName('');
    setDraftDocContent('');
  };

  const removeDocument = (id) => {
    setDocuments(documents.filter(d => d.id !== id));
  };

  const toggleInclude = (id) => {
    setDocuments(documents.map(d => d.id === id ? { ...d, included: !d.included } : d));
  };

  const updateDocName = (id, name) => {
    setDocuments(documents.map(d => d.id === id ? { ...d, name } : d));
  };

  const updateDocContent = (id, content) => {
    setDocuments(documents.map(d => d.id === id ? { ...d, content } : d));
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      try {
        const text = await file.text();
        const id = 'doc_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
        setDocuments(prev => [...prev, { id, name: file.name, content: text, included: true }]);
      } catch (err) {
        console.error('Failed to read file', file.name, err);
      }
    }
    // Reset the input so the same file can be re-uploaded
    e.target.value = '';
  };

  const includedCount = documents.filter(d => d.included).length;
  const totalChars = documents.filter(d => d.included).reduce((s, d) => s + (d.content?.length || 0), 0);

  return (
    <div className="space-y-8">
      <div>
        <div className="text-xs font-mono text-brand-fire mb-2">STEP 09 · CONTEXT</div>
        <h2 className="font-display text-4xl text-ink-primary mb-3">Strategic context</h2>
        <p className="text-ink-secondary max-w-2xl">
          Tell the AI what these scenarios are for, who will read them, and (optionally) provide documents that ground the narrative in your actual situation. Without context, scenarios read as generic foresight; with it, they're aimed.
        </p>
      </div>

      {/* Purpose */}
      <div className="bg-surface-raised rounded border border-surface-border p-6">
        <div className="flex items-baseline justify-between mb-3">
          <div className="text-xs font-mono text-ink-muted uppercase tracking-wider">Purpose</div>
          <div className="text-xs font-mono text-ink-muted">{purpose.length} chars</div>
        </div>
        <textarea
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          placeholder="What decision will these scenarios inform? E.g., 'Stress-testing a five-year investment thesis in compliance-tech for the European market', or 'Preparing a 2040 outlook for the board's strategy day on regulatory exposure'."
          className="w-full bg-surface-base text-ink-primary placeholder-surface-border text-sm px-4 py-3 rounded border border-surface-border focus:border-brand-fire/50 focus:outline-none min-h-[120px] resize-y leading-relaxed"
        />
        <div className="text-xs text-ink-muted mt-2 leading-relaxed">
          The AI uses this to focus the strategic implications and avoid generic foresight commentary. Specific is better than general — name the actual decision, the timeframe, and the constraints.
        </div>
      </div>

      {/* Audience */}
      <div className="bg-surface-raised rounded border border-surface-border p-6">
        <div className="text-xs font-mono text-ink-muted uppercase tracking-wider mb-3">Audience</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
          {AUDIENCE_PRESETS.map(p => {
            const active = audiencePreset === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setAudiencePreset(p.id)}
                className={`px-3 py-2 rounded text-sm transition border
                  ${active
                    ? 'bg-brand-fire text-surface-base border-brand-fire font-medium'
                    : 'bg-surface-raised text-ink-secondary border-surface-border hover:border-surface-border'
                  }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
        {audiencePreset === 'custom' && (
          <input
            value={audienceCustom}
            onChange={(e) => setAudienceCustom(e.target.value)}
            placeholder="Describe the audience in your own words…"
            className="w-full bg-surface-base text-ink-primary placeholder-surface-border text-sm px-3 py-2 rounded border border-surface-border focus:border-brand-fire/50 focus:outline-none"
          />
        )}
        <div className="text-xs text-ink-muted mt-2">
          Tunes vocabulary, register, and how methodological the strategic implications get.
        </div>
      </div>

      {/* Documents */}
      <div className="bg-surface-raised rounded border border-surface-border overflow-hidden">
        <div className="px-6 py-4 border-b border-surface-border flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="text-xs font-mono text-ink-muted uppercase tracking-wider">Supporting documents</div>
            <div className="text-xs text-ink-muted mt-1">
              {documents.length === 0
                ? 'Optional — paste or upload documents that ground the scenario in your situation'
                : `${includedCount} of ${documents.length} included · ${totalChars.toLocaleString()} chars`}
            </div>
          </div>
          <label className="flex items-center gap-1.5 bg-surface-border hover:bg-surface-border text-ink-secondary px-3 py-1.5 rounded text-xs cursor-pointer transition">
            <Upload size={12} />
            Upload .txt / .md
            <input
              type="file"
              accept=".txt,.md,.markdown,text/plain,text/markdown"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {documents.length > 0 && (
          <div className="divide-y divide-surface-border">
            {documents.map((doc) => (
              <div key={doc.id} className="px-6 py-4 group">
                <div className="flex items-center gap-3 mb-2">
                  <button
                    onClick={() => toggleInclude(doc.id)}
                    className={`w-5 h-5 rounded flex items-center justify-center transition flex-shrink-0
                      ${doc.included
                        ? 'bg-brand-fire text-surface-base'
                        : 'bg-surface-border border border-surface-border hover:border-ink-muted'
                      }`}
                    title={doc.included ? 'Included in generation' : 'Excluded from generation'}
                  >
                    {doc.included && <Check size={12} />}
                  </button>
                  <FileText size={14} className="text-ink-muted flex-shrink-0" />
                  <input
                    value={doc.name}
                    onChange={(e) => updateDocName(doc.id, e.target.value)}
                    className="flex-1 bg-transparent text-ink-primary text-sm font-medium focus:outline-none focus:text-brand-fire/80"
                  />
                  <span className="text-[10px] font-mono text-ink-muted">{(doc.content?.length || 0).toLocaleString()} chars</span>
                  <button
                    onClick={() => removeDocument(doc.id)}
                    className="text-surface-border hover:text-signal-press transition opacity-0 group-hover:opacity-100"
                  >
                    <X size={14} />
                  </button>
                </div>
                <textarea
                  value={doc.content}
                  onChange={(e) => updateDocContent(doc.id, e.target.value)}
                  className="w-full bg-surface-base text-ink-secondary text-xs px-3 py-2 rounded border border-surface-border focus:border-brand-fire/30 focus:outline-none min-h-[80px] max-h-[240px] resize-y font-mono leading-relaxed"
                />
              </div>
            ))}
          </div>
        )}

        <div className="px-6 py-4 bg-surface-base/40 border-t border-surface-border space-y-2">
          <input
            value={draftDocName}
            onChange={(e) => setDraftDocName(e.target.value)}
            placeholder="Document name (e.g., 'Q3 strategy memo', 'Competitive landscape')"
            className="w-full bg-surface-raised text-ink-primary placeholder-surface-border text-sm px-3 py-2 rounded border border-surface-border focus:border-brand-fire/50 focus:outline-none"
          />
          <textarea
            value={draftDocContent}
            onChange={(e) => setDraftDocContent(e.target.value)}
            placeholder="Paste document content here…"
            className="w-full bg-surface-raised text-ink-primary placeholder-surface-border text-xs px-3 py-2 rounded border border-surface-border focus:border-brand-fire/50 focus:outline-none min-h-[80px] resize-y font-mono leading-relaxed"
          />
          <div className="flex justify-end">
            <button
              onClick={addDocument}
              disabled={!draftDocName.trim() && !draftDocContent.trim()}
              className="flex items-center gap-1.5 bg-surface-border hover:bg-surface-border text-ink-secondary px-3 py-1.5 rounded text-xs disabled:opacity-30 transition"
            >
              <Plus size={12} /> Add document
            </button>
          </div>
        </div>
      </div>

      <div className="bg-surface-raised/50 rounded border border-surface-border p-5">
        <div className="flex items-start gap-3">
          <Info size={16} className="text-brand-fire mt-0.5 flex-shrink-0" />
          <div className="text-sm text-ink-secondary">
            <span className="text-ink-secondary font-medium">Documents are sent verbatim to the model</span> when included. Use the checkbox to toggle which documents apply per generation run — you can have a "tech-investor" bundle and a "policy-board" bundle and switch between them. Long documents work fine but inflate prompt size; if you have many or very long documents, consider summarising them first.
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// STEP 10 — SEEDS WITH CONVERGENCE & ARRIVAL
// ============================================================

function StepSeeds({ topFactors, factorStates, stateLabelOverrides, seedSpace, vetoSurvivors, vetoes, scoredSeeds, filteredSeeds, selectedSeeds, K, setK, alpha, setAlpha, convergenceFocus, setConvergenceFocus, coherenceThreshold, setCoherenceThreshold, seedNames, setSeedNames, seedPhases, setSeedPhases, topFactorWeights, topCriticalities, factorArrows, couplingMatrix, triggerMatrix, generationErrors, setGenerationErrors, purpose, audiencePreset, audienceCustom, documents }) {

  const stateLabel = (factorId, stateIdx) =>
    stateLabelOverrides[factorId]?.[stateIdx] || factorStates[stateIdx]?.label || '';

  const stateColor = (stateIdx) => {
    const v = factorStates[stateIdx]?.value ?? 0;
    const max = Math.max(...factorStates.map(s => Math.abs(s.value))) || 1;
    const norm = v / max;
    if (norm > 0.33) return 'bg-signal-advisory/15 text-signal-advisory/80 border-signal-advisory/30';
    if (norm < -0.33) return 'bg-signal-press/15 text-signal-press/80 border-signal-press/30';
    return 'bg-surface-border/40 text-ink-secondary border-ink-muted/40';
  };

  // ---- AI scenario generation ----
  const buildPrompt = (idx) => {
    const seed = selectedSeeds[idx];
    if (!seed) return '';
    const phase = seedPhases[idx] || 'pre';
    const userName = seedNames[idx] || '';

    const factorLines = topFactors.map((tf, i) => {
      const arrow = factorArrows[tf.factor.id] || { velocity: 0.5, proximity: 0.5, pathDep: 0.5, consequence: 0 };
      const crit = topCriticalities[i];
      const stateIdx = seed.seed[i];
      const stateValue = factorStates[stateIdx]?.value ?? 0;
      const label = stateLabel(tf.factor.id, stateIdx);
      return `- ${tf.factor.name} (weight ${(tf.weight * 100).toFixed(0)}%, criticality ${(crit * 100).toFixed(0)}, velocity ${arrow.velocity.toFixed(2)}, path-dep ${arrow.pathDep.toFixed(2)}): state = "${label}" (numeric ${stateValue})${tf.factor.description ? ` — ${tf.factor.description}` : ''}`;
    }).join('\n');

    const couplingLines = [];
    for (let i = 0; i < topFactors.length; i++) {
      for (let j = i + 1; j < topFactors.length; j++) {
        const c = couplingMatrix[i]?.[j] ?? 0;
        if (c === 0) continue;
        const polarity = c > 0 ? 'reinforcing' : 'damping';
        couplingLines.push(`- ${topFactors[i].factor.name} ↔ ${topFactors[j].factor.name}: ${polarity} (${c > 0 ? '+' : ''}${c}/9)`);
      }
    }

    const triggerLines = [];
    for (let i = 0; i < topFactors.length; i++) {
      for (let j = 0; j < topFactors.length; j++) {
        if (i === j) continue;
        if (triggerMatrix[i]?.[j]) {
          triggerLines.push(`- ${topFactors[i].factor.name} → ${topFactors[j].factor.name}`);
        }
      }
    }

    const arrivingLines = seed.arrival.arriving.map(a =>
      `- ${a.factor.name} arriving in ${a.years.toFixed(1)} years`
    ).join('\n');

    // Strategic context (purpose, audience, included documents)
    const audienceLabel = audiencePreset === 'custom'
      ? (audienceCustom?.trim() || 'general audience')
      : (AUDIENCE_PRESETS.find(p => p.id === audiencePreset)?.label || 'general audience');

    const includedDocs = (documents || []).filter(d => d.included && d.content?.trim());
    const docsBlock = includedDocs.length > 0
      ? `\n=== SUPPORTING DOCUMENTS ===\nThe user has provided the following documents to ground the scenario in their actual world. Reference them where they help make the narrative concrete and aimed at the user's situation:\n\n${includedDocs.map(d => `--- BEGIN: ${d.name} ---\n${d.content.trim()}\n--- END: ${d.name} ---`).join('\n\n')}\n`
      : '';

    const purposeBlock = purpose?.trim()
      ? `\n=== STRATEGIC PURPOSE ===\nThese scenarios are being developed for the following purpose:\n${purpose.trim()}\n\nYour narrative and strategic implications must be aimed at this purpose. Avoid generic foresight commentary; write as if briefing the audience that needs to make this specific decision.\n`
      : '';

    const audienceBlock = `\n=== AUDIENCE ===\nThis scenario will be read by: ${audienceLabel}.\nTune vocabulary, register, and the level of methodological transparency to suit. Strategic implications should be specific to what this audience can actually do.\n`;

    return `You are a senior scenario planner trained in the Oxford Scenario Planning Approach (OSPA) and W. Brian Arthur's complexity economics. You write scenarios that are evocative, structurally grounded, and useful for board-level strategic planning under TUNA conditions (Turbulent, Unpredictable, Novel, Ambiguous).

You have been given a structured scenario seed produced by a morphological analysis pipeline that combines AHP factor weighting, signed cross-consistency assessment, and arrows-of-time analysis. Your job is to write a compact scenario narrative.
${purposeBlock}${audienceBlock}${docsBlock}
=== METHODOLOGY CONTEXT ===
Time horizon: 15 years from today
Phase tag: ${phase}-bifurcation (${phase === 'pre' ? 'system tense, factors approaching threshold — narrative is about which way it tips' : phase === 'mid' ? 'system mid-transition — narrative is about what is breaking and what is emerging' : phase === 'post' ? 'system has snapped — narrative is about what emerged on the other side' : 'non-transitional configuration — narrative is about a sustained state'})

=== ALL FACTORS WITH STATES IN THIS SEED ===
${factorLines}

=== COUPLING (causal linkage) ===
${couplingLines.length > 0 ? couplingLines.join('\n') : '(no significant couplings declared)'}

=== TRIGGERING CHAINS (directional) ===
${triggerLines.length > 0 ? triggerLines.join('\n') : '(no triggering chains declared)'}

=== ARRIVAL TIMING ===
Median arrival: ${seed.arrival.median.toFixed(1)} years from today (window ${seed.arrival.min.toFixed(1)}–${seed.arrival.max.toFixed(1)} years)
Arrows arriving:
${arrivingLines || '(no high-deviation factors)'}

=== SEED METRICS ===
Importance: ${(seed.importance * 100).toFixed(0)}/100 (weighted state extremity)
Coherence: ${(seed.coherence * 100).toFixed(0)}/100 (lower means internal tension under coupling constraints)
Convergence: ${(seed.convergence * 100).toFixed(0)}/100 (higher means multiple high-criticality factors at extremes simultaneously)

${userName ? `=== USER-PROVIDED WORKING NAME ===\n"${userName}" — feel free to refine or replace if a stronger name suggests itself.\n` : ''}
=== OUTPUT FORMAT ===
Write the scenario in markdown with the following structure exactly. Use the heading levels shown. Do not include any preamble, closing remarks, or commentary outside this structure.

# [Evocative 2-4 word scenario name]

*[One-sentence tagline summarising the world]*

## Narrative

[Exactly 2 paragraphs, 200-280 words total. Describe the world: what's happening, how it feels day-to-day, what tensions are at play. Specific and grounded. Avoid generic platitudes about technology, society, or change. Reference specific factors and their interactions where relevant. Write in present tense as if observing the year ${new Date().getFullYear() + Math.round(seed.arrival.median)} from within it. Separate the two paragraphs with a blank line.]

## Structural tension

[1 paragraph, 80-120 words. The structural tension or hidden dependency that determines whether this scenario sustains or snaps into the next. Reference the coupling structure or arriving arrows where relevant.]

## Observable signals

- [Concrete, specific, falsifiable signal #1]
- [Concrete, specific, falsifiable signal #2]
- [Concrete, specific, falsifiable signal #3]
- [Concrete, specific, falsifiable signal #4 — optional]
- [Concrete, specific, falsifiable signal #5 — optional]

## Strategic implications

[1 paragraph, 80-120 words. What this scenario favours and disfavours strategically. Specific to the factor configuration. Avoid generic strategic advice.]

Use evocative scenario names like "The Hardened Decade", "The Velocity Trap", "Splintered Commons", or whatever fits this seed. Begin your response with the # heading.`;
  };

  // Build the per-seed AI prompt and download as .txt. Replaces an earlier
  // in-browser fetch to api.anthropic.com which couldn't carry an API key.
  // The user pastes the .txt into Claude / ChatGPT / their LLM of choice.
  const generateScenario = (idx) => {
    setGenerationErrors({ ...generationErrors, [idx]: null });
    try {
      const prompt = buildPrompt(idx);
      const named = seedNames[idx];
      const slug = named ? named.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `seed-${idx + 1}` : `seed-${idx + 1}`;
      const blob = new Blob([prompt], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tuna-prompt-${slug}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setGenerationErrors({ ...generationErrors, [idx]: err.message || 'Could not build prompt' });
    }
  };

  if (!seedSpace.seeds) {
    return (
      <div className="space-y-6">
        <div>
          <div className="text-xs font-mono text-brand-fire mb-2">STEP 10</div>
          <h2 className="font-display text-4xl text-ink-primary mb-3">Seed selection</h2>
        </div>
        <div className="bg-signal-press/10 border border-signal-press/30 rounded p-5">
          <div className="flex items-start gap-3">
            <AlertCircle size={16} className="text-signal-press mt-0.5 flex-shrink-0" />
            <div className="text-sm text-signal-press/40">
              <div className="font-medium mb-1">Seed space too large</div>
              <div className="text-signal-press/60">
                {seedSpace.total.toLocaleString()} candidate seeds exceeds the 200,000 brute-force cap. Reduce factors or states.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const stateValues = factorStates.map(s => s.value);

  return (
    <div className="space-y-8">
      <div>
        <div className="text-xs font-mono text-brand-fire mb-2">STEP 10</div>
        <h2 className="font-display text-4xl text-ink-primary mb-3">Bifurcation pathway seeds</h2>
        <p className="text-ink-secondary max-w-2xl">
          From the morphological space, K seeds where high-criticality factors converge into structural transitions. Each seed comes with an arrival window and the arrows that are arriving.
        </p>
        <ContextSummary purpose={purpose} audiencePreset={audiencePreset} audienceCustom={audienceCustom} documents={documents} />
      </div>

      <div className={`grid grid-cols-2 gap-3 ${vetoes && vetoes.size > 0 ? 'md:grid-cols-5' : 'md:grid-cols-4'}`}>
        <StatBox label="Seed space" value={seedSpace.total.toLocaleString()} />
        {vetoes && vetoes.size > 0 && (
          <StatBox
            label="Vetoed out"
            value={vetoSurvivors ? (seedSpace.total - vetoSurvivors.seeds.length).toLocaleString() : '—'}
          />
        )}
        <StatBox label="Above coherence" value={filteredSeeds.length.toLocaleString()} />
        <StatBox label="Filter rate" value={`${((filteredSeeds.length / seedSpace.total) * 100).toFixed(0)}%`} />
        <StatBox label="Selected" value={selectedSeeds.length} highlight />
      </div>

      <div className="bg-surface-raised rounded border border-surface-border p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ControlSlider label="Number of seeds (K)" min={2} max={8} step={1} value={K} onChange={setK} format={v => v} />
        <ControlSlider label="Diversity weight (α)" min={0} max={1} step={0.05} value={alpha} onChange={setAlpha}
          format={v => `${v.toFixed(2)} · ${v < 0.33 ? 'diverse' : v > 0.66 ? 'high-score' : 'balanced'}`} />
        <ControlSlider label="Convergence focus" min={0} max={1} step={0.05} value={convergenceFocus} onChange={setConvergenceFocus}
          format={v => `${v.toFixed(2)} · ${v < 0.33 ? 'static' : v > 0.66 ? 'bifurcation' : 'mixed'}`} />
        <ControlSlider label="Min coherence" min={0} max={1} step={0.05} value={coherenceThreshold} onChange={setCoherenceThreshold} format={v => v.toFixed(2)} />
      </div>

      {/* Arrival timeline */}
      <div className="bg-surface-raised rounded border border-surface-border p-6">
        <div className="text-xs font-mono text-ink-muted uppercase tracking-wider mb-4 flex items-center gap-2">
          <Clock size={12} /> Arrival timeline · estimated years to materialise
        </div>
        <ArrivalTimeline seeds={selectedSeeds} seedNames={seedNames} />
      </div>

      {/* Parallel coordinates */}
      <div className="bg-surface-raised rounded border border-surface-border p-6">
        <div className="text-xs font-mono text-ink-muted uppercase tracking-wider mb-4">Seed profiles</div>
        <ParallelCoords factors={topFactors.map(f => f.factor)} states={factorStates} seeds={selectedSeeds}
          factorWeights={topFactorWeights} criticalities={topCriticalities} />
      </div>

      {/* Per-seed details */}
      <div className="space-y-3">
        {selectedSeeds.map((s, idx) => {
          const color = SEED_COLORS[idx % SEED_COLORS.length];
          const phase = seedPhases[idx] || 'pre';
          return (
            <div key={idx} className="bg-surface-raised rounded border border-surface-border overflow-hidden">
              <div className="px-6 py-4 border-b border-surface-border flex items-center gap-4 flex-wrap"
                style={{ borderLeftWidth: 4, borderLeftColor: color, borderLeftStyle: 'solid' }}>
                <div className="text-xs font-mono text-ink-muted">#{idx + 1}</div>
                <input
                  value={seedNames[idx] || ''}
                  onChange={(e) => setSeedNames({ ...seedNames, [idx]: e.target.value })}
                  placeholder="Name this seed…"
                  className="flex-1 bg-transparent text-ink-primary font-display text-xl placeholder-surface-border focus:outline-none focus:text-brand-fire/80 transition min-w-[200px]"
                />
                <div className="flex items-center gap-1 bg-surface-base rounded p-0.5 border border-surface-border">
                  {['pre', 'mid', 'post', 'steady'].map(p => (
                    <button
                      key={p}
                      onClick={() => setSeedPhases({ ...seedPhases, [idx]: p })}
                      className={`px-2 py-1 text-[10px] font-mono uppercase tracking-wider rounded transition
                        ${phase === p ? 'bg-brand-fire text-surface-base' : 'text-ink-muted hover:text-ink-secondary'}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3 text-xs font-mono">
                  <Metric label="imp" value={s.importance} />
                  <Metric label="coh" value={s.coherence} />
                  <Metric label="conv" value={s.convergence} highlight={s.convergence > 0.5} />
                  <Metric label="dist" value={s.avgDistance} />
                </div>
              </div>

              {/* Arrival info */}
              <div className="px-6 py-3 bg-surface-raised/50 border-b border-surface-border flex items-center gap-4 flex-wrap">
                <div className="text-xs font-mono text-ink-muted uppercase tracking-wider flex items-center gap-1.5">
                  <Clock size={11} />
                  Arrival: {s.arrival.median.toFixed(1)}y
                </div>
                <div className="text-xs font-mono text-ink-muted">
                  window {s.arrival.min.toFixed(1)}–{s.arrival.max.toFixed(1)}y
                </div>
                {s.arrival.arriving.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono text-ink-muted uppercase tracking-wider">Arrows arriving:</span>
                    {s.arrival.arriving.slice(0, 4).map((a, i) => (
                      <span key={i} className="text-xs font-mono px-2 py-0.5 rounded bg-signal-press/10 text-signal-press/80 border border-signal-press/30">
                        {a.factor.name} ({a.years.toFixed(1)}y)
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {topFactors.map((tf, fIdx) => {
                  const stateIdx = s.seed[fIdx];
                  const label = stateLabel(tf.factor.id, stateIdx);
                  const crit = topCriticalities[fIdx];
                  return (
                    <div key={tf.factor.id} className={`px-3 py-2 rounded border ${stateColor(stateIdx)} relative`}>
                      <div className="text-[10px] font-mono uppercase tracking-wider opacity-60 flex items-center gap-1">
                        {tf.factor.name}
                        {crit > 0.5 && <Zap size={9} className="text-signal-press" />}
                      </div>
                      <div className="text-sm font-medium mt-0.5">{label}</div>
                    </div>
                  );
                })}
              </div>

              {/* AI Prompt Download */}
              <AIScenarioPanel
                seedIdx={idx}
                error={generationErrors[idx]}
                onDownload={() => generateScenario(idx)}
              />
            </div>
          );
        })}
      </div>

      <div className="bg-surface-raised/50 rounded border border-surface-border p-5">
        <div className="flex items-start gap-3">
          <Sparkles size={16} className="text-brand-fire mt-0.5 flex-shrink-0" />
          <div className="text-sm text-ink-secondary">
            <span className="text-ink-secondary font-medium">Bifurcation phase tags</span> let you distinguish pre-bifurcation seeds (system tense, factors approaching threshold) from post-bifurcation seeds (system has snapped, new emergent properties). Steady-state seeds are non-transitional configurations. The narrative for each phase asks different questions.
          </div>
        </div>
      </div>
    </div>
  );
}

function AIScenarioPanel({ error, onDownload }) {
  return (
    <div className="px-6 py-4 border-t border-surface-border flex items-center justify-between gap-4 flex-wrap">
      <div className="text-xs text-ink-muted">
        {error ? (
          <span className="text-signal-press">Couldn't build prompt: {error}</span>
        ) : (
          <span>The seed parameters above can be expanded into a full scenario by an LLM. Download the prompt and paste it into Claude, ChatGPT, or any model.</span>
        )}
      </div>
      <button
        onClick={onDownload}
        className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition bg-brand-fire/15 hover:bg-brand-fire/25 text-brand-fire border border-brand-fire/40"
      >
        <Download size={14} />
        {error ? 'Try again' : 'Download AI prompt'}
      </button>
    </div>
  );
}

function ContextSummary({ purpose, audiencePreset, audienceCustom, documents }) {
  const includedDocs = (documents || []).filter(d => d.included && d.content?.trim());
  const hasPurpose = purpose && purpose.trim().length > 0;
  const audienceLabel = audiencePreset === 'custom'
    ? (audienceCustom?.trim() || 'custom')
    : (AUDIENCE_PRESETS.find(p => p.id === audiencePreset)?.label || 'mixed');
  const hasContext = hasPurpose || includedDocs.length > 0 || audiencePreset !== 'mixed';

  if (!hasContext) {
    return (
      <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono bg-surface-raised border border-surface-border text-ink-muted">
        <Info size={11} /> No strategic context set — scenarios will be generic. Add purpose & audience in Step 9 for aimed narratives.
      </div>
    );
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono bg-brand-fire/10 border border-brand-fire/30 text-brand-fire/80">
        <Check size={11} /> Context active
      </span>
      {hasPurpose && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono bg-surface-raised border border-surface-border text-ink-secondary">
          purpose · {purpose.length} chars
        </span>
      )}
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono bg-surface-raised border border-surface-border text-ink-secondary">
        audience · {audienceLabel}
      </span>
      {includedDocs.length > 0 && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono bg-surface-raised border border-surface-border text-ink-secondary">
          <FileText size={11} /> {includedDocs.length} doc{includedDocs.length !== 1 ? 's' : ''}
        </span>
      )}
    </div>
  );
}

function StatBox({ label, value, highlight }) {
  return (
    <div className={`p-4 rounded border ${highlight ? 'bg-brand-fire/10 border-brand-fire/30' : 'bg-surface-raised border-surface-border'}`}>
      <div className="text-xs font-mono text-ink-muted uppercase tracking-wider">{label}</div>
      <div className={`font-mono text-2xl mt-1 ${highlight ? 'text-brand-fire' : 'text-ink-primary'}`}>{value}</div>
    </div>
  );
}

function ControlSlider({ label, min, max, step, value, onChange, format }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <div className="text-xs font-mono text-ink-muted uppercase tracking-wider">{label}</div>
        <div className="text-sm font-mono text-brand-fire">{format(value)}</div>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))} className="w-full accent-brand-fire" />
    </div>
  );
}

function Metric({ label, value, highlight }) {
  return (
    <div className="text-center">
      <div className="text-[9px] uppercase tracking-wider text-ink-muted">{label}</div>
      <div className={highlight ? 'text-brand-fire font-semibold' : 'text-ink-secondary'}>
        {(value * 100).toFixed(0)}
      </div>
    </div>
  );
}

// ============================================================
// VISUALISATIONS
// ============================================================

function ArrivalTimeline({ seeds, seedNames }) {
  const width = 900;
  const height = 120;
  const padding = { top: 20, right: 60, bottom: 30, left: 80 };
  const innerWidth = width - padding.left - padding.right;
  const maxYears = HORIZON_YEARS;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
      {/* Axis */}
      <line x1={padding.left} y1={height - padding.bottom} x2={padding.left + innerWidth} y2={height - padding.bottom}
        stroke="#334155" strokeWidth={1} />

      {/* Year ticks */}
      {[0, 3, 6, 9, 12, 15].map(y => {
        const x = padding.left + (y / maxYears) * innerWidth;
        return (
          <g key={y}>
            <line x1={x} y1={height - padding.bottom} x2={x} y2={height - padding.bottom + 4} stroke="#475569" />
            <text x={x} y={height - padding.bottom + 16} className="fill-ink-muted" fontSize="10" textAnchor="middle" fontFamily="Noto Sans Mono">
              {y === 0 ? 'now' : `+${y}y`}
            </text>
          </g>
        );
      })}

      {/* "Today" marker */}
      <text x={padding.left - 8} y={height - padding.bottom + 4} className="fill-ink-secondary" fontSize="10" textAnchor="end" fontFamily="Noto Sans Mono">
        2026
      </text>
      <text x={padding.left + innerWidth + 8} y={height - padding.bottom + 4} className="fill-ink-secondary" fontSize="10" textAnchor="start" fontFamily="Noto Sans Mono">
        2041
      </text>

      {/* Seed arrival bands */}
      {seeds.map((s, idx) => {
        const color = SEED_COLORS[idx % SEED_COLORS.length];
        const yPos = padding.top + (idx + 0.5) * ((height - padding.top - padding.bottom) / Math.max(seeds.length, 1));
        const xMin = padding.left + (s.arrival.min / maxYears) * innerWidth;
        const xMax = padding.left + (s.arrival.max / maxYears) * innerWidth;
        const xMed = padding.left + (s.arrival.median / maxYears) * innerWidth;
        return (
          <g key={idx}>
            {/* Range bar */}
            <line x1={xMin} y1={yPos} x2={xMax} y2={yPos} stroke={color} strokeWidth={3} opacity={0.4} strokeLinecap="round" />
            {/* Median dot */}
            <circle cx={xMed} cy={yPos} r={5} fill={color} stroke="#0f172a" strokeWidth={1.5} />
            {/* Label */}
            <text x={padding.left - 8} y={yPos + 4} className="fill-ink-secondary" fontSize="11" textAnchor="end" fontFamily="Noto Sans Mono">
              #{idx + 1} {seedNames[idx] ? seedNames[idx].slice(0, 12) : ''}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function ParallelCoords({ factors, states, seeds, factorWeights, criticalities }) {
  const width = 900;
  const height = 340;
  const padding = { top: 30, right: 40, bottom: 90, left: 50 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const N = factors.length;
  const xScale = (i) => N > 1 ? padding.left + (innerWidth * i) / (N - 1) : padding.left + innerWidth / 2;

  const stateValues = states.map(s => s.value);
  const minVal = Math.min(...stateValues);
  const maxVal = Math.max(...stateValues);
  const yScale = (v) => maxVal === minVal ? padding.top + innerHeight / 2
    : padding.top + innerHeight - ((v - minVal) / (maxVal - minVal)) * innerHeight;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
      {factors.map((f, i) => {
        const crit = criticalities[i];
        const axisColor = crit > 0.5 ? '#f43f5e' : crit > 0.3 ? '#f59e0b' : '#334155';
        return (
          <g key={f.id}>
            <line x1={xScale(i)} y1={padding.top - 5} x2={xScale(i)} y2={padding.top + innerHeight + 5}
              stroke={axisColor} strokeWidth={crit > 0.5 ? 1.5 : 1} opacity={crit > 0.3 ? 0.8 : 0.5} />
            {states.map((s, si) => (
              <g key={si}>
                <circle cx={xScale(i)} cy={yScale(s.value)} r={2.5} className="fill-ink-muted" />
                {i === 0 && (
                  <text x={xScale(i) - 10} y={yScale(s.value) + 4} className="fill-ink-muted" fontSize="10" textAnchor="end" fontFamily="Noto Sans Mono">
                    {s.label}
                  </text>
                )}
              </g>
            ))}
            <text x={xScale(i)} y={padding.top + innerHeight + 22} className="fill-ink-secondary" fontSize="11" textAnchor="middle" fontFamily="Inter" fontWeight="500">
              {f.name.length > 14 ? f.name.slice(0, 13) + '…' : f.name}
            </text>
            <text x={xScale(i)} y={padding.top + innerHeight + 38} className="fill-ink-muted" fontSize="9" textAnchor="middle" fontFamily="Noto Sans Mono">
              w {(factorWeights[i] * 100).toFixed(0)}%
            </text>
            <text x={xScale(i)} y={padding.top + innerHeight + 52} fill={crit > 0.5 ? '#fb7185' : crit > 0.3 ? '#fbbf24' : '#475569'}
              fontSize="9" textAnchor="middle" fontFamily="Noto Sans Mono">
              c {(crit * 100).toFixed(0)}
            </text>
          </g>
        );
      })}

      {seeds.map((s, idx) => {
        const color = SEED_COLORS[idx % SEED_COLORS.length];
        const path = s.seed.map((stateIdx, i) => {
          const v = stateValues[stateIdx];
          return `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(v)}`;
        }).join(' ');
        return (
          <g key={idx}>
            <path d={path} stroke={color} strokeWidth={2.5} fill="none" opacity={0.85} strokeLinejoin="round" strokeLinecap="round" />
            {s.seed.map((stateIdx, i) => (
              <circle key={i} cx={xScale(i)} cy={yScale(stateValues[stateIdx])} r={4} fill={color} stroke="#0f172a" strokeWidth={1.5} />
            ))}
          </g>
        );
      })}

      <g transform={`translate(${padding.left}, ${height - 8})`}>
        {seeds.map((s, idx) => (
          <g key={idx} transform={`translate(${idx * 70}, 0)`}>
            <rect x={0} y={-8} width={10} height={3} fill={SEED_COLORS[idx % SEED_COLORS.length]} />
            <text x={14} y={-3} className="fill-ink-secondary" fontSize="10" fontFamily="Noto Sans Mono">#{idx + 1}</text>
          </g>
        ))}
      </g>
    </svg>
  );
}
