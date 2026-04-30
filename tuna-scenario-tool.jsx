import React, { useState, useMemo, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Plus, X, AlertCircle, RotateCcw, Info, Sparkles, ArrowRight, Clock, Zap, Anchor, Target, FileText, Upload, Check } from 'lucide-react';

// ============================================================
// CONSTANTS
// ============================================================

const RI = {
  1: 0, 2: 0, 3: 0.58, 4: 0.9, 5: 1.12, 6: 1.24,
  7: 1.32, 8: 1.41, 9: 1.45, 10: 1.49, 11: 1.51,
  12: 1.48, 13: 1.56, 14: 1.57, 15: 1.59
};

const DEFAULT_FACTORS = [
  { id: 'geo', name: 'Geopolitics', description: 'External political and strategic shocks' },
  { id: 'tech', name: 'Technology Velocity', description: 'Pace of technical change vs regulatory capacity' },
  { id: 'energy', name: 'Energy Security', description: 'Reliable, affordable energy supply' },
  { id: 'food', name: 'Food Security', description: 'Resilient food production and distribution' },
  { id: 'culture', name: 'Cultural Influence', description: 'Government vs platform cultural authority' },
  { id: 'social', name: 'Social Polarisation', description: 'Fragmentation of civic space' },
  { id: 'federal', name: 'Federalism Direction', description: 'Toward integration vs nationalism' },
  { id: 'defense', name: 'Defense Posture', description: 'Military readiness and integration' },
];

const DEFAULT_CRITERIA = [
  { id: 'impact', name: 'Impact Magnitude', description: 'How much could this factor reshape the future?' },
  { id: 'uncertainty', name: 'Uncertainty', description: 'How unpredictable is the trajectory?' },
  { id: 'relevance', name: 'Decision Relevance', description: 'Does it change what you would do?' },
  { id: 'horizon', name: 'Time Horizon Fit', description: 'Does it manifest by 2040?' },
  { id: 'independence', name: 'Causal Independence', description: 'Does it operate independently of other factors?' },
];

const DEFAULT_STATES = [
  { value: -1, label: 'Low' },
  { value: 0, label: 'Mid' },
  { value: 1, label: 'High' },
];

const DEFAULT_ARROW = { velocity: 0.5, pathDep: 0.5, proximity: 0.5, consequence: 0 };

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

  return selected.map((s, i) => {
    let totalD = 0; let count = 0;
    selected.forEach((other, j) => {
      if (i !== j) {
        totalD += weightedSeedDistance(s.seed, other.seed, factorWeights, stateValues);
        count++;
      }
    });
    return { ...s, avgDistance: count > 0 ? totalD / count : 0 };
  });
}

// Estimate arrival window for a seed in years
function estimateArrival(seed, arrows, factors, stateValues) {
  const yearsList = [];
  const arrivingFactors = [];
  const maxAbs = Math.max(...stateValues.map(Math.abs)) || 1;
  for (let i = 0; i < seed.length; i++) {
    const dev = Math.abs(stateValues[seed[i]]) / maxAbs;
    if (dev < 0.4) continue;
    const a = arrows[factors[i].id] || DEFAULT_ARROW;
    const yrs = (1 - a.velocity) * HORIZON_YEARS;
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
// SHARED UI
// ============================================================

const fontStack = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=IBM+Plex+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
  .font-display { font-family: 'Fraunces', Georgia, serif; font-feature-settings: 'ss01'; letter-spacing: -0.02em; }
  .font-body { font-family: 'IBM Plex Sans', system-ui, sans-serif; }
  .font-mono { font-family: 'JetBrains Mono', ui-monospace, monospace; }
`;

function ConsistencyBadge({ cr }) {
  const pct = (cr * 100).toFixed(1);
  let cls, label;
  if (cr <= 0.1) { cls = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'; label = 'Consistent'; }
  else if (cr <= 0.15) { cls = 'bg-amber-500/10 text-amber-400 border-amber-500/30'; label = 'Borderline'; }
  else { cls = 'bg-rose-500/10 text-rose-400 border-rose-500/30'; label = 'Inconsistent'; }
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
    ? 'text-slate-200'
    : pos < 0 ? 'text-amber-300' : 'text-slate-600';
  const bClass = pos === 0
    ? 'text-slate-200'
    : pos > 0 ? 'text-amber-300' : 'text-slate-600';

  return (
    <div className="py-3 border-b border-slate-800 last:border-0">
      <div className="flex items-center gap-4 mb-2">
        <div className={`flex-1 text-right text-sm font-medium transition-colors ${aClass}`}>{nameA}</div>
        <div className="text-xs font-mono text-slate-500 px-2">vs</div>
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
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-lg shadow-amber-500/20'
                  : isCenter
                    ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    : 'bg-slate-800 text-slate-500 hover:bg-slate-700 hover:text-slate-300'
                }
              `}
              title={isCenter ? 'Equal' : `${Math.abs(p) + 1}× ${p < 0 ? nameA : nameB}`}
            >
              {isCenter ? '1' : Math.abs(p) + 1}
            </button>
          );
        })}
      </div>
      <div className="text-center mt-2 text-xs font-mono text-slate-500">{description}</div>
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
        <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400 uppercase tracking-wider">
          {Icon && <Icon size={11} />}
          {label}
        </div>
        <div className="text-xs font-mono text-amber-400">
          {signed ? (value > 0 ? '+' : '') + value.toFixed(2) : value.toFixed(2)}
        </div>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-amber-500"
      />
      <div className="flex justify-between text-[10px] font-mono text-slate-600 mt-1">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================

