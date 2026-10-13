import { fred, yahoo } from './sources';
import { last, mean, round, stdev } from './math';

const safe = async (p) => { try { return await p; } catch (e) { return { error: e.message }; } };
const ok = x => x && !x.error;

// Longest run of consecutive daily T10Y2Y < 0, and when it ended.
function inversionRuns(obs) {
  let best = null, start = null;
  obs.forEach((o, i) => {
    if (o.v < 0 && start == null) start = i;
    const ends = start != null && (o.v >= 0 || i === obs.length - 1);
    if (ends) {
      const endIdx = o.v >= 0 ? i - 1 : i;
      const days = (new Date(obs[endIdx].date) - new Date(obs[start].date)) / 864e5;
      const run = { from: obs[start].date, to: obs[endIdx].date, months: days / 30.44, ongoing: o.v < 0 };
      if (!best || run.months > best.months) best = run;
      start = null;
    }
  });
  return best;
}

function corr(a, b) {
  const ma = mean(a), mb = mean(b);
  const num = a.reduce((s, x, i) => s + (x - ma) * (b[i] - mb), 0);
  return num / (a.length * stdev(a) * stdev(b));
}
const rets = bars => bars.slice(1).map((b, i) => b.c / bars[i].c - 1);

export async function computeRecession({ inputs = {}, regime, compass }) {
  const start5y = new Date(Date.now() - 5 * 365 * 864e5).toISOString().slice(0, 10);
  const [debt, intPay, receipts, curve, stl, sahm, loans, hy, dgs10, vix, spx, tlt, gld, dxy, jpy] = await Promise.all([
    safe(fred('GFDEGDQ188S', { limit: 4 })),
    safe(fred('A091RC1Q027SBEA', { limit: 4 })),
    safe(fred('FGRECPT', { limit: 4 })),
    safe(fred('T10Y2Y', { start: start5y, limit: 2000 })),
    safe(fred('STLFSI4', { limit: 10 })),
    safe(fred('SAHMREALTIME', { limit: 3 })),
    safe(fred('DRTSCILM', { limit: 3 })),
    safe(fred('BAMLH0A0HYM2', { limit: 300 })),
    safe(fred('DGS10', { limit: 40 })),
    safe(yahoo('^VIX', '1d', '3mo')),
    safe(yahoo('^GSPC', '1d', '2y')),
    safe(yahoo('TLT', '1d', '3mo')),
    safe(yahoo('GLD', '1d', '3mo')),
    safe(yahoo('DX-Y.NYB', '1d', '3mo')),
    safe(yahoo('JPY=X', '1d', '3mo')),
  ]);
  const manual = inputs.recessionManual || {};
  const ism = compass?.tier1?.find(t => /ISM/.test(t.name));
  const ismVal = ism ? Number(ism.value) : null;

  const inv = ok(curve) ? inversionRuns(curve) : null;
  const invEndedMonthsAgo = inv ? (Date.now() - new Date(inv.to)) / (30.44 * 864e5) : null;
  const intPct = ok(intPay) && ok(receipts) ? last(intPay).v / last(receipts).v * 100 : null;
  const hyWiden = ok(hy) ? last(hy).v - Math.min(...hy.slice(-252).map(o => o.v)) : null;
  const vix10 = ok(vix) ? mean(vix.slice(-10).map(b => b.c)) : null;
  const vixNow = ok(vix) ? last(vix).c : null;
  const spxHigh = ok(spx) ? Math.max(...spx.map(b => b.c)) : null;
  const spxDD = ok(spx) ? 1 - last(spx).c / spxHigh : null;
  let corrAvg = null;
  if (ok(spx) && ok(tlt) && ok(gld)) {
    const n = 20;
    const [a, b, c] = [rets(spx.slice(-n - 1)), rets(tlt.slice(-n - 1)), rets(gld.slice(-n - 1))];
    corrAvg = (corr(a, b) + corr(a, c) + corr(b, c)) / 3;
  }
  const move20 = s => (ok(s) && s.length > 21 ? last(s).c / s[s.length - 21].c - 1 : null);
  const dxyMove = move20(dxy), jpyMove = move20(jpy);

  const item = (id, label, met, value, auto = true) => ({ id, label, met: Boolean(met), value, auto });
  const tier1 = [
    item('debt_gdp', 'Government debt-to-GDP above 100%', ok(debt) && last(debt).v > 100, ok(debt) ? `${round(last(debt).v, 1)}%` : 'n/a'),
    item('int_exp', 'Federal interest expense above 15% of receipts', intPct != null && intPct > 15, intPct != null ? `${round(intPct, 1)}%` : 'n/a'),
    item('yield_inv', 'Yield curve inverted 6+ months (ended within 24 months)', inv && inv.months >= 6 && (inv.ongoing || invEndedMonthsAgo <= 24),
      inv ? `Longest recent inversion ${round(inv.months, 0)} mo, ${inv.from} to ${inv.to}` : 'n/a'),
    item('bank_stress', 'Banking/financial stress rising (St. Louis Fed stress index > 0)', ok(stl) && last(stl).v > 0, ok(stl) ? `STLFSI ${round(last(stl).v, 2)}` : 'n/a'),
    item('bubbles', 'Multiple late-cycle bubble characteristics', manual.bubbles, 'Your judgment', false),
  ];
  const tier2 = [
    item('sahm', 'Sahm Rule triggered (≥ 0.50)', ok(sahm) && last(sahm).v >= 0.5, ok(sahm) ? round(last(sahm).v, 2) : 'n/a'),
    item('lei_fall', 'Conference Board LEI falling 6+ months', manual.lei_fall, 'Manual: Conference Board LEI is not free', false),
    item('spreads', 'HY credit spreads widened 200bps+ off 12-month low', hyWiden != null && hyWiden >= 2, ok(hy) ? `${round(last(hy).v, 2)}% (+${round(hyWiden * 100, 0)}bps off low)` : 'n/a'),
    item('loan_tight', 'Banks tightening credit (Senior Loan Officer net % > 20)', ok(loans) && last(loans).v > 20, ok(loans) ? `${round(last(loans).v, 1)}% (${last(loans).date})` : 'n/a'),
    item('ism_45', 'ISM Manufacturing PMI below 45', ismVal != null && ismVal < 45, ismVal != null ? `${ismVal} (latest manual entry)` : 'n/a'),
  ];
  const tier3 = [
    item('vix30', 'VIX above 30 sustained (10-day avg)', vix10 != null && vix10 > 30, vix10 != null ? `10d avg ${round(vix10, 1)}, now ${round(vixNow, 1)}` : 'n/a'),
    item('corr_spike', 'Cross-asset correlation spike (S&P/TLT/GLD 20d avg > 0.5)', corrAvg != null && corrAvg > 0.5, corrAvg != null ? round(corrAvg, 2) : 'n/a'),
    item('bank_fail', 'Major bank failures or distress', manual.bank_fail, 'Your judgment', false),
    item('liquidity', 'Liquidity stress (St. Louis Fed stress index > 1.5)', ok(stl) && last(stl).v > 1.5, ok(stl) ? `STLFSI ${round(last(stl).v, 2)}` : 'n/a'),
    item('fx_stress', 'Currency stress (DXY 20d move > 5% or USD/JPY > 7%)', (dxyMove != null && Math.abs(dxyMove) > 0.05) || (jpyMove != null && Math.abs(jpyMove) > 0.07),
      `DXY ${dxyMove != null ? round(dxyMove * 100, 1) : 'n/a'}%, USD/JPY ${jpyMove != null ? round(jpyMove * 100, 1) : 'n/a'}% (20d)`),
  ];
  const count = t => t.filter(x => x.met).length;
  const tierCounts = { t1: count(tier1), t2: count(tier2), t3: count(tier3) };

  const y10 = ok(dgs10) ? last(dgs10).v : null;
  const y10Max = ok(dgs10) ? Math.max(...dgs10.map(o => o.v)) : null;
  const r = regime?.regime;
  const crisisTrades = [
    { name: 'Long VIX (2-3%)', status: vixNow != null && tierCounts.t1 >= 2 ? (vixNow < 15 ? 'ARMED' : vixNow < 17 ? 'WATCH' : 'NOT ARMED') : 'NOT ARMED',
      why: `Needs VIX < 15 while Tier 1 warnings are active. VIX ${round(vixNow, 1)}, Tier 1 ${tierCounts.t1}/5.` },
    { name: 'Short overvalued sector (max 5%/position)', status: r === 'Late Cycle' ? 'DISCRETIONARY' : 'NOT ARMED',
      why: 'Late-cycle valuation call. The engine cannot judge sector valuation; your call.' },
    { name: 'Long gold (5-10%)', status: ['Late Cycle', 'Contraction', 'Crisis'].includes(r) ? 'ACTIVE' : 'NOT ARMED',
      why: `Active from Late Cycle through Crisis. Regime: ${r}.` },
    { name: 'Long Treasuries / TLT (5-10%)', status: y10 != null && y10 > 5 ? (y10 < y10Max - 0.15 ? 'ARMED' : 'WATCH') : 'NOT ARMED',
      why: `Enter when the 10y is above 5% and clearly peaking. 10y ${y10}%, 2-month high ${y10Max}%. Watch for a fiscal-crisis selloff instead.` },
    { name: 'Crisis equity buying (up to 30%, tranches)', status: spxDD != null && spxDD >= 0.35 && vixNow > 50 ? 'ARMED' : 'NOT ARMED',
      why: `Needs S&P down 35%+ and VIX above 50. S&P ${round(spxDD * 100, 1)}% off high.` },
  ];

  const errors = [debt, intPay, receipts, curve, stl, sahm, loans, hy, dgs10, vix, spx, tlt, gld, dxy, jpy].filter(x => x?.error).map(x => x.error);
  return { tier1, tier2, tier3, tierCounts, crisisTrades, tenYear: y10, errors };
}
