import { yahoo, bisPolicyRates, cftcNet } from './sources';
import { atr, closedWeeks, last, round, rsiSeries, zscore } from './math';

export const FX_PAIRS = [
  { pair: 'EUR/USD', yahoo: 'EURUSD=X', base: 'XM', quote: 'US', cftc: '099741', usdBase: false, major: true },
  { pair: 'USD/JPY', yahoo: 'JPY=X',    base: 'US', quote: 'JP', cftc: '097741', usdBase: true,  major: true },
  { pair: 'GBP/USD', yahoo: 'GBPUSD=X', base: 'GB', quote: 'US', cftc: '096742', usdBase: false, major: true },
  { pair: 'USD/CHF', yahoo: 'CHF=X',    base: 'US', quote: 'CH', cftc: '092741', usdBase: true,  major: true },
  { pair: 'AUD/USD', yahoo: 'AUDUSD=X', base: 'AU', quote: 'US', cftc: '232741', usdBase: false, major: false },
  { pair: 'USD/CAD', yahoo: 'CAD=X',    base: 'US', quote: 'CA', cftc: '090741', usdBase: true,  major: false },
  { pair: 'NZD/USD', yahoo: 'NZDUSD=X', base: 'NZ', quote: 'US', cftc: '112741', usdBase: false, major: false },
];
export const BANK = { US: 'Fed', XM: 'ECB', GB: 'BoE', JP: 'BoJ', CH: 'SNB', AU: 'RBA', CA: 'BoC', NZ: 'RBNZ' };
export const BIS_AREAS = Object.keys(BANK);

const traj = (s, i, n = 6) => {
  if (i - n < 0) return null;
  const d = s[i] - s[i - n];
  return d > 0.1 ? 'hiking' : d < -0.1 ? 'cutting' : 'holding';
};

// Layer 1 per the playbook's worked example (May 2024: Fed holding 5.50% vs BoJ 0.10% = PASS):
// the policy-rate gap is at a 24-month extreme, meaningful (>= 0.5pt), and has not narrowed
// materially over the last 6 months. Forward-guidance confirmation is the trader's call.
// Monthly rates; pass only months already published.
export function layer1(baseS, quoteS) {
  const qm = new Map(quoteS.map(x => [x.period, x.v]));
  const j = baseS.filter(x => qm.has(x.period)).map(x => ({ period: x.period, b: x.v, q: qm.get(x.period) }));
  if (j.length < 25) return { met: false, insufficient: true };
  const gaps = j.map(x => Math.abs(x.b - x.q));
  const n = j.length - 1, gap = gaps[n];
  const max24 = Math.max(...gaps.slice(-24));
  const max120 = Math.max(...gaps.slice(-120));
  // "At extreme" is relative: within 10% of the 24-month widest gap (a 0.25pt BoJ move must not void a 5.4pt gap).
  const atExtreme = gap >= 0.5 && gap >= 0.9 * max24;
  const established = gaps.slice(-6).every(g => g >= 0.5) && gap >= 0.9 * gaps[n - 6];
  const bS = j.map(x => x.b), qS = j.map(x => x.q);
  return {
    met: atExtreme && established, atExtreme, established,
    gap, max24, decadeExtreme: gap >= 0.9 * max120,
    baseRate: j[n].b, quoteRate: j[n].q, asOf: j[n].period,
    tb: traj(bS, n), tq: traj(qS, n),
  };
}

// Layer 2: speculative positioning extreme, measured in the pair's direction.
// The trade FADES the crowd: crowded long the pair -> short, crowded short -> long.
export function layer2(cot, usdBase) {
  const nets = cot.map(r => (usdBase ? -r.net : r.net));
  const zs = nets.map((x, i) => (i >= 52 ? zscore(x, nets.slice(Math.max(0, i - 155), i + 1)) : null));
  const z = last(zs);
  let weeks = 0;
  for (let i = zs.length - 1; i >= 0 && zs[i] != null && Math.abs(zs[i]) >= 2 && Math.sign(zs[i]) === Math.sign(z); i--) weeks++;
  const crowded = z >= 2 ? 'long' : z <= -2 ? 'short' : null;
  return { z, weeks, crowded, fadeDir: crowded === 'long' ? 'short' : crowded === 'short' ? 'long' : null, asOf: last(cot).date };
}

