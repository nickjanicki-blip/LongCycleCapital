import { yahoo, coinmetricsBTC } from './sources';
import { closedWeeks, last, mean, monthsBetween, round, sma, stdev } from './math';

const HALVING = '2024-04-19';
const NEXT_HALVING_EST = '2028-04-15';

// Dashboard prototype's time-based phase (handoff README): 0-18 bull, 18-30 bear, 30-48 accumulation.
function timePhase(m) {
  if (m < 18) return { phase: 3, name: 'Post-Halving Bull', action: 'DISTRIBUTE' };
  if (m < 30) return { phase: 4, name: 'Distribution / Bear', action: 'OUT' };
  if (m < 42) return { phase: 1, name: 'Accumulation', action: 'ACCUMULATE' };
  return { phase: 2, name: 'Pre-Halving Run', action: 'HOLD' };
}

export async function computeBTC({ regime, history = [] }) {
  const [daily, weekly, cm] = await Promise.all([
    yahoo('BTC-USD', '1d', '3y'),
    yahoo('BTC-USD', '1wk', '10y'),
    coinmetricsBTC(['CapMrktCurUSD', 'CapMVRVCur', 'IssTotUSD']),
  ]);
  const closes = daily.map(b => b.c);
  const price = last(closes);
  const wkCloses = closedWeeks(weekly).map(b => b.c);
  const ma200w = sma(wkCloses, 200);

  // MVRV-Z = (market cap - realized cap) / stdev(market cap, full history); realized cap = MC / MVRV.
  const mcRows = cm.filter(r => r.CapMrktCurUSD && r.CapMVRVCur);
  const mcAll = mcRows.map(r => r.CapMrktCurUSD);
  const lastCM = last(mcRows);
  const mvrvZ = (lastCM.CapMrktCurUSD - lastCM.CapMrktCurUSD / lastCM.CapMVRVCur) / stdev(mcAll);
  const iss = cm.filter(r => r.IssTotUSD).map(r => r.IssTotUSD);
  const puell = last(iss) / mean(iss.slice(-365));

  const months = monthsBetween(HALVING);
  const sinceHalving = daily.filter(b => b.t >= new Date(HALVING).getTime());
  const halvingPrice = sinceHalving[0]?.c ?? null;
  const peakBar = sinceHalving.reduce((m, b) => (b.c > m.c ? b : m), sinceHalving[0]);
  const drawdown = 1 - price / peakBar.c;

  const dma111 = sma(closes, 111), dma350 = sma(closes, 350);
  const piCycle = dma111 != null && dma350 != null && dma111 >= 2 * dma350;
  const piGap = dma111 && dma350 ? dma111 / (2 * dma350) : null;

  const accum = [
    { name: 'MVRV-Z below 0', met: mvrvZ < 0, value: round(mvrvZ, 2) },
    { name: 'Price within 10% of 200-week MA', met: ma200w ? price <= ma200w * 1.10 : false, value: ma200w ? `${round((price / ma200w - 1) * 100, 1)}% vs 200WMA $${Math.round(ma200w).toLocaleString()}` : 'n/a' },
    { name: 'Price down 60%+ from cycle peak', met: drawdown >= 0.60, value: `${round(drawdown * 100, 1)}% off $${Math.round(peakBar.c).toLocaleString()} peak` },
    { name: 'Puell Multiple below 0.5', met: puell < 0.5, value: round(puell, 2) },
    { name: 'Months since halving above 24', met: months > 24, value: round(months, 1) },
  ];
  const accumCount = accum.filter(a => a.met).length;

  // Drawdown brake (Framework Amendments E, Oct 2026): sell half the position once per cycle
  // when price closes 50%+ below the cycle peak. Accumulation tranches resume afterwards.
  const brakeLevel = peakBar.c * 0.5;
  const brakeHit = price <= brakeLevel;
  const brakeFired = history.some(h => h?.statuses?.['Bitcoin brake'] === 'FIRED' && h.runAt >= HALVING);
  const brake = { level: Math.round(brakeLevel), hit: brakeHit, firedThisCycle: brakeFired, pctToBrake: round((price / brakeLevel - 1) * 100, 1) };

  const distribution = [
    { name: 'MVRV-Z above 4 (exit 1)', met: mvrvZ > 4 },
    // Only in the post-halving bull window; otherwise any later bear market sits far above an old halving price.
    { name: 'Price doubled from halving price, months 12-18 (exit 1)', met: halvingPrice && months > 12 && months <= 18 ? price >= 2 * halvingPrice : false },
    { name: 'Pi Cycle Top: 111DMA above 2x350DMA (exit 2)', met: piCycle },
    { name: 'Puell above 4 (top zone)', met: puell > 4 },
    { name: `Drawdown brake: 50% below cycle peak ($${Math.round(brakeLevel).toLocaleString()}), sell half once`, met: brakeHit },
  ];
  const distCount = distribution.filter(d => d.met).length;

  const tp = timePhase(months);
  const allowNew = regime?.adjustments?.btc?.allowNew !== false;

  let status = 'OUT', action;
  if (brakeHit && !brakeFired) {
    status = 'DISTRIBUTE';
    action = `Drawdown brake: price is 50%+ below the $${Math.round(peakBar.c).toLocaleString()} cycle peak. Sell half the position (once this cycle).${accumCount >= 3 ? ' Accumulation signals are also on: apply the brake first, then resume tranches.' : ''}`;
  } else if (accumCount >= 3) {
    status = allowNew ? 'ACCUMULATE' : 'HOLD';
    action = allowNew
      ? 'Playbook accumulation confirmed (3 of 5). Tranche 1 (20% of the 10% sleeve) is authorized.'
      : `Accumulation confirmed (3 of 5), but the ${regime.regime} regime overlay says no new entries. Your call which rule wins.`;
  } else if (distCount >= 1) {
    status = 'DISTRIBUTE';
    action = 'A distribution signal is active. Scale out per the 25/25/25/25 exit plan if holding.';
  } else if (accumCount === 2) {
    status = 'WATCH';
    action = 'Two of five accumulation indicators met. One more confirms Tranche 1.';
  } else {
    action = `${accumCount} of 5 accumulation indicators met. No entry. Resist buying dips until 3 of 5 agree.`;
  }

  const tranches = [
    { n: 1, trigger: 'First 3-of-5 accumulation signal', hit: accumCount >= 3 },
    { n: 2, trigger: 'Additional 15% drop after tranche 1', hit: null },
    { n: 3, trigger: 'Price near 200-week MA', hit: ma200w ? price <= ma200w * 1.10 : false },
    { n: 4, trigger: 'MVRV-Z below -0.5', hit: mvrvZ < -0.5 },
    { n: 5, trigger: 'Capitulation day (>10% single-day drop)', hit: closes.length > 1 && price / closes[closes.length - 2] - 1 <= -0.10 },
  ];

  return {
    status, action, price: Math.round(price), ma200w: ma200w ? Math.round(ma200w) : null,
    mvrvZ: round(mvrvZ, 2), mvrv: round(lastCM.CapMVRVCur, 2), puell: round(puell, 2),
    cmDate: lastCM.date, months: round(months, 1), halvingPrice: halvingPrice ? Math.round(halvingPrice) : null,
    peak: Math.round(peakBar.c), peakDate: new Date(peakBar.t).toISOString().slice(0, 10),
    drawdownPct: round(drawdown * 100, 1), piCycle, piGap: round(piGap, 2),
    accum, accumCount, distribution, distCount, tranches, brake,
    timePhase: tp, nextHalving: NEXT_HALVING_EST,
    phaseNote: tp.phase === 1 && months < 31
      ? 'Time-based phase just turned to Accumulation (month 30). Playbook still requires 3 of 5 indicators before buying.'
      : null,
    regimeNote: regime?.adjustments?.btc?.note,
  };
}
