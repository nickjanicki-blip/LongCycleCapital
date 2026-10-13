import { yahoo } from './sources';
import { alignByDay, closedWeeks, last, mean, round, zscore } from './math';

function zoneOf(r) {
  if (r > 90) return { zone: 'EXTREME HIGH', side: 'high', action: 'Long silver / short gold' };
  if (r > 80) return { zone: 'HIGH', side: 'high', action: 'Long silver / short gold' };
  if (r < 45) return { zone: 'EXTREME LOW', side: 'low', action: 'Long gold / short silver' };
  if (r < 60) return { zone: 'LOW', side: 'low', action: 'Long gold / short silver' };
  return { zone: 'NEUTRAL', side: null, action: 'No trade' };
}

const inSide = (r, side) => (side === 'high' ? r > 80 : r < 60);

// Playbook: entry needs all 4 layers in the same week. Stops/exits per GSR_Trading_Playbook.
export async function computeGSR({ inputs = {}, regime }) {
  const [gW, sW, gD, sD] = await Promise.all([
    yahoo('GC=F', '1wk', '10y'), yahoo('SI=F', '1wk', '10y'),
    yahoo('GC=F', '1d', '5d'), yahoo('SI=F', '1d', '5d'),
  ]);
  const weekly = alignByDay(closedWeeks(gW), closedWeeks(sW)).map(([g, s]) => ({ t: g.t, r: g.c / s.c }));
  const series = weekly.map(w => w.r);
  const gold = last(gD).c, silver = last(sD).c;
  const ratio = gold / silver;

  const z5 = zscore(ratio, series.slice(-260));
  const z10 = zscore(ratio, series.slice(-520));
  const mean5 = mean(series.slice(-260));
  const { zone, side, action } = zoneOf(ratio);
  const extreme = ratio > 90 || ratio < 45;

  // Consecutive closed weeks on the current side of the neutral band.
  let weeksInZone = 0;
  if (side) for (let i = series.length - 1; i >= 0 && inSide(series[i], side); i--) weeksInZone++;
  const weeksRequired = extreme ? 2 : 4;

  // Reversion: 5%+ off the excursion's peak/trough AND two consecutive weekly closes moving back.
  let reversionPct = 0, twoCloses = false, excursionExtreme = null;
  if (side && weeksInZone > 0) {
    const excursion = series.slice(-weeksInZone).concat(ratio);
    excursionExtreme = side === 'high' ? Math.max(...excursion) : Math.min(...excursion);
    reversionPct = side === 'high' ? (excursionExtreme - ratio) / excursionExtreme : (ratio - excursionExtreme) / excursionExtreme;
    const [a, b, c] = series.slice(-3);
    twoCloses = side === 'high' ? (b < a && c < b) : (b > a && c > b);
  }

  const macroStory = (inputs.gsrMacroStory || '').trim();
  const layers = {
    l1: { met: Boolean(side) && Math.abs(z5) >= 1.5, detail: `Ratio ${round(ratio, 1)} (${zone}), 5y Z ${round(z5, 2)} (needs zone + |Z| ≥ 1.5)` },
    l2: { met: false, detail: `${weeksInZone} closed week(s) in zone, needs ${weeksRequired}` },
    l3: { met: false, detail: `${round(reversionPct * 100, 1)}% off the extreme (needs 5%), two reverting weekly closes: ${twoCloses ? 'yes' : 'no'}` },
    l4: { met: macroStory.length > 10, manual: true, detail: macroStory || 'Macro story not written (your call, required)' },
  };
  layers.l2.met = layers.l1.met && weeksInZone >= weeksRequired;
  layers.l3.met = layers.l2.met && reversionPct >= 0.05 && twoCloses;

  let status = 'NO TRADE';
  if (layers.l1.met && layers.l2.met && layers.l3.met && layers.l4.met) status = 'READY';
  else if (layers.l1.met && layers.l2.met && layers.l3.met) status = 'APPROACHING';
  else if (layers.l1.met) status = 'WATCH';

  const fatPitch = (ratio > 100 || ratio < 30) && Math.abs(z10) >= 2.5 && layers.l3.met;
  const riskPct = fatPitch ? 10 : 5;

  const stop = side === 'high' ? (extreme ? 130 : 100) : side === 'low' ? (extreme ? 20 : 35) : null;
  const plan = side ? {
    action, riskPct, stopRatio: stop,
    exits: [
      '50% when the ratio re-enters neutral (60-80)',
      '25% at the long-term mean (~65)',
      `Final 25% on overshoot to the opposite extreme, or time stop ${fatPitch ? '18' : '12'} months`,
    ],
  } : null;

  const toHigh = (80 - ratio) / ratio, toLow = (ratio - 60) / ratio;
  const watchNote = side
    ? `In ${zone} zone for ${weeksInZone} week(s).`
    : `Neutral. ${round(toHigh * 100, 1)}% rise to 80 (silver-cheap zone) or ${round(toLow * 100, 1)}% fall to 60 (gold-cheap zone).`;

  let biasNote = regime?.adjustments?.gsr?.note || '';
  if (regime?.adjustments?.gsr?.bias && side) {
    const tradeFavors = side === 'high' ? 'silver' : 'gold';
    biasNote += tradeFavors === regime.adjustments.gsr.bias ? ' Regime agrees with this side.' : ' Regime leans the other way: be stricter on Layer 4.';
  }

  return {
    status, ratio: round(ratio, 2), gold: round(gold, 2), silver: round(silver, 2),
    zone, side, z5: round(z5, 2), z10: round(z10, 2), mean5: round(mean5, 1),
    weeksInZone, weeksRequired, reversionPct: round(reversionPct * 100, 1), twoCloses,
    fatPitch, layers, plan, watchNote, biasNote,
    history: weekly.slice(-104).map(w => [w.t, round(w.r, 2)]),
  };
}