// Layer 3 on closed weekly bars. Breakouts carry the broken level, reversals the swing extreme.
export function layer3(bars) {
  const out = [];
  if (bars.length < 160) return out;
  const i = bars.length - 1, cur = bars[i], prev = bars[i - 1];
  const prior = bars.slice(-18, -1);
  const hi17 = Math.max(...prior.map(b => b.h)), lo17 = Math.min(...prior.map(b => b.l));
  if (cur.c > hi17) out.push({ dir: 'long', type: 'breakout', level: hi17, name: `Weekly close above 4-month high ${round(hi17, 4)}` });
  if (cur.c < lo17) out.push({ dir: 'short', type: 'breakout', level: lo17, name: `Weekly close below 4-month low ${round(lo17, 4)}` });

  const w156 = bars.slice(-156);
  const hi3y = Math.max(...w156.map(b => b.h)), lo3y = Math.min(...w156.map(b => b.l));
  const swingHi = Math.max(...bars.slice(-8).map(b => b.h)), swingLo = Math.min(...bars.slice(-8).map(b => b.l));
  const engulf = Math.max(cur.o, cur.c) >= Math.max(prev.o, prev.c) && Math.min(cur.o, cur.c) <= Math.min(prev.o, prev.c);
  if (engulf && cur.c < cur.o && prev.c > prev.o && cur.h >= hi3y * 0.97) out.push({ dir: 'short', type: 'reversal', swing: swingHi, name: 'Bearish weekly engulfing near 3-year high' });
  if (engulf && cur.c > cur.o && prev.c < prev.o && cur.l <= lo3y * 1.03) out.push({ dir: 'long', type: 'reversal', swing: swingLo, name: 'Bullish weekly engulfing near 3-year low' });

  const closes = bars.map(b => b.c), rsi = rsiSeries(closes);
  const win = closes.slice(i - 26, i), rwin = rsi.slice(i - 26, i);
  const hiIdx = win.indexOf(Math.max(...win)), loIdx = win.indexOf(Math.min(...win));
  if (closes[i] >= win[hiIdx] && rsi[i] < rwin[hiIdx] - 2) out.push({ dir: 'short', type: 'reversal', swing: swingHi, name: `Bearish weekly RSI divergence (RSI ${round(rsi[i], 0)} vs ${round(rwin[hiIdx], 0)})` });
  if (closes[i] <= win[loIdx] && rsi[i] > rwin[loIdx] + 2) out.push({ dir: 'long', type: 'reversal', swing: swingLo, name: `Bullish weekly RSI divergence (RSI ${round(rsi[i], 0)} vs ${round(rwin[loIdx], 0)})` });
  return out;
}

// Playbook section 6: breakout stop 1.5x ATR beyond the broken level; reversal stop at the
// recent swing extreme plus 1 ATR; fat pitch widens the distance by 50%.
export function stopFor(trigger, bars, fat = false) {
  const a = atr(bars, 14), entry = last(bars).c, sign = trigger.dir === 'long' ? 1 : -1;
  let stop = trigger.type === 'breakout' ? trigger.level - sign * 1.5 * a : trigger.swing - sign * a;
  let dist = sign * (entry - stop);
  if (dist < 0.5 * a) dist = 0.5 * a;           // guard against a stop sitting at the entry
  if (fat) dist *= 1.5;
  stop = entry - sign * dist;
  return { entry, stop, dist, atr: a };
}

// Quant half of the fat pitch test; catalyst, asymmetry, consensus and precedent stay judgment calls.
export const fatPitchQuant = (l1, l2) => Boolean(l1.decadeExtreme && l2.z != null && Math.abs(l2.z) >= 2.5);

// l3LookbackWeeks: 1 = playbook's same-week rule; >1 lets a recent trigger count.
export function evaluatePair({ cfg, bars, cot, rates, guidanceConfirmed, recentTrade, regime, vix, l3LookbackWeeks = 1 }) {
  const l1 = layer1(rates[cfg.base] || [], rates[cfg.quote] || []);
  const l2 = layer2(cot, cfg.usdBase);
  const triggers = [];
  for (let k = 0; k < l3LookbackWeeks && bars.length - k >= 160; k++) triggers.push(...layer3(k ? bars.slice(0, bars.length - k) : bars).map(x => ({ ...x, weeksAgo: k })));
  const dir = l2.fadeDir;
  const l3Triggers = dir ? triggers.filter(t => t.dir === dir) : [];
  const l2Met = l2.z != null && Math.abs(l2.z) >= 2 && l2.weeks >= 2 && !recentTrade;
  const l3Met = l3Triggers.length > 0;
  const l1Met = l1.met && guidanceConfirmed;
  const fat = l1.met && l2Met && fatPitchQuant(l1, l2);

  let status = 'NO SETUP';
  if (l1Met && l2Met && l3Met) status = 'READY';
  else if (l1.met && l2Met && l3Met) status = 'APPROACHING';
  else if (l1.met || l2Met) status = 'WATCH';
  let pauseReason = null;
  if (regime?.regime === 'Crisis') pauseReason = 'Crisis regime: FX paused';
  else if (vix != null && vix > 40) pauseReason = `VIX ${round(vix, 1)} above 40: do not trade`;
  else if (!cfg.major && ['Late Cycle', 'Contraction'].includes(regime?.regime) && status !== 'NO SETUP') pauseReason = `${regime.regime}: major pairs only`;
  if (pauseReason) status = 'PAUSED';
  return { l1, l2, triggers, l3Triggers, dir, l1Met, l2Met, l3Met, fat, status, pauseReason };
}