export default function TUNAScenarioTool() {
  const [step, setStep] = useState(1);
  const [factors, setFactors] = useState(DEFAULT_FACTORS);
  const [criteria, setCriteria] = useState(DEFAULT_CRITERIA);
  const [criteriaMatrix, setCriteriaMatrix] = useState(() => identityMatrix(DEFAULT_CRITERIA.length));
  const [factorMatrices, setFactorMatrices] = useState(() => {
    const m = {};
    DEFAULT_CRITERIA.forEach(c => { m[c.id] = identityMatrix(DEFAULT_FACTORS.length); });
    return m;
  });
  const [topN, setTopN] = useState(6);
  const [factorArrows, setFactorArrows] = useState(() => {
    const a = {};
    DEFAULT_FACTORS.forEach(f => { a[f.id] = { ...DEFAULT_ARROW }; });
    return a;
  });
  const [factorStates, setFactorStates] = useState(DEFAULT_STATES);
  const [stateLabelOverrides, setStateLabelOverrides] = useState({});
  // Signed coupling: -9 to +9
  const [couplingMatrix, setCouplingMatrix] = useState(() =>
    Array.from({ length: 6 }, () => Array(6).fill(0))
  );
  // Asymmetric trigger matrix: trigger[i][j] = does i trigger j? (0 or 1)
  const [triggerMatrix, setTriggerMatrix] = useState(() =>
    Array.from({ length: 6 }, () => Array(6).fill(0))
  );
  const [K, setK] = useState(4);
  const [alpha, setAlpha] = useState(0.5);
  const [convergenceFocus, setConvergenceFocus] = useState(0.6);
  const [coherenceThreshold, setCoherenceThreshold] = useState(0.4);
  const [seedNames, setSeedNames] = useState({});
  const [seedPhases, setSeedPhases] = useState({});
  // Strategic context for AI generation
  const [purpose, setPurpose] = useState('');
  const [audiencePreset, setAudiencePreset] = useState('mixed');
  const [audienceCustom, setAudienceCustom] = useState('');
  const [documents, setDocuments] = useState([]); // [{id, name, content, included}]
  // Errors from building the AI prompt download
  const [generationErrors, setGenerationErrors] = useState({});

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

  const scoredSeeds = useMemo(() => {
    if (!seedSpace.seeds) return [];
    return seedSpace.seeds.map(seed => ({
      seed,
      ...scoreSeed(seed, topFactorWeights, topCriticalities, couplingMatrix, stateValues),
    }));
  }, [seedSpace, topFactorWeights, topCriticalities, couplingMatrix, stateValues]);

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
    1: factors.length >= 3, 2: criteria.length >= 2, 3: true, 4: true,
    5: true, 6: true, 7: factorStates.length >= 2, 8: true, 9: true, 10: true,
  };

  // === Reset ===
  const handleReset = () => {
    if (!confirm('Reset all data to defaults?')) return;
    setFactors(DEFAULT_FACTORS);
    setCriteria(DEFAULT_CRITERIA);
    setCriteriaMatrix(identityMatrix(DEFAULT_CRITERIA.length));
    const fm = {};
    DEFAULT_CRITERIA.forEach(c => { fm[c.id] = identityMatrix(DEFAULT_FACTORS.length); });
    setFactorMatrices(fm);
    setTopN(6);
    const fa = {};
    DEFAULT_FACTORS.forEach(f => { fa[f.id] = { ...DEFAULT_ARROW }; });
    setFactorArrows(fa);
    setFactorStates(DEFAULT_STATES);
    setStateLabelOverrides({});
    setCouplingMatrix(Array.from({ length: 6 }, () => Array(6).fill(0)));
    setTriggerMatrix(Array.from({ length: 6 }, () => Array(6).fill(0)));
    setK(4); setAlpha(0.5); setConvergenceFocus(0.6); setCoherenceThreshold(0.4);
    setSeedNames({}); setSeedPhases({});
    setPurpose(''); setAudiencePreset('mixed'); setAudienceCustom(''); setDocuments([]);
    setGenerationErrors({});
    setStep(1);
  };

  // === Step renderer ===

  const renderStep = () => {
    switch (step) {
      case 1: return <StepFactors factors={factors} setFactors={setFactors} />;
      case 2: return <StepCriteria criteria={criteria} setCriteria={setCriteria} />;
      case 3: return <StepWeightCriteria criteria={criteria} matrix={criteriaMatrix} setMatrix={setCriteriaMatrix} weights={criteriaWeights} cr={criteriaCR} />;
      case 4: return <StepScoreFactors factors={factors} criteria={criteria} matrices={factorMatrices} setMatrices={setFactorMatrices} weightsByCriterion={factorWeightsByCriterion} crByCriterion={factorCRByCriterion} />;
      case 5: return <StepSynthesis factors={factors} criteria={criteria} factorWeightsByCriterion={factorWeightsByCriterion} globalFactorWeights={globalFactorWeights} topN={topN} setTopN={setTopN} />;
      case 6: return <StepArrows topFactors={topFactors} factorArrows={factorArrows} setFactorArrows={setFactorArrows} />;
      case 7: return <StepStates factorStates={factorStates} setFactorStates={setFactorStates} topFactors={topFactors} stateLabelOverrides={stateLabelOverrides} setStateLabelOverrides={setStateLabelOverrides} />;
      case 8: return <StepCoupling topFactors={topFactors} couplingMatrix={couplingMatrix} setCouplingMatrix={setCouplingMatrix} triggerMatrix={triggerMatrix} setTriggerMatrix={setTriggerMatrix} />;
      case 9: return <StepContext purpose={purpose} setPurpose={setPurpose} audiencePreset={audiencePreset} setAudiencePreset={setAudiencePreset} audienceCustom={audienceCustom} setAudienceCustom={setAudienceCustom} documents={documents} setDocuments={setDocuments} />;
      case 10: return <StepSeeds topFactors={topFactors} factorStates={factorStates} stateLabelOverrides={stateLabelOverrides} seedSpace={seedSpace} scoredSeeds={scoredSeeds} filteredSeeds={filteredSeeds} selectedSeeds={enrichedSeeds} K={K} setK={setK} alpha={alpha} setAlpha={setAlpha} convergenceFocus={convergenceFocus} setConvergenceFocus={setConvergenceFocus} coherenceThreshold={coherenceThreshold} setCoherenceThreshold={setCoherenceThreshold} seedNames={seedNames} setSeedNames={setSeedNames} seedPhases={seedPhases} setSeedPhases={setSeedPhases} topFactorWeights={topFactorWeights} topCriticalities={topCriticalities} factorArrows={factorArrows} couplingMatrix={couplingMatrix} triggerMatrix={triggerMatrix} generationErrors={generationErrors} setGenerationErrors={setGenerationErrors} purpose={purpose} audiencePreset={audiencePreset} audienceCustom={audienceCustom} documents={documents} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-body">
      <style>{fontStack}</style>

      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="font-display text-2xl text-slate-50 leading-tight">TUNA Scenario Selector</h1>
              <p className="text-xs font-mono text-slate-500 mt-0.5">
                AHP weighting · arrows of time · signed coupling · convergence-driven seed selection
              </p>
            </div>
            <button
              onClick={handleReset}
              className="text-xs font-mono text-slate-500 hover:text-slate-300 flex items-center gap-1.5 px-3 py-1.5 rounded border border-slate-800 hover:border-slate-700 transition"
            >
              <RotateCcw size={12} /> Reset
            </button>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto">
            {STEPS.map((s, idx) => (
              <React.Fragment key={s.num}>
                <button
                  onClick={() => s.num < step && setStep(s.num)}
                  disabled={s.num > step}
                  className={`
                    flex-1 py-1.5 text-xs font-mono transition relative whitespace-nowrap
                    ${s.num === step ? 'text-amber-400' : s.num < step ? 'text-slate-400 hover:text-slate-200 cursor-pointer' : 'text-slate-600'}
                  `}
                >
                  <div className="flex items-center justify-center gap-2">
                    <span className={`
                      w-5 h-5 rounded-full flex items-center justify-center text-[10px] flex-shrink-0
                      ${s.num === step ? 'bg-amber-500 text-slate-950' : s.num < step ? 'bg-slate-700 text-slate-200' : 'bg-slate-800 text-slate-600'}
                    `}>
                      {s.num < step ? '✓' : s.num}
                    </span>
                    <span className="hidden lg:inline">{s.label}</span>
                  </div>
                </button>
                {idx < STEPS.length - 1 && <div className="w-2 h-px bg-slate-800" />}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10 pb-32">
        {renderStep()}
      </div>

      <div className="border-t border-slate-800 bg-slate-900/50 backdrop-blur fixed bottom-0 left-0 right-0">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => setStep(s => Math.max(1, s - 1))}
            disabled={step === 1}
            className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            <ChevronLeft size={16} /> Back
          </button>
          <div className="text-xs font-mono text-slate-600">Step {step} / {STEPS.length}</div>
          <button
            onClick={() => setStep(s => Math.min(STEPS.length, s + 1))}
            disabled={step === STEPS.length || !canProceed[step]}
            className="flex items-center gap-2 text-sm font-medium bg-amber-500 hover:bg-amber-400 text-slate-950 px-5 py-2 rounded disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            {step === STEPS.length ? 'Done' : 'Continue'} <ChevronRight size={16} />
          </button>
        </div>
      </div>
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
        <div className="text-xs font-mono text-amber-400 mb-2">STEP 01</div>
        <h2 className="font-display text-4xl text-slate-50 mb-3">Define your candidate factors</h2>
        <p className="text-slate-400 max-w-2xl">
          The forces, drivers, and uncertainties shaping the future. Each becomes a dimension in the morphological space — every scenario seed will be a profile across all of them.
        </p>
      </div>

      <div className="space-y-2">
        {factors.map((f, idx) => (
          <div key={f.id} className="group flex items-start gap-3 p-4 bg-slate-900 rounded border border-slate-800 hover:border-slate-700 transition">
            <div className="text-xs font-mono text-slate-600 w-6 pt-1">{String(idx + 1).padStart(2, '0')}</div>
            <div className="flex-1 space-y-1">
              <input
                value={f.name}
                onChange={(e) => setFactors(factors.map((x, i) => i === idx ? { ...x, name: e.target.value } : x))}
                className="bg-transparent text-slate-100 font-medium w-full focus:outline-none focus:text-amber-300 transition"
              />
              <input
                value={f.description}
                onChange={(e) => setFactors(factors.map((x, i) => i === idx ? { ...x, description: e.target.value } : x))}
                placeholder="Brief description"
                className="bg-transparent text-slate-500 text-sm w-full focus:outline-none focus:text-slate-300 transition"
              />
            </div>
            <button
              onClick={() => setFactors(factors.filter((_, i) => i !== idx))}
              className="text-slate-700 hover:text-rose-400 transition opacity-0 group-hover:opacity-100"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      <div className="p-4 bg-slate-900/50 rounded border border-dashed border-slate-700">
        <div className="flex gap-3">
          <input
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addFactor()}
            placeholder="New factor name"
            className="flex-1 bg-slate-900 text-slate-100 px-3 py-2 rounded border border-slate-800 focus:border-amber-500/50 focus:outline-none text-sm"
          />
          <input
            value={draftDesc}
            onChange={(e) => setDraftDesc(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addFactor()}
            placeholder="Description (optional)"
            className="flex-[2] bg-slate-900 text-slate-100 px-3 py-2 rounded border border-slate-800 focus:border-amber-500/50 focus:outline-none text-sm"
          />
          <button
            onClick={addFactor}
            disabled={!draftName.trim()}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded text-sm disabled:opacity-30 transition"
          >
            <Plus size={14} /> Add
          </button>
        </div>
      </div>

      {factors.length < 3 && (
        <div className="flex items-center gap-2 text-amber-400 text-sm">
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
        <div className="text-xs font-mono text-amber-400 mb-2">STEP 02</div>
        <h2 className="font-display text-4xl text-slate-50 mb-3">Set your evaluation criteria</h2>
        <p className="text-slate-400 max-w-2xl">
          The lenses through which you'll judge each factor's importance.
        </p>
      </div>

      <div className="space-y-2">
        {criteria.map((c, idx) => (
          <div key={c.id} className="group flex items-start gap-3 p-4 bg-slate-900 rounded border border-slate-800 hover:border-slate-700 transition">
            <div className="text-xs font-mono text-slate-600 w-6 pt-1">{String(idx + 1).padStart(2, '0')}</div>
            <div className="flex-1 space-y-1">
              <input
                value={c.name}
                onChange={(e) => setCriteria(criteria.map((x, i) => i === idx ? { ...x, name: e.target.value } : x))}
                className="bg-transparent text-slate-100 font-medium w-full focus:outline-none focus:text-amber-300 transition"
              />
              <input
                value={c.description}
                onChange={(e) => setCriteria(criteria.map((x, i) => i === idx ? { ...x, description: e.target.value } : x))}
                placeholder="Brief description"
                className="bg-transparent text-slate-500 text-sm w-full focus:outline-none focus:text-slate-300 transition"
              />
            </div>
            <button
              onClick={() => setCriteria(criteria.filter((_, i) => i !== idx))}
              className="text-slate-700 hover:text-rose-400 transition opacity-0 group-hover:opacity-100"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      <div className="p-4 bg-slate-900/50 rounded border border-dashed border-slate-700">
        <div className="flex gap-3">
          <input
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCriterion()}
            placeholder="New criterion name"
            className="flex-1 bg-slate-900 text-slate-100 px-3 py-2 rounded border border-slate-800 focus:border-amber-500/50 focus:outline-none text-sm"
          />
          <input
            value={draftDesc}
            onChange={(e) => setDraftDesc(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCriterion()}
            placeholder="Description (optional)"
            className="flex-[2] bg-slate-900 text-slate-100 px-3 py-2 rounded border border-slate-800 focus:border-amber-500/50 focus:outline-none text-sm"
          />
          <button
            onClick={addCriterion}
            disabled={!draftName.trim()}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded text-sm disabled:opacity-30 transition"
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
        <div className="text-xs font-mono text-amber-400 mb-2">STEP 03</div>
        <h2 className="font-display text-4xl text-slate-50 mb-3">Weight your criteria</h2>
        <p className="text-slate-400 max-w-2xl">
          Saaty 1–9: 1 = equal, 3 = moderate, 5 = strong, 7 = very strong, 9 = extreme.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-slate-900 rounded border border-slate-800 p-6">
          <div className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-4">Pairwise comparisons</div>
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
          <div className="bg-slate-900 rounded border border-slate-800 p-5">
            <div className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-3">Resulting weights</div>
            <div className="space-y-2">
              {criteria.map((c, idx) => {
                const w = weights[idx] || 0;
                return (
                  <div key={c.id} className="space-y-1">
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="text-slate-300">{c.name}</span>
                      <span className="font-mono text-amber-400">{(w * 100).toFixed(1)}%</span>
                    </div>
                    <div className="h-1 bg-slate-800 rounded overflow-hidden">
                      <div className="h-full bg-amber-500/60" style={{ width: `${w * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-slate-900 rounded border border-slate-800 p-5">
            <div className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-3">Consistency</div>
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
        <div className="text-xs font-mono text-amber-400 mb-2">STEP 04</div>
        <h2 className="font-display text-4xl text-slate-50 mb-3">Score factors against each criterion</h2>
        <p className="text-slate-400 max-w-2xl">Switch tabs to work through each lens. Live consistency check per matrix.</p>
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
                ${active ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700'}
              `}
            >
              {c.name}
              {!active && (
                <span className={`text-[10px] font-mono ${cri <= 0.1 ? 'text-emerald-400' : cri <= 0.15 ? 'text-amber-400' : 'text-rose-400'}`}>
                  {(cri * 100).toFixed(0)}%
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-slate-900 rounded border border-slate-800 p-6">
          <div className="mb-4">
            <div className="text-xs font-mono text-slate-500 uppercase tracking-wider">Criterion</div>
            <div className="font-display text-xl text-slate-100 mt-1">{activeCriterion?.name}</div>
            {activeCriterion?.description && (
              <div className="text-sm text-slate-500 mt-1">{activeCriterion.description}</div>
            )}
          </div>
          <div className="border-t border-slate-800 pt-2">
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
          <div className="bg-slate-900 rounded border border-slate-800 p-5">
            <div className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-3">Local weights</div>
            <div className="space-y-2">
              {factors.map((f, idx) => {
                const w = weights[idx] || 0;
                return (
                  <div key={f.id} className="space-y-1">
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="text-slate-300 truncate">{f.name}</span>
                      <span className="font-mono text-amber-400 text-xs">{(w * 100).toFixed(1)}%</span>
                    </div>
                    <div className="h-1 bg-slate-800 rounded overflow-hidden">
                      <div className="h-full bg-amber-500/60" style={{ width: `${w * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-slate-900 rounded border border-slate-800 p-5">
            <div className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-3">Consistency</div>
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
        <div className="text-xs font-mono text-amber-400 mb-2">STEP 05</div>
        <h2 className="font-display text-4xl text-slate-50 mb-3">Synthesis</h2>
        <p className="text-slate-400 max-w-2xl">
          Choose how many top-ranked factors to carry forward. Cost grows as |states|<sup>N</sup> seeds.
        </p>
      </div>

      <div className="bg-slate-900 rounded border border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="text-xs font-mono text-slate-500 uppercase tracking-wider">Ranked factors</div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-slate-500">Carry forward top</span>
            <select
              value={topN}
              onChange={(e) => setTopN(parseInt(e.target.value))}
              className="bg-slate-800 text-slate-100 px-3 py-1 rounded border border-slate-700 text-sm font-mono focus:outline-none focus:border-amber-500/50"
            >
              {Array.from({ length: factors.length - 2 }, (_, i) => i + 3).map(n => (
                <option key={n} value={n}>{n} factors</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-900/50">
              <tr className="text-xs font-mono text-slate-500 uppercase">
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
                  <tr key={row.factor.id} className={`border-t border-slate-800 ${isTop ? 'bg-amber-500/5' : ''}`}>
                    <td className="px-6 py-3 font-mono text-xs text-slate-500">{String(idx + 1).padStart(2, '0')}</td>
                    <td className="px-2 py-3">
                      <div className={`font-medium ${isTop ? 'text-amber-300' : 'text-slate-200'}`}>{row.factor.name}</div>
                      {row.factor.description && (
                        <div className="text-xs text-slate-500 mt-0.5">{row.factor.description}</div>
                      )}
                    </td>
                    {criteria.map(c => {
                      const factorIdx = factors.findIndex(f => f.id === row.factor.id);
                      const localW = factorWeightsByCriterion[c.id]?.[factorIdx] || 0;
                      return (
                        <td key={c.id} className="px-3 py-3 text-right font-mono text-xs text-slate-500">
                          {(localW * 100).toFixed(0)}
                        </td>
                      );
                    })}
                    <td className="px-6 py-3 text-right">
                      <div className={`font-mono ${isTop ? 'text-amber-400 font-semibold' : 'text-slate-400'}`}>
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
        <div className="text-xs font-mono text-amber-400 mb-2">STEP 06 · NEW</div>
        <h2 className="font-display text-4xl text-slate-50 mb-3">Arrows of time</h2>
        <p className="text-slate-400 max-w-2xl">
          For each top factor, characterise the three Oxford arrows: the contextual future arriving at you (velocity, proximity to threshold), the past catching up with you (path-dependency), and the asymmetry of what arrives. Together these determine which factors are bifurcation candidates.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-2">
        <div className="bg-slate-900/50 rounded border border-slate-800 p-4">
          <div className="flex items-center gap-2 text-xs font-mono text-rose-400 uppercase tracking-wider mb-2">
            <Zap size={12} /> Red arrow
          </div>
          <div className="text-sm text-slate-300">Coming towards you. Velocity & proximity.</div>
        </div>
        <div className="bg-slate-900/50 rounded border border-slate-800 p-4">
          <div className="flex items-center gap-2 text-xs font-mono text-sky-400 uppercase tracking-wider mb-2">
            <Anchor size={12} /> Blue arrow
          </div>
          <div className="text-sm text-slate-300">Past catching up. Path-dependency load.</div>
        </div>
        <div className="bg-slate-900/50 rounded border border-slate-800 p-4">
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-wider mb-2">
            <Target size={12} /> Asymmetry
          </div>
          <div className="text-sm text-slate-300">Mostly upside or mostly downside?</div>
        </div>
      </div>

      <div className="space-y-3">
        {topFactors.map((tf, idx) => {
          const a = factorArrows[tf.factor.id] || DEFAULT_ARROW;
          const crit = calcCriticality(a);
          const critColor = crit > 0.5 ? 'text-rose-400 border-rose-500/40 bg-rose-500/10'
            : crit > 0.3 ? 'text-amber-400 border-amber-500/40 bg-amber-500/10'
            : 'text-slate-400 border-slate-700 bg-slate-800';
          return (
            <div key={tf.factor.id} className="bg-slate-900 rounded border border-slate-800 p-5">
              <div className="flex items-baseline justify-between mb-4">
                <div>
                  <div className="text-xs font-mono text-slate-600 mb-1">#{idx + 1} · w {(tf.weight * 100).toFixed(1)}%</div>
                  <div className="font-display text-xl text-slate-100">{tf.factor.name}</div>
                  {tf.factor.description && (
                    <div className="text-xs text-slate-500 mt-0.5">{tf.factor.description}</div>
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

      <div className="bg-slate-900/50 rounded border border-slate-800 p-5">
        <div className="flex items-start gap-3">
          <Info size={16} className="text-amber-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-slate-400">
            <span className="text-slate-200 font-medium">Criticality</span> = velocity × proximity, amplified by path-dependency. Bifurcation happens when high-criticality factors converge — many arrows arriving simultaneously. Factors above 50% criticality drive scenario timing.
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
        <div className="text-xs font-mono text-amber-400 mb-2">STEP 07</div>
        <h2 className="font-display text-4xl text-slate-50 mb-3">Define factor states</h2>
        <p className="text-slate-400 max-w-2xl">
          Each top factor takes one state per scenario. Default Low/Mid/High at −1, 0, +1. Override labels per factor for narrative clarity.
        </p>
      </div>

      <div className="bg-slate-900 rounded border border-slate-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs font-mono text-slate-500 uppercase tracking-wider">Global states</div>
          <button
            onClick={addState}
            disabled={factorStates.length >= 5}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1 rounded text-xs disabled:opacity-30 transition"
          >
            <Plus size={12} /> Add state
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {factorStates.map((s, idx) => (
            <div key={idx} className="bg-slate-950 rounded border border-slate-800 p-3 group relative">
              <button
                onClick={() => removeState(idx)}
                disabled={factorStates.length <= 2}
                className="absolute top-1 right-1 text-slate-700 hover:text-rose-400 opacity-0 group-hover:opacity-100 disabled:opacity-0 transition"
              >
                <X size={12} />
              </button>
              <input
                value={s.label}
                onChange={(e) => updateGlobalLabel(idx, e.target.value)}
                className="bg-transparent text-slate-100 font-medium text-sm w-full focus:outline-none focus:text-amber-300 transition"
              />
              <input
                type="number"
                step="0.5"
                value={s.value}
                onChange={(e) => updateGlobalValue(idx, e.target.value)}
                className="bg-transparent text-slate-500 font-mono text-xs w-full mt-1 focus:outline-none focus:text-amber-400 transition"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-900 rounded border border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800">
          <div className="text-xs font-mono text-slate-500 uppercase tracking-wider">Per-factor label overrides</div>
          <div className="text-xs text-slate-600 mt-1">Numeric values stay global. Leave blank to use the default.</div>
        </div>
        <table className="w-full">
          <thead className="bg-slate-900/50">
            <tr className="text-xs font-mono text-slate-500 uppercase">
              <th className="px-6 py-3 text-left">Factor</th>
              {factorStates.map((s, idx) => (
                <th key={idx} className="px-3 py-3 text-left">
                  {s.label} <span className="text-slate-700">({s.value})</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {topFactors.map((tf) => (
              <tr key={tf.factor.id} className="border-t border-slate-800">
                <td className="px-6 py-3">
                  <div className="text-slate-200 text-sm font-medium">{tf.factor.name}</div>
                  <div className="text-xs font-mono text-slate-600">w = {(tf.weight * 100).toFixed(1)}%</div>
                </td>
                {factorStates.map((s, sIdx) => (
                  <td key={sIdx} className="px-3 py-2">
                    <input
                      value={stateLabelOverrides[tf.factor.id]?.[sIdx] || ''}
                      onChange={(e) => updateOverride(tf.factor.id, sIdx, e.target.value)}
                      placeholder={s.label}
                      className="bg-slate-950 text-slate-100 placeholder-slate-700 text-sm px-2 py-1 rounded border border-slate-800 focus:border-amber-500/50 focus:outline-none w-full"
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

function StepCoupling({ topFactors, couplingMatrix, setCouplingMatrix, triggerMatrix, setTriggerMatrix }) {
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
        <div className="text-xs font-mono text-amber-400 mb-2">STEP 08 · ENHANCED</div>
        <h2 className="font-display text-4xl text-slate-50 mb-3">Coupling & triggering chains</h2>
        <p className="text-slate-400 max-w-2xl">
          For each pair: the magnitude of coupling, its polarity (reinforcing or damping), and whether either factor triggers the other. Reinforcing coupling creates Arthur's positive-feedback loops — the structural signature of an approaching bifurcation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
        <div className="bg-slate-900/50 rounded border border-slate-800 p-4">
          <div className="text-xs font-mono text-emerald-400 uppercase tracking-wider mb-2">Reinforcing (+)</div>
          <div className="text-sm text-slate-300">Factors move together. Increasing returns. Amplification.</div>
        </div>
        <div className="bg-slate-900/50 rounded border border-slate-800 p-4">
          <div className="text-xs font-mono text-rose-400 uppercase tracking-wider mb-2">Damping (−)</div>
          <div className="text-sm text-slate-300">Factors counteract. Negative feedback. Equilibrium-seeking.</div>
        </div>
      </div>

      <div className="bg-slate-900 rounded border border-slate-800 p-6 space-y-6">
        {pairs.map(([i, j]) => {
          const v = couplingMatrix[i]?.[j] ?? 0;
          const trigIJ = triggerMatrix[i]?.[j] ?? 0;
          const trigJI = triggerMatrix[j]?.[i] ?? 0;
          return (
            <div key={`${i}-${j}`} className="space-y-3 pb-6 border-b border-slate-800 last:border-0 last:pb-0">
              <div className="flex items-baseline justify-between">
                <div className="flex items-baseline gap-3">
                  <span className="font-medium text-slate-100">{topFactors[i].factor.name}</span>
                  <span className="text-slate-600 text-xs font-mono">↔</span>
                  <span className="font-medium text-slate-100">{topFactors[j].factor.name}</span>
                </div>
                <span className={`text-xs font-mono ${v > 0 ? 'text-emerald-400' : v < 0 ? 'text-rose-400' : 'text-slate-500'}`}>
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
                        ? n > 0 ? 'bg-emerald-500 text-slate-950 font-semibold'
                          : n < 0 ? 'bg-rose-500 text-slate-950 font-semibold'
                          : 'bg-slate-500 text-slate-950 font-semibold'
                        : 'bg-slate-800 text-slate-500 hover:bg-slate-700 hover:text-slate-200'
                      }
                    `}
                  >
                    {n > 0 ? `+${n}` : n}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="font-mono text-slate-600 uppercase tracking-wider">Triggers:</span>
                <button
                  onClick={() => toggleTrigger(i, j)}
                  className={`
                    flex items-center gap-1.5 px-3 py-1 rounded transition
                    ${trigIJ ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-800 text-slate-500 border border-slate-800 hover:border-slate-700'}
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
                    ${trigJI ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-800 text-slate-500 border border-slate-800 hover:border-slate-700'}
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
        <div className="text-xs font-mono text-amber-400 mb-2">STEP 09 · CONTEXT</div>
        <h2 className="font-display text-4xl text-slate-50 mb-3">Strategic context</h2>
        <p className="text-slate-400 max-w-2xl">
          Tell the AI what these scenarios are for, who will read them, and (optionally) provide documents that ground the narrative in your actual situation. Without context, scenarios read as generic foresight; with it, they're aimed.
        </p>
      </div>

      {/* Purpose */}
      <div className="bg-slate-900 rounded border border-slate-800 p-6">
        <div className="flex items-baseline justify-between mb-3">
          <div className="text-xs font-mono text-slate-500 uppercase tracking-wider">Purpose</div>
          <div className="text-xs font-mono text-slate-600">{purpose.length} chars</div>
        </div>
        <textarea
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          placeholder="What decision will these scenarios inform? E.g., 'Stress-testing a five-year investment thesis in compliance-tech for the European market', or 'Preparing a 2040 outlook for the board's strategy day on regulatory exposure'."
          className="w-full bg-slate-950 text-slate-100 placeholder-slate-700 text-sm px-4 py-3 rounded border border-slate-800 focus:border-amber-500/50 focus:outline-none min-h-[120px] resize-y leading-relaxed"
        />
        <div className="text-xs text-slate-600 mt-2 leading-relaxed">
          The AI uses this to focus the strategic implications and avoid generic foresight commentary. Specific is better than general — name the actual decision, the timeframe, and the constraints.
        </div>
      </div>

      {/* Audience */}
      <div className="bg-slate-900 rounded border border-slate-800 p-6">
        <div className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-3">Audience</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
          {AUDIENCE_PRESETS.map(p => {
            const active = audiencePreset === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setAudiencePreset(p.id)}
                className={`px-3 py-2 rounded text-sm transition border
                  ${active
                    ? 'bg-amber-500 text-slate-950 border-amber-500 font-medium'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
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
            className="w-full bg-slate-950 text-slate-100 placeholder-slate-700 text-sm px-3 py-2 rounded border border-slate-800 focus:border-amber-500/50 focus:outline-none"
          />
        )}
        <div className="text-xs text-slate-600 mt-2">
          Tunes vocabulary, register, and how methodological the strategic implications get.
        </div>
      </div>

      {/* Documents */}
      <div className="bg-slate-900 rounded border border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="text-xs font-mono text-slate-500 uppercase tracking-wider">Supporting documents</div>
            <div className="text-xs text-slate-600 mt-1">
              {documents.length === 0
                ? 'Optional — paste or upload documents that ground the scenario in your situation'
                : `${includedCount} of ${documents.length} included · ${totalChars.toLocaleString()} chars`}
            </div>
          </div>
          <label className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded text-xs cursor-pointer transition">
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
          <div className="divide-y divide-slate-800">
            {documents.map((doc) => (
              <div key={doc.id} className="px-6 py-4 group">
                <div className="flex items-center gap-3 mb-2">
                  <button
                    onClick={() => toggleInclude(doc.id)}
                    className={`w-5 h-5 rounded flex items-center justify-center transition flex-shrink-0
                      ${doc.included
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800 border border-slate-700 hover:border-slate-600'
                      }`}
                    title={doc.included ? 'Included in generation' : 'Excluded from generation'}
                  >
                    {doc.included && <Check size={12} />}
                  </button>
                  <FileText size={14} className="text-slate-500 flex-shrink-0" />
                  <input
                    value={doc.name}
                    onChange={(e) => updateDocName(doc.id, e.target.value)}
                    className="flex-1 bg-transparent text-slate-100 text-sm font-medium focus:outline-none focus:text-amber-300"
                  />
                  <span className="text-[10px] font-mono text-slate-600">{(doc.content?.length || 0).toLocaleString()} chars</span>
                  <button
                    onClick={() => removeDocument(doc.id)}
                    className="text-slate-700 hover:text-rose-400 transition opacity-0 group-hover:opacity-100"
                  >
                    <X size={14} />
                  </button>
                </div>
                <textarea
                  value={doc.content}
                  onChange={(e) => updateDocContent(doc.id, e.target.value)}
                  className="w-full bg-slate-950 text-slate-300 text-xs px-3 py-2 rounded border border-slate-800 focus:border-amber-500/30 focus:outline-none min-h-[80px] max-h-[240px] resize-y font-mono leading-relaxed"
                />
              </div>
            ))}
          </div>
        )}

        <div className="px-6 py-4 bg-slate-950/40 border-t border-slate-800 space-y-2">
          <input
            value={draftDocName}
            onChange={(e) => setDraftDocName(e.target.value)}
            placeholder="Document name (e.g., 'Q3 strategy memo', 'Competitive landscape')"
            className="w-full bg-slate-900 text-slate-100 placeholder-slate-700 text-sm px-3 py-2 rounded border border-slate-800 focus:border-amber-500/50 focus:outline-none"
          />
          <textarea
            value={draftDocContent}
            onChange={(e) => setDraftDocContent(e.target.value)}
            placeholder="Paste document content here…"
            className="w-full bg-slate-900 text-slate-100 placeholder-slate-700 text-xs px-3 py-2 rounded border border-slate-800 focus:border-amber-500/50 focus:outline-none min-h-[80px] resize-y font-mono leading-relaxed"
          />
          <div className="flex justify-end">
            <button
              onClick={addDocument}
              disabled={!draftDocName.trim() && !draftDocContent.trim()}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded text-xs disabled:opacity-30 transition"
            >
              <Plus size={12} /> Add document
            </button>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/50 rounded border border-slate-800 p-5">
        <div className="flex items-start gap-3">
          <Info size={16} className="text-amber-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-slate-400">
            <span className="text-slate-200 font-medium">Documents are sent verbatim to the model</span> when included. Use the checkbox to toggle which documents apply per generation run — you can have a "tech-investor" bundle and a "policy-board" bundle and switch between them. Long documents work fine but inflate prompt size; if you have many or very long documents, consider summarising them first.
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// STEP 10 — SEEDS WITH CONVERGENCE & ARRIVAL
// ============================================================

function StepSeeds({ topFactors, factorStates, stateLabelOverrides, seedSpace, scoredSeeds, filteredSeeds, selectedSeeds, K, setK, alpha, setAlpha, convergenceFocus, setConvergenceFocus, coherenceThreshold, setCoherenceThreshold, seedNames, setSeedNames, seedPhases, setSeedPhases, topFactorWeights, topCriticalities, factorArrows, couplingMatrix, triggerMatrix, generationErrors, setGenerationErrors, purpose, audiencePreset, audienceCustom, documents }) {

  const stateLabel = (factorId, stateIdx) =>
    stateLabelOverrides[factorId]?.[stateIdx] || factorStates[stateIdx]?.label || '';

  const stateColor = (stateIdx) => {
    const v = factorStates[stateIdx]?.value ?? 0;
    const max = Math.max(...factorStates.map(s => Math.abs(s.value))) || 1;
    const norm = v / max;
    if (norm > 0.33) return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    if (norm < -0.33) return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
    return 'bg-slate-700/40 text-slate-300 border-slate-600/40';
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
=== INSTRUCTIONS ===
Write the scenario as a single JSON object with the following keys, returning ONLY the JSON object with no preamble, no markdown fences, no commentary outside the JSON:

{
  "name": "Evocative 2-4 word scenario name (e.g. 'The Hardened Decade', 'The Velocity Trap', 'Splintered Commons')",
  "tagline": "One-sentence summary of the world",
  "narrative": "Exactly 2 paragraphs, 200-280 words total. Describe the world: what's happening, how it feels day-to-day, what tensions are at play. Specific and grounded. Avoid generic platitudes about technology, society, or change. Reference specific factors and their interactions where relevant. Write in present tense as if observing the year ${new Date().getFullYear() + Math.round(seed.arrival.median)} from within it.",
  "tension": "1 paragraph, 80-120 words. The structural tension or hidden dependency that determines whether this scenario sustains or snaps into the next. Reference the coupling structure or arriving arrows where relevant.",
  "signals": ["3-5 concrete observable signals that would tell us the world is moving toward this seed. Each signal should be specific and falsifiable, not vague trend statements."],
  "implications": "1 paragraph, 80-120 words. What this scenario favours and disfavours strategically. Specific to the factor configuration. Avoid generic strategic advice."
}

Return ONLY the JSON. No backticks, no explanation, no markdown.`;
  };

  const generateScenario = (idx) => {
    try {
      const prompt = buildPrompt(idx);
      if (!prompt) return;

      const slug = (seedNames[idx] || `seed-${idx + 1}`)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')
        .slice(0, 60) || `seed-${idx + 1}`;

      const blob = new Blob([prompt], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tuna-prompt-${slug}.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setGenerationErrors({ ...generationErrors, [idx]: null });
    } catch (err) {
      setGenerationErrors({ ...generationErrors, [idx]: err.message || 'Could not build prompt' });
    }
  };

  if (!seedSpace.seeds) {
    return (
      <div className="space-y-6">
        <div>
          <div className="text-xs font-mono text-amber-400 mb-2">STEP 10</div>
          <h2 className="font-display text-4xl text-slate-50 mb-3">Seed selection</h2>
        </div>
        <div className="bg-rose-500/10 border border-rose-500/30 rounded p-5">
          <div className="flex items-start gap-3">
            <AlertCircle size={16} className="text-rose-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-rose-200">
              <div className="font-medium mb-1">Seed space too large</div>
              <div className="text-rose-300/80">
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
        <div className="text-xs font-mono text-amber-400 mb-2">STEP 10</div>
        <h2 className="font-display text-4xl text-slate-50 mb-3">Bifurcation pathway seeds</h2>
        <p className="text-slate-400 max-w-2xl">
          From the morphological space, K seeds where high-criticality factors converge into structural transitions. Each seed comes with an arrival window and the arrows that are arriving.
        </p>
        <ContextSummary purpose={purpose} audiencePreset={audiencePreset} audienceCustom={audienceCustom} documents={documents} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatBox label="Seed space" value={seedSpace.total.toLocaleString()} />
        <StatBox label="Above coherence" value={filteredSeeds.length.toLocaleString()} />
        <StatBox label="Filter rate" value={`${((filteredSeeds.length / seedSpace.total) * 100).toFixed(0)}%`} />
        <StatBox label="Selected" value={selectedSeeds.length} highlight />
      </div>

      <div className="bg-slate-900 rounded border border-slate-800 p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ControlSlider label="Number of seeds (K)" min={2} max={8} step={1} value={K} onChange={setK} format={v => v} />
        <ControlSlider label="Diversity weight (α)" min={0} max={1} step={0.05} value={alpha} onChange={setAlpha}
          format={v => `${v.toFixed(2)} · ${v < 0.33 ? 'diverse' : v > 0.66 ? 'high-score' : 'balanced'}`} />
        <ControlSlider label="Convergence focus" min={0} max={1} step={0.05} value={convergenceFocus} onChange={setConvergenceFocus}
          format={v => `${v.toFixed(2)} · ${v < 0.33 ? 'static' : v > 0.66 ? 'bifurcation' : 'mixed'}`} />
        <ControlSlider label="Min coherence" min={0} max={1} step={0.05} value={coherenceThreshold} onChange={setCoherenceThreshold} format={v => v.toFixed(2)} />
      </div>

      {/* Arrival timeline */}
      <div className="bg-slate-900 rounded border border-slate-800 p-6">
        <div className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Clock size={12} /> Arrival timeline · estimated years to materialise
        </div>
        <ArrivalTimeline seeds={selectedSeeds} seedNames={seedNames} />
      </div>

      {/* Parallel coordinates */}
      <div className="bg-slate-900 rounded border border-slate-800 p-6">
        <div className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-4">Seed profiles</div>
        <ParallelCoords factors={topFactors.map(f => f.factor)} states={factorStates} seeds={selectedSeeds}
          factorWeights={topFactorWeights} criticalities={topCriticalities} />
      </div>

      {/* Per-seed details */}
      <div className="space-y-3">
        {selectedSeeds.map((s, idx) => {
          const color = SEED_COLORS[idx % SEED_COLORS.length];
          const phase = seedPhases[idx] || 'pre';
          return (
            <div key={idx} className="bg-slate-900 rounded border border-slate-800 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-4 flex-wrap"
                style={{ borderLeftWidth: 4, borderLeftColor: color, borderLeftStyle: 'solid' }}>
                <div className="text-xs font-mono text-slate-500">#{idx + 1}</div>
                <input
                  value={seedNames[idx] || ''}
                  onChange={(e) => setSeedNames({ ...seedNames, [idx]: e.target.value })}
                  placeholder="Name this seed…"
                  className="flex-1 bg-transparent text-slate-100 font-display text-xl placeholder-slate-700 focus:outline-none focus:text-amber-300 transition min-w-[200px]"
                />
                <div className="flex items-center gap-1 bg-slate-950 rounded p-0.5 border border-slate-800">
                  {['pre', 'mid', 'post', 'steady'].map(p => (
                    <button
                      key={p}
                      onClick={() => setSeedPhases({ ...seedPhases, [idx]: p })}
                      className={`px-2 py-1 text-[10px] font-mono uppercase tracking-wider rounded transition
                        ${phase === p ? 'bg-amber-500 text-slate-950' : 'text-slate-500 hover:text-slate-200'}`}
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
              <div className="px-6 py-3 bg-slate-900/50 border-b border-slate-800 flex items-center gap-4 flex-wrap">
                <div className="text-xs font-mono text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock size={11} />
                  Arrival: {s.arrival.median.toFixed(1)}y
                </div>
                <div className="text-xs font-mono text-slate-600">
                  window {s.arrival.min.toFixed(1)}–{s.arrival.max.toFixed(1)}y
                </div>
                {s.arrival.arriving.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono text-slate-600 uppercase tracking-wider">Arrows arriving:</span>
                    {s.arrival.arriving.slice(0, 4).map((a, i) => (
                      <span key={i} className="text-xs font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/30">
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
                        {crit > 0.5 && <Zap size={9} className="text-rose-400" />}
                      </div>
                      <div className="text-sm font-medium mt-0.5">{label}</div>
                    </div>
                  );
                })}
              </div>

              {/* AI Prompt Download */}
              <AIScenarioPanel
                seedIdx={idx}
                generationErrors={generationErrors}
                onGenerate={() => generateScenario(idx)}
              />
            </div>
          );
        })}
      </div>

      <div className="bg-slate-900/50 rounded border border-slate-800 p-5">
        <div className="flex items-start gap-3">
          <Sparkles size={16} className="text-amber-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-slate-400">
            <span className="text-slate-200 font-medium">Bifurcation phase tags</span> let you distinguish pre-bifurcation seeds (system tense, factors approaching threshold) from post-bifurcation seeds (system has snapped, new emergent properties). Steady-state seeds are non-transitional configurations. The narrative for each phase asks different questions.
          </div>
        </div>
      </div>
    </div>
  );
}

function AIScenarioPanel({ seedIdx, generationErrors, onGenerate }) {
  const error = generationErrors[seedIdx];

  return (
    <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between gap-4 flex-wrap">
      <div className="text-xs text-slate-500">
        {error ? (
          <span className="text-rose-400">Could not build prompt: {error}</span>
        ) : (
          <span>Download the prompt as a text file, then paste it into your preferred LLM.</span>
        )}
      </div>
      <button
        onClick={onGenerate}
        className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40"
      >
        <FileText size={14} />
        Download AI prompt
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
      <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono bg-slate-900 border border-slate-800 text-slate-500">
        <Info size={11} /> No strategic context set — scenarios will be generic. Add purpose & audience in Step 9 for aimed narratives.
      </div>
    );
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono bg-amber-500/10 border border-amber-500/30 text-amber-300">
        <Check size={11} /> Context active
      </span>
      {hasPurpose && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono bg-slate-900 border border-slate-800 text-slate-400">
          purpose · {purpose.length} chars
        </span>
      )}
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono bg-slate-900 border border-slate-800 text-slate-400">
        audience · {audienceLabel}
      </span>
      {includedDocs.length > 0 && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono bg-slate-900 border border-slate-800 text-slate-400">
          <FileText size={11} /> {includedDocs.length} doc{includedDocs.length !== 1 ? 's' : ''}
        </span>
      )}
    </div>
  );
}

function StatBox({ label, value, highlight }) {
  return (
    <div className={`p-4 rounded border ${highlight ? 'bg-amber-500/10 border-amber-500/30' : 'bg-slate-900 border-slate-800'}`}>
      <div className="text-xs font-mono text-slate-500 uppercase tracking-wider">{label}</div>
      <div className={`font-mono text-2xl mt-1 ${highlight ? 'text-amber-400' : 'text-slate-100'}`}>{value}</div>
    </div>
  );
}

function ControlSlider({ label, min, max, step, value, onChange, format }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <div className="text-xs font-mono text-slate-500 uppercase tracking-wider">{label}</div>
        <div className="text-sm font-mono text-amber-400">{format(value)}</div>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))} className="w-full accent-amber-500" />
    </div>
  );
}

function Metric({ label, value, highlight }) {
  return (
    <div className="text-center">
      <div className="text-[9px] uppercase tracking-wider text-slate-600">{label}</div>
      <div className={highlight ? 'text-amber-400 font-semibold' : 'text-slate-300'}>
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
            <text x={x} y={height - padding.bottom + 16} fill="#64748b" fontSize="10" textAnchor="middle" fontFamily="JetBrains Mono">
              {y === 0 ? 'now' : `+${y}y`}
            </text>
          </g>
        );
      })}

      {/* "Today" marker */}
      <text x={padding.left - 8} y={height - padding.bottom + 4} fill="#94a3b8" fontSize="10" textAnchor="end" fontFamily="JetBrains Mono">
        2026
      </text>
      <text x={padding.left + innerWidth + 8} y={height - padding.bottom + 4} fill="#94a3b8" fontSize="10" textAnchor="start" fontFamily="JetBrains Mono">
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
            <text x={padding.left - 8} y={yPos + 4} fill="#cbd5e1" fontSize="11" textAnchor="end" fontFamily="JetBrains Mono">
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
                <circle cx={xScale(i)} cy={yScale(s.value)} r={2.5} fill="#475569" />
                {i === 0 && (
                  <text x={xScale(i) - 10} y={yScale(s.value) + 4} fill="#64748b" fontSize="10" textAnchor="end" fontFamily="JetBrains Mono">
                    {s.label}
                  </text>
                )}
              </g>
            ))}
            <text x={xScale(i)} y={padding.top + innerHeight + 22} fill="#cbd5e1" fontSize="11" textAnchor="middle" fontFamily="IBM Plex Sans" fontWeight="500">
              {f.name.length > 14 ? f.name.slice(0, 13) + '…' : f.name}
            </text>
            <text x={xScale(i)} y={padding.top + innerHeight + 38} fill="#64748b" fontSize="9" textAnchor="middle" fontFamily="JetBrains Mono">
              w {(factorWeights[i] * 100).toFixed(0)}%
            </text>
            <text x={xScale(i)} y={padding.top + innerHeight + 52} fill={crit > 0.5 ? '#fb7185' : crit > 0.3 ? '#fbbf24' : '#475569'}
              fontSize="9" textAnchor="middle" fontFamily="JetBrains Mono">
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
            <text x={14} y={-3} fill="#94a3b8" fontSize="10" fontFamily="JetBrains Mono">#{idx + 1}</text>
          </g>
        ))}
      </g>
    </svg>
  );
}
