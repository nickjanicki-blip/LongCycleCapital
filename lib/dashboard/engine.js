import { resolveRegime } from './regime';
import { computeGSR } from './gsr';
import { computeBTC } from './btc';
import { computeFX } from './fx';
import { computeRecession } from './recession';
import { yahoo } from './sources';
import { last } from './math';

const RANK = { READY: 5, APPROACHING: 4, ARMED: 4, ACCUMULATE: 4, DISTRIBUTE: 4, WATCH: 3, HOLD: 2, ACTIVE: 2, PAUSED: 1 };

const settle = async (name, fn) => {
  try { return { ok: true, value: await fn() }; } catch (e) { return { ok: false, error: `${name}: ${e.message}` }; }
};

// Flat map of every status the brief tracks, used to diff day over day.
export function statusMap(s) {
  const m = { regime: s.regime?.regime };
  if (s.gsr) m['GSR'] = s.gsr.status;
  if (s.btc) m['Bitcoin'] = s.btc.status;
  s.fx?.pairs?.forEach(p => { m[`FX ${p.pair}`] = p.status; });
  s.recession?.crisisTrades?.forEach(t => { m[`Crisis: ${t.name}`] = t.status; });
  if (s.recession) m['Recession tiers'] = `${s.recession.tierCounts.t1}/${s.recession.tierCounts.t2}/${s.recession.tierCounts.t3}`;
  return m;
}

function buildBrief(s, prev) {
  const watch = [];
  const add = (name, status, line, plan) => { if ((RANK[status] || 0) >= 3) watch.push({ name, status, line, plan }); };

  if (s.gsr) add('Gold-Silver Ratio', s.gsr.status, `${s.gsr.ratio} ${s.gsr.zone}. ${s.gsr.watchNote}`, s.gsr.plan);
  if (s.btc) add('Bitcoin', s.btc.status, s.btc.action);
  s.fx?.pairs?.forEach(p => {
    if (p.status === 'ERROR') return;
    add(`FX ${p.pair}`, p.status, p.missing.length ? `Missing: ${p.missing.join('; ')}.` : 'All three layers met.', p.plan);
  });
  s.recession?.crisisTrades?.forEach(t => add(`Crisis trade: ${t.name}`, t.status, t.why));
  watch.sort((a, b) => (RANK[b.status] || 0) - (RANK[a.status] || 0));

  const positions = (s.recession?.crisisTrades || [])
    .filter(t => t.status === 'ACTIVE')
    .map(t => ({ name: t.name, line: t.why }));

  // Near-misses one step from the watch list.
  const developing = [];
  s.fx?.pairs?.forEach(p => {
    if (p.status !== 'NO SETUP') return;
    if (p.l2?.z != null && Math.abs(p.l2.z) >= 2) developing.push(`${p.pair}: CFTC positioning extreme (Z ${p.l2.z}, ${p.l2.weeks}/2 weeks${p.l2.crowded ? `, crowded ${p.l2.crowded}` : ''}).`);
    else if (p.l3?.triggers?.length) developing.push(`${p.pair}: weekly trigger printed (${p.l3.triggers.map(t => t.name).join('; ')}) but Layers 1-2 not met.`);
  });
  if (s.gsr && !s.gsr.side && (s.gsr.ratio >= 77 || s.gsr.ratio <= 63)) developing.push(`GSR ${s.gsr.ratio} is within reach of a trading zone.`);
  if (s.btc?.accumCount === 2) developing.push('Bitcoin: 2 of 5 accumulation indicators met.');
  if (s.btc?.phaseNote) developing.push(`Bitcoin: ${s.btc.phaseNote}`);

  const changes = [];
  if (prev) {
    const a = statusMap(prev), b = statusMap(s);
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
      if (a[k] !== b[k]) changes.push({ name: k, from: a[k] ?? 'n/a', to: b[k] ?? 'n/a' });
    }
  }

  const r = s.regime;
  const headline = `${r.regime}${r.overridden ? ' (manual override)' : ''}` +
    (r.confidence != null ? `, confidence ${r.confidence}${r.transitional ? ', transitional' : ''}` : '');

  const ready = watch.filter(w => w.status === 'READY');
  const recommendation = ready.length
    ? `${ready.length} setup(s) READY: ${ready.map(w => w.name).join(', ')}. Complete the pre-trade checklist before entering.`
    : watch.length
      ? `No trade today. ${watch.length} item(s) on watch; nothing has cleared every layer.`
      : 'No trade today. Nothing is close. Standing aside is the correct action.';

  const todo = [];
  if (s.ismAsOf) {
    const now = new Date();
    const expected = new Date(now.getFullYear(), now.getMonth() - 1, 1).toLocaleString('en-US', { month: 'short', year: 'numeric' });
    if (!s.ismAsOf.includes(expected) && now.getDate() >= 2) todo.push(`ISM still shows ${s.ismAsOf}; the ${expected} print should be out. Update it in the Compass route.`);
  }
  s.fx?.pairs?.forEach(p => {
    if (p.l1?.auto && !p.l1.guidanceConfirmed) todo.push(`${p.pair}: Layer 1 divergence is met. Confirm forward guidance if you agree.`);
  });
  if (s.gsr?.layers?.l3?.met && !s.gsr.layers.l4.met) todo.push('GSR: Layers 1-3 met. Write the Layer 4 macro story if one exists.');

  const equity = Number(s.fx?.equity) || 500000;
  const reserve = { floorPct: 25, amount: Math.round(equity * 0.25), note: 'All idle capital in T-bills (direct or a T-bill ETF). Keep at least 25% untouched: never used for margin, Bitcoin tranches or new trades; it is the Crisis-deployment reserve.' };
  return { headline, recommendation, watch, developing, positions, changes, todo, reserve };
}

export async function runEngine({ compass, inputs = {}, journal = [], prev = null, history = [] }) {
  const regime = resolveRegime(compass, inputs.regimeOverride);
  const vixBars = await settle('VIX', () => yahoo('^VIX', '1d', '5d'));
  const vix = vixBars.ok ? last(vixBars.value).c : null;

  const [gsr, btc, fx, recession] = await Promise.all([
    settle('GSR', () => computeGSR({ inputs, regime })),
    settle('Bitcoin', () => computeBTC({ regime })),
    settle('FX', () => computeFX({ inputs, regime, journal, vix })),
    settle('Recession', () => computeRecession({ inputs, regime, compass, prev, history })),
  ]);

  const ism = compass?.tier1?.find(t => /ISM/.test(t.name));
  const snapshot = {
    runAt: new Date().toISOString(),
    regime,
    vix,
    ismAsOf: ism?.reading?.match(/\(([^)]+)\)/)?.[1] ?? null,
    compassTier1: compass?.tier1 ?? null,
    gsr: gsr.ok ? gsr.value : null,
    btc: btc.ok ? btc.value : null,
    fx: fx.ok ? fx.value : null,
    recession: recession.ok ? recession.value : null,
    errors: [gsr, btc, fx, recession].filter(x => !x.ok).map(x => x.error)
      .concat(fx.ok ? fx.value.pairs.filter(p => p.error).map(p => `FX ${p.pair}: ${p.error}`) : [])
      .concat(recession.ok ? recession.value.errors : []),
  };
  snapshot.brief = buildBrief(snapshot, prev);
  return snapshot;
}
