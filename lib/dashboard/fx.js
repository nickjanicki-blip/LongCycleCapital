import { yahoo, bisPolicyRates, cftcNet } from './sources';
import { atr, closedWeeks, last, round, rsiSeries, zscore } from './math';

export const FX_PAIRS = [
  { pair: 'EUR/USD', yahoo: 'EURUSD=X', base: 'XM', quote: 'US', cftc: '099741', usdBase: false },
  { pair: 'USD/JPY', yahoo: 'JPY=X',    base: 'US', quote: 'JP', cftc: '097741', usdBase: true },
  { pair: 'GBP/USD', yahoo: 'GBPUSD=X', base: 'GB', quote: 'US', cftc: '096742', usdBase: false },
  { pair: 'USD/CHF', yahoo: 'CHF=X',    base: 'US', quote: 'CH', cftc: '092741', usdBase: true },
  { pair: 'AUD/USD', yahoo: 'AUDUSD=X', base: 'AU', quote: 'US', cftc: '232741', usdBase: false },
  { pair: 'USD/CAD', yahoo: 'CAD=X',    base: 'US', quote: 'CA', cftc: '090741', usdBase: true },
  { pair: 'NZD/USD', yahoo: 'NZDUSD=X', base: 'NZ', quote: 'US', cftc: '112741', usdBase: false },
];
const BANK = { US: 'Fed', XM: 'ECB', GB: 'BoE', JP: 'BoJ', CH: 'SNB', AU: 'RBA', CA: 'BoC', NZ: 'RBNZ' };

const traj = (series, i, n = 6) => {
  if (i - n < 0) return null;
  const d = series[i].v - series[i - n].v;
  return d > 0.1 ? 'hiking' : d < -0.1 ? 'cutting' : 'holding';
};
const opposite = (a, b) => (a === 'hiking' && b === 'cutting') || (a === 'cutting' && b === 'hiking');

function layer1(baseS, quoteS) {
  const byPeriod = new Map(quoteS.map(x => [x.period, x.v]));
  const joined = baseS.filter(x => byPeriod.has(x.period)).map(x => ({ period: x.period, b: x.v, q: byPeriod.get(x.period) }));
  const bS = joined.map(x => ({ v: x.b })), qS = joined.map(x => ({ v: x.q }));
  const n = joined.length - 1;
  const tb = traj(bS, n), tq = traj(qS, n);
  let months = 0;
  for (let i = n; i >= 6 && opposite(traj(bS, i), traj(qS, i)); i--) months++;
  const diffs = joined.map(x => x.b - x.q).slice(-24);
  const diff = last(diffs);
  const hi = Math.max(...diffs), lo = Math.min(...diffs);
  const atExtreme = hi - lo > 0.1 && (diff >= hi - 0.05 || diff <= lo + 0.05);
  // Long the currency whose bank is relatively tighter on trajectory.
  let direction = null;
  if (opposite(tb, tq)) direction = tb === 'hiking' ? 'long' : 'short';
  return { baseRate: joined[n].b, quoteRate: joined[n].q, asOf: joined[n].period, tb, tq, months, diff, atExtreme, direction };
}

function layer2(cot, usdBase) {
  const nets = cot.map(r => (usdBase ? -r.net : r.net));
  const zs = nets.map((x, i) => (i >= 52 ? zscore(x, nets.slice(Math.max(0, i - 155), i + 1)) : null));
  const z = last(zs);
  let weeks = 0;
  for (let i = zs.length - 1; i >= 0 && zs[i] != null && Math.abs(zs[i]) >= 2 && Math.sign(zs[i]) === Math.sign(z); i--) weeks++;
  return { z, weeks, asOf: last(cot).date, crowded: z >= 2 ? 'long' : z <= -2 ? 'short' : null };
}

function layer3(bars) {
  const triggers = [];
  if (bars.length < 160) return triggers;
  const cur = last(bars), prev = bars[bars.length - 2];
  const prior17 = bars.slice(-18, -1);
  const hi17 = Math.max(...prior17.map(b => b.h)), lo17 = Math.min(...prior17.map(b => b.l));
  if (cur.c > hi17) triggers.push({ dir: 'long', name: `Weekly close above 4-month high ${round(hi17, 4)}` });
  if (cur.c < lo17) triggers.push({ dir: 'short', name: `Weekly close below 4-month low ${round(lo17, 4)}` });

  const w156 = bars.slice(-156);
  const hi3y = Math.max(...w156.map(b => b.h)), lo3y = Math.min(...w156.map(b => b.l));
  const bodyEngulf = Math.max(cur.o, cur.c) >= Math.max(prev.o, prev.c) && Math.min(cur.o, cur.c) <= Math.min(prev.o, prev.c);
  if (bodyEngulf && cur.c < cur.o && prev.c > prev.o && cur.h >= hi3y * 0.97) triggers.push({ dir: 'short', name: 'Bearish weekly engulfing near 3-year high' });
  if (bodyEngulf && cur.c > cur.o && prev.c < prev.o && cur.l <= lo3y * 1.03) triggers.push({ dir: 'long', name: 'Bullish weekly engulfing near 3-year low' });

  const closes = bars.map(b => b.c);
  const rsi = rsiSeries(closes);
  const i = closes.length - 1;
  const win = closes.slice(i - 26, i);
  const rwin = rsi.slice(i - 26, i);
  const hiIdx = win.indexOf(Math.max(...win)), loIdx = win.indexOf(Math.min(...win));
  if (closes[i] >= win[hiIdx] && rsi[i] < rwin[hiIdx] - 2) triggers.push({ dir: 'short', name: `Bearish weekly RSI divergence (RSI ${round(rsi[i], 0)} vs ${round(rwin[hiIdx], 0)})` });
  if (closes[i] <= win[loIdx] && rsi[i] > rwin[loIdx] + 2) triggers.push({ dir: 'long', name: `Bullish weekly RSI divergence (RSI ${round(rsi[i], 0)} vs ${round(rwin[loIdx], 0)})` });
  return triggers;
}