export async function computeFX({ inputs = {}, regime, journal = [], vix }) {
  const rates = await bisPolicyRates(BIS_AREAS, `${new Date().getFullYear() - 11}-01`);
  const equity = Number(inputs.equity) || 500000;
  const guidance = inputs.fxGuidance || {};
  const sixWeeksAgo = Date.now() - 42 * 864e5;
  const adj = regime?.adjustments?.fx || { risk: 5, fat: 10 };

  const pairs = await Promise.all(FX_PAIRS.map(async cfg => {
    try {
      const [wk, cot] = await Promise.all([yahoo(cfg.yahoo, '1wk', '5y'), cftcNet(cfg.cftc, 170)]);
      const bars = closedWeeks(wk);
      const recentTrade = journal.some(t => t.pair === cfg.pair && new Date(t.date).getTime() >= sixWeeksAgo);
      const e = evaluatePair({ cfg, bars, cot, rates, guidanceConfirmed: Boolean(guidance[cfg.pair]), recentTrade, regime, vix });

      let plan = null;
      if ((e.status === 'APPROACHING' || e.status === 'READY') && e.l3Triggers.length) {
        const s = stopFor(e.l3Triggers[0], bars, e.fat);
        const sign = e.dir === 'long' ? 1 : -1;
        const riskPct = e.fat ? adj.fat : adj.risk;
        const riskDollars = equity * riskPct / 100;
        plan = {
          direction: e.dir, fatPitch: e.fat, entryRef: round(s.entry, 4), stop: round(s.stop, 4),
          target2R: round(s.entry + sign * 2 * s.dist, 4), target4R: round(s.entry + sign * 4 * s.dist, 4),
          riskPct, riskDollars: Math.round(riskDollars),
          units: Math.round(cfg.usdBase ? riskDollars * s.entry / s.dist : riskDollars / s.dist),
          notes: `50% off at 2R and stop to breakeven, 25% at 4R and stop to +2R, trail last 25% at 1.5x weekly ATR. Time stop ${e.fat ? 90 : 60} days if not at +1R.${e.fat ? ' Fat pitch on the quantitative criteria: confirm catalyst, asymmetry, consensus and precedent yourself.' : ''}`,
        };
      }

      const missing = [];
      if (!e.l1.atExtreme) missing.push(`rate gap ${round(e.l1.gap, 2)}pt not at its 24-month extreme (${round(e.l1.max24, 2)}pt)`);
      else if (!e.l1.established) missing.push('rate gap narrowing or not held for 6 months');
      if (e.l1.met && !guidance[cfg.pair]) missing.push('forward guidance not confirmed (yours)');
      if (!(e.l2.z != null && Math.abs(e.l2.z) >= 2)) missing.push(`CFTC Z ${round(e.l2.z, 2)} (needs ±2.0)`);
      else if (e.l2.weeks < 2) missing.push(`CFTC extreme ${e.l2.weeks}/2 weeks`);
      if (recentTrade) missing.push('traded this pair in the last 6 weeks');
      if (!e.l3Met) missing.push(e.dir ? `no weekly ${e.dir} trigger yet (fading crowded ${e.l2.crowded})` : 'no crowded side to fade');

      return {
        pair: cfg.pair, status: e.status, pauseReason: e.pauseReason, close: round(last(bars).c, 4), atr: round(atr(bars, 14), 4),
        direction: e.dir, fatPitchQuant: e.fat,
        l1: {
          met: e.l1Met, auto: e.l1.met, baseBank: BANK[cfg.base], quoteBank: BANK[cfg.quote],
          baseRate: e.l1.baseRate, quoteRate: e.l1.quoteRate, asOf: e.l1.asOf, tb: e.l1.tb, tq: e.l1.tq,
          gap: round(e.l1.gap, 2), max24: round(e.l1.max24, 2), atExtreme: e.l1.atExtreme, established: e.l1.established,
          guidanceConfirmed: Boolean(guidance[cfg.pair]),
        },
        l2: { met: e.l2Met, z: round(e.l2.z, 2), weeks: e.l2.weeks, asOf: e.l2.asOf, crowded: e.l2.crowded },
        l3: { met: e.l3Met, triggers: e.triggers },
        plan, missing,
      };
    } catch (err) {
      return { pair: cfg.pair, status: 'ERROR', error: err.message };
    }
  }));
  return { pairs, riskPct: adj.risk, fatPct: adj.fat, regimeNote: regime?.adjustments?.fx?.note, equity };
}
