export const REGIMES = ['Recovery', 'Expansion', 'Late Cycle', 'Contraction', 'Crisis'];

// Playbooks define Expansion / Late Cycle / Recession / Crisis. Recovery has no
// playbook row and runs at Expansion settings; Contraction uses the Recession row.
export const ADJUSTMENTS = {
  Recovery: {
    fx: { risk: 5, fat: 10, note: 'Normal operations (no Recovery row in playbook; Expansion settings).' },
    gsr: { bias: null, note: 'Normal zone-based trading.' },
    btc: { allowNew: true, note: 'Normal cycle-based positioning.' },
  },
  Expansion: {
    fx: { risk: 5, fat: 10, note: 'All pairs. Normal operations.' },
    gsr: { bias: null, note: 'Normal zone-based trading.' },
    btc: { allowNew: true, note: 'Normal cycle-based positioning.' },
  },
  'Late Cycle': {
    fx: { risk: 3, fat: 6, note: 'Reduce size 40%. Major pairs only.' },
    gsr: { bias: 'silver', note: 'Lean long silver. GSR tends to compress in late cycle.' },
    btc: { allowNew: false, note: 'Hold existing position. No new entries.' },
  },
  Contraction: {
    fx: { risk: 2, fat: 4, note: 'Major pairs only. Fade extremes only. No trend-following.' },
    gsr: { bias: 'gold', note: 'Lean long gold. GSR expands as gold safe-haven dominates.' },
    btc: { allowNew: false, note: 'No new entries. Hold or reduce based on halving phase.' },
  },
  Crisis: {
    fx: { risk: 0, fat: 0, note: 'PAUSE. No new FX trades.' },
    gsr: { bias: 'silver', note: 'Fat pitch zone. GSR can spike to 100+; long silver / short gold from extreme high.' },
    btc: { allowNew: true, note: 'Opportunistic only if in accumulation phase. Otherwise hold.' },
  },
};

export function resolveRegime(compass, override) {
  const auto = compass?.phase && REGIMES.includes(compass.phase) ? compass.phase : null;
  const regime = override && REGIMES.includes(override) ? override : auto || 'Late Cycle';
  return {
    regime,
    auto,
    overridden: Boolean(override && override !== auto),
    confidence: compass?.confidence ?? null,
    transitional: compass?.transitional ?? null,
    laborGated: compass?.laborGated ?? null,
    rawPhase: compass?.rawPhase ?? null,
    norm: compass?.norm ?? null,
    compassUpdatedAt: compass?.updatedAt ?? null,
    adjustments: ADJUSTMENTS[regime],
  };
}