export async function computeFX({ inputs = {}, regime, journal = [], vix }) {
  const start = `${new Date().getFullYear() - 4}-01`;
  const rates = await bisPolicyRates(Object.keys(BANK), start);
  const equity = Number(inputs.equity) || 500000;
  const guidance = inputs.fxGuidance || {};
  const sixWeeksAgo = Date.now() - 42 * 864e5;
  const riskPct = regime?.adjustments?.fx?.risk ?? 5;

  const results = await Promise.all(FX_PAIRS.map(async cfg => {
    try {
      const [wk, cot] = await Promise.all([yahoo(cfg.yahoo, '1wk', '5y'), cftcNet(cfg.cftc, 170)]);
      const bars = closedWeeks(wk);
      const l1 = layer1(rates[cfg.base] || [], rates[cfg.quote] || []);
      const l2 = layer2(cot, cfg.usdBase);
      const trig = layer3(bars);
      const l3Triggers = l1.direction ? trig.filter(t => t.dir === l1.direction) : trig;

      const recentTrade = journal.some(t => t.pair === cfg.pair && new Date(t.date).getTime() >= sixWeeksAgo);
      const l1Auto = l1.months >= 6 && l1.atExtreme;
      const l1Met = l1Auto && Boolean(guidance[cfg.pair]);
      const l2Met = l2.z != null && Math.abs(l2.z) >= 2 && l2.weeks >= 2 && !recentTrade;
      const l3Met = l3Triggers.length > 0;

      let status = 'NO SETUP';
      if (l1Met && l2Met && l3Met) status = 'READY';
      else if (l1Auto && l2Met && l3Met) status = 'APPROACHING';
      else if (l1Auto || l2Met) status = 'WATCH';
      let pauseReason = null;
      if (regime?.regime === 'Crisis') pauseReason = 'Crisis regime: FX paused';
      else if (vix != null && vix > 40) pauseReason = `VIX ${round(vix, 1)} above 40: do not trade`;
      if (pauseReason) status = 'PAUSED';

      const close = last(bars).c;
      const a = atr(bars, 14);
      let plan = null;
      if ((status === 'APPROACHING' || status === 'READY') && l1.direction && a) {
        const stopDist = 1.5 * a;
        const sign = l1.direction === 'long' ? 1 : -1;
        plan = {
          direction: l1.direction, entryRef: round(close, 4), stop: round(close - sign * stopDist, 4),
          target2R: round(close + sign * 2 * stopDist, 4), target4R: round(close + sign * 4 * stopDist, 4),
          riskPct, riskDollars: Math.round(equity * riskPct / 100),
          units: Math.round((equity * riskPct / 100) / stopDist),
          notes: '50% off at 2R and stop to breakeven, 25% at 4R and stop to +2R, trail last 25% at 1.5x weekly ATR. Time stop 60 days if not at +1R.',
        };
      }

      const missing = [];
      if (l1.months < 6) missing.push(`policy divergence ${l1.months}/6 months (${BANK[cfg.base]} ${l1.tb}, ${BANK[cfg.quote]} ${l1.tq})`);
      if (!l1.atExtreme) missing.push('rate differential not at a 24-month extreme');
      if (l1Auto && !guidance[cfg.pair]) missing.push('forward guidance not confirmed (yours)');
      if (!(l2.z != null && Math.abs(l2.z) >= 2)) missing.push(`CFTC Z ${round(l2.z, 2)} (needs ±2.0)`);
      else if (l2.weeks < 2) missing.push(`CFTC extreme ${l2.weeks}/2 weeks`);
      if (recentTrade) missing.push('traded this pair in the last 6 weeks');
      if (!l3Met) missing.push(l1.direction ? `no weekly ${l1.direction} trigger yet` : 'no weekly trigger');

      return {
        pair: cfg.pair, status, pauseReason, close: round(close, 4), atr: round(a, 4),
        l1: { met: l1Met, auto: l1Auto, ...l1, baseBank: BANK[cfg.base], quoteBank: BANK[cfg.quote], diff: round(l1.diff, 2), guidanceConfirmed: Boolean(guidance[cfg.pair]) },
        l2: { met: l2Met, z: round(l2.z, 2), weeks: l2.weeks, asOf: l2.asOf, crowded: l2.crowded },
        l3: { met: l3Met, triggers: trig },
        plan, missing,
      };
    } catch (e) {
      return { pair: cfg.pair, status: 'ERROR', error: e.message };
    }
  }));
  return { pairs: results, riskPct, fatPct: regime?.adjustments?.fx?.fat ?? 10, regimeNote: regime?.adjustments?.fx?.note, equity };
}
