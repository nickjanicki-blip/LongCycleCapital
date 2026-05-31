import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const FRED_BASE  = 'https://api.stlouisfed.org/fred/series/observations';
const CACHE      = { next: { revalidate: 3600 } }; // revalidate every hour
const KV_KEY     = 'compass:last_good';

function getRedis() {
  const url   = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

// ── ISM Manufacturing PMI — MANUAL ENTRY ─────────────────────────────
// ISM's PMI is proprietary and not on FRED. Update this once a month from
// ismworld.org (released the first business day, for the prior month).
const ISM_MANUAL = { value: 52.7, asOf: 'April 2026' };  // released 2026-05-01

/* ── FRED helpers ──────────────────────────────────────────── */
const sleep = (ms) => new Promise(res => setTimeout(res, ms));

// Fetch a FRED series with retry + backoff. FRED is flaky under bursts
// (we fire ~8 at once), so a transient timeout or non-200 gets retried
// rather than silently collapsing to null and dropping the indicator.
async function fredObs(fredKey, id, limit = 14) {
  if (!fredKey) return null;
  const url = `${FRED_BASE}?series_id=${id}&api_key=${fredKey}&file_type=json&sort_order=desc&limit=${limit}`;
  const MAX_ATTEMPTS = 3;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 8000); // 8s per attempt
      const r = await fetch(url, { ...CACHE, signal: ctrl.signal });
      clearTimeout(timer);
      if (!r.ok) throw new Error(`FRED ${id} HTTP ${r.status}`);
      const d = await r.json();
      const obs = (d.observations ?? []).filter(o => o.value !== '.');
      if (obs.length === 0 && attempt < MAX_ATTEMPTS) throw new Error(`FRED ${id} empty`);
      return obs;
    } catch {
      if (attempt < MAX_ATTEMPTS) await sleep(400 * attempt); // 400ms, 800ms backoff
    }
  }
  return null;
}

/* ── Yahoo Finance helpers ─────────────────────────────────── */
async function yahooCloses(symbol, range = '5d') {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=${range}`;
    const r   = await fetch(url, CACHE);
    const d   = await r.json();
    return (d.chart?.result?.[0]?.indicators?.quote?.[0]?.close ?? []).filter(Boolean);
  } catch { return null; }
}

/* ── Status classifiers ────────────────────────────────────── */
const S = { OK: 'OK', CAU: 'CAUTION', WARN: 'WARNING', ALERT: 'ALERT' };

function clamp(v, [a, b, c]) {
  if (v == null) return null;
  if (v > a)  return S.OK;
  if (v > b)  return S.CAU;
  if (v > c)  return S.WARN;
  return S.ALERT;
}
function clampRev(v, [a, b, c]) {   // lower = worse
  if (v == null) return null;
  if (v < a)  return S.OK;
  if (v < b)  return S.CAU;
  if (v < c)  return S.WARN;
  return S.ALERT;
}

/* ── Composite scoring ─────────────────────────────────────── */
const SCORE = { OK: 0, CAUTION: 1, WARNING: 2, ALERT: 3 };
const WEIGHTS = {
  yc: 0.14, ism: 0.12, claims: 0.11, cpi: 0.09,
  hy: 0.10, leiTrend: 0.06, leiYoY: 0.07, spx: 0.05,
  ff: 0.05, tips: 0.08, copper: 0.09, dxy: 0.04,
};

const PHASES = ['Recovery', 'Expansion', 'Late Cycle', 'Contraction', 'Crisis'];
// Angular bounds of each phase on the 180°→0° dial (5 × 36°)
const ZONE = [[180, 144], [144, 108], [108, 72], [72, 36], [36, 0]];

function composite(statusMap) {
  let wSum = 0, scoreSum = 0;
  for (const [k, w] of Object.entries(WEIGHTS)) {
    const s = statusMap[k];
    if (s != null) { scoreSum += SCORE[s] * w; wSum += w; }
  }
  const norm = wSum ? scoreSum / wSum / 3 : 0.5;   // 0–1

  // ── Confidence: how firmly the needle sits inside its phase zone ──────
  // Boundary-distance metric. Dead-centre of a zone → high confidence
  // ("firmly in this regime"); hugging a boundary → low confidence ("could
  // tip either way"). This is the same thing the dial's cone of uncertainty
  // draws, so the number and the picture always agree.
  const BAND = 0.20;                                          // each phase spans 0.20 of norm
  const posInBand  = norm - Math.floor(norm / BAND) * BAND;   // 0 .. 0.20
  const distToEdge = Math.min(posInBand, BAND - posInBand);   // 0 .. 0.10
  const proximity  = distToEdge / (BAND / 2);                 // 0 (edge) .. 1 (centre)
  const conf = 0.40 + proximity * 0.57;                       // 0.40 .. 0.97

  // Prior metric — indicator agreement — kept for easy revert:
  // const vals = Object.entries(WEIGHTS).filter(([k]) => statusMap[k] != null).map(([k]) => SCORE[statusMap[k]] / 3);
  // const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  // const sd   = Math.sqrt(vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length);
  // const conf = Math.max(0.35, Math.min(0.99, 1 - sd * 1.5));

  // ── Raw phase: what the full indicator set (incl. leading) suggests ──
  let rawIdx;
  if      (norm < 0.20) rawIdx = 0;
  else if (norm < 0.40) rawIdx = 1;
  else if (norm < 0.60) rawIdx = 2;
  else if (norm < 0.80) rawIdx = 3;
  else                  rawIdx = 4;

  // ── Labor-market gate ───────────────────────────────────────────────
  // Leading indicators (yield curve, ISM, LEI, credit) can only take the
  // regime to Late Cycle. Contraction/Crisis require the labor market —
  // the coincident confirmation signal — to actually roll over. This is
  // how NBER dates recessions: employment confirms, not the yield curve.
  const labor = statusMap.claims;                  // OK | CAUTION | WARNING | ALERT
  const laborCap = labor === 'ALERT'   ? 4         // labor breaking down → Crisis allowed
                 : labor === 'WARNING' ? 3         // labor softening → Contraction allowed
                 : 2;                              // OK / CAUTION / unknown → Late Cycle max
  const phaseIdx = Math.min(rawIdx, laborCap);
  const laborGated = phaseIdx < rawIdx;            // gate is actively holding the regime back

  // ── Needle angle: continuous map of norm across the dial ─────────────
  // The needle rests BETWEEN zones at a boundary instead of snapping to a
  // phase centre. If the labor gate capped the regime, the needle pins to
  // the edge of the capped zone so needle and regime name stay consistent.
  let needleAngle = 180 * (1 - norm);
  const [hi, lo] = ZONE[phaseIdx];
  needleAngle = Math.min(hi, Math.max(lo, needleAngle));

  return {
    phase: PHASES[phaseIdx],
    phaseIdx,
    rawPhase: PHASES[rawIdx],
    rawPhaseIdx: rawIdx,
    laborGated,
    transitional: conf < 0.60,
    confidence: +conf.toFixed(2),
    needleAngle: +needleAngle.toFixed(1),
    norm: +norm.toFixed(3),
  };
}

/* ── Main handler ──────────────────────────────────────────── */
// Read the raw last-good payload object from KV (or null).
async function readLastGood() {
  try {
    const redis = getRedis();
    if (!redis) return null;
    const cached = await redis.get(KV_KEY);
    if (!cached) return null;
    return typeof cached === 'string' ? JSON.parse(cached) : cached;
  } catch { return null; }
}

function kvFallbackResponse(lastGood) {
  if (!lastGood) return null;
  return NextResponse.json({ ...lastGood, fromCache: true }, {
    headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=3600' },
  });
}

export async function GET() {
  // Strip whitespace AND any surrounding quotes — a quoted value pasted into
  // an env var dashboard is a common, silent cause of "key present but every
  // call fails."
  const FRED_KEY = process.env.FRED_API_KEY?.trim().replace(/^["']|["']$/g, '');

  // Load last-good once up front — used both as a hard fallback (FRED down)
  // and for per-field carry-forward when only some series are missing.
  const lastGood = await readLastGood();

  if (!FRED_KEY) {
    const cached = kvFallbackResponse(lastGood);
    return cached ?? NextResponse.json({ live: false });
  }

  /* Parallel fetches */
  const [ycObs, claimsObs, cpiObs, hyObs, ffObs, tipsObs, leiObs,
         spxObs, dxyClose, copperClose, goldClose] = await Promise.all([
    fredObs(FRED_KEY, 'T10Y2Y',       1),
    fredObs(FRED_KEY, 'ICSA',         1),
    fredObs(FRED_KEY, 'CPIAUCSL',    14),
    fredObs(FRED_KEY, 'BAMLH0A0HYM2', 1),
    fredObs(FRED_KEY, 'FEDFUNDS',     1),
    fredObs(FRED_KEY, 'DFII10',       1),
    fredObs(FRED_KEY, 'USSLIND',     14),
    fredObs(FRED_KEY, 'SP500',      260),   // S&P 500 daily — FRED is more reliable than Yahoo ^GSPC
    yahooCloses('DX-Y.NYB', '5d'),
    yahooCloses('HG=F',     '5d'),
    yahooCloses('GC=F',     '5d'),
  ]);

  const fv = (obs, i = 0) => {
    const v = obs?.[i]?.value;
    return v && v !== '.' ? parseFloat(v) : null;
  };

  /* ── Yield Curve */
  const yc     = fv(ycObs);
  const ycSt   = clamp(yc, [0.5, 0, -0.5]);
  const ycDisp = yc != null ? `${yc >= 0 ? '+' : ''}${yc.toFixed(2)}%` : null;
  const ycRead = yc != null ? (yc < 0 ? 'Inverted' : yc < 0.5 ? 'Flattening' : 'Normal slope') : null;

  /* ── ISM PMI — manual (see ISM_MANUAL at top of file) */
  const ism     = ISM_MANUAL.value;
  const ismSt   = clamp(ism, [55, 50, 46]);  // ALERT below 46
  const ismDisp = ism != null ? ism.toFixed(1) : null;
  const descr   = ism > 55 ? 'Strong expansion' : ism >= 50 ? 'Modest expansion' : ism >= 46 ? 'Near contraction' : 'Contraction territory';
  const ismRead = ism != null ? `${descr} · manual (${ISM_MANUAL.asOf})` : null;

  /* ── Claims */
  const claims     = fv(claimsObs);
  const claimsSt   = clampRev(claims, [220000, 240000, 260000]);
  const claimsDisp = claims != null ? `${Math.round(claims / 1000)}k` : null;
  const claimsRead = claims != null ? (claims < 220000 ? 'Tight labor market' : claims < 240000 ? 'Normal range' : claims < 260000 ? 'Rising trend' : 'Labor softening') : null;

  /* ── CPI YoY */
  let cpiYoY = null;
  if (cpiObs && cpiObs.length >= 13) {
    const lat = parseFloat(cpiObs[0].value), yr = parseFloat(cpiObs[12].value);
    cpiYoY = ((lat - yr) / yr) * 100;
  }
  const cpiSt   = clampRev(cpiYoY, [2, 3, 5]);
  const cpiDisp = cpiYoY != null ? `${cpiYoY.toFixed(1)}%` : null;
  const cpiRead = cpiYoY != null ? (cpiYoY < 2 ? 'At Fed target' : cpiYoY < 3 ? 'Above target' : cpiYoY < 5 ? 'Materially above target' : 'High inflation') : null;

  /* ── High Yield Spreads */
  const hy     = fv(hyObs);
  const hySt   = clampRev(hy, [3, 4.5, 6]);
  const hyDisp = hy != null ? `${hy.toFixed(2)}%` : null;
  const hyRead = hy != null ? (hy < 3 ? 'Tight credit' : hy < 4.5 ? 'Elevated, stable' : hy < 6 ? 'Widening — stress building' : 'Credit stress') : null;

  /* ── Fed Funds */
  const ff     = fv(ffObs);
  const ffSt   = clampRev(ff, [2.5, 3.5, 5]);
  const ffDisp = ff != null ? `${ff.toFixed(2)}%` : null;
  const ffRead = ff != null ? (ff < 2.5 ? 'Accommodative' : ff < 3.5 ? 'Near neutral' : ff < 5 ? 'Restrictive' : 'Highly restrictive') : null;

  /* ── TIPS Real Yield */
  const tips     = fv(tipsObs);
  const tipsSt   = clampRev(tips, [0, 1, 2.5]);
  const tipsDisp = tips != null ? `${tips.toFixed(2)}%` : null;
  const tipsRead = tips != null ? (tips < 0 ? 'Negative real rates' : tips < 1 ? 'Near neutral' : tips < 2.5 ? 'Restrictive real rates' : 'Highly restrictive') : null;

  /* ── DXY (Yahoo) */
  const dxy     = dxyClose?.slice(-1)[0] ?? null;
  const dxySt   = clampRev(dxy, [95, 102, 108]);
  const dxyDisp = dxy != null ? dxy.toFixed(1) : null;
  const dxyRead = dxy != null ? (dxy < 95 ? 'Dollar weakness' : dxy < 102 ? 'Normal range' : dxy < 108 ? 'Elevated — approaching extreme' : 'Multi-year extreme') : null;

  /* ── S&P vs 200 DMA (FRED SP500, observations sorted newest-first) */
  let spxPct = null, spxSt = null, spxDisp = null, spxRead = null;
  if (spxObs && spxObs.length >= 200) {
    const closes = spxObs.map(o => parseFloat(o.value));   // [latest … oldest]
    const last = closes[0];
    const sma  = closes.slice(0, 200).reduce((a, b) => a + b, 0) / 200;
    spxPct  = ((last - sma) / sma) * 100;
    spxSt   = clamp(spxPct, [5, 0, -5]);
    spxDisp = `${spxPct >= 0 ? '+' : ''}${spxPct.toFixed(1)}%`;
    spxRead = spxPct > 5 ? 'Strong uptrend' : spxPct >= 0 ? 'Near 200 DMA' : spxPct >= -5 ? 'Below 200 DMA' : 'Sustained downtrend';
  }

  /* ── LEI trend */
  let leiTrendSt = null, leiDisp = null, leiTrendRead = null;
  if (leiObs && leiObs.length >= 5) {
    let dec = 0;
    for (let i = 0; i < 4; i++) {
      if (parseFloat(leiObs[i].value) < parseFloat(leiObs[i + 1].value)) dec++;
    }
    leiDisp      = parseFloat(leiObs[0].value).toFixed(1);
    leiTrendSt   = dec === 0 ? S.OK : dec <= 1 ? S.CAU : dec <= 3 ? S.WARN : S.ALERT;
    leiTrendRead = dec === 0 ? 'Rising trend' : `Declining ${dec} of last 4 months`;
  }

  /* ── LEI 12-month change ──────────────────────────────────────────────
   * USSLIND is already a forward growth-rate index (~1–2), not a price
   * level, so a YoY *percent* change is meaningless. We use the 12-month
   * change in the rate itself, in percentage points. */
  let leiYoY = null, leiYoYSt = null, leiYoYDisp = null, leiYoYRead = null;
  if (leiObs && leiObs.length >= 13) {
    const lat = parseFloat(leiObs[0].value), yr = parseFloat(leiObs[12].value);
    leiYoY     = lat - yr;                       // percentage-point change in the leading rate
    leiYoYSt   = clamp(leiYoY, [0.5, 0, -0.5]);
    leiYoYDisp = `${leiYoY >= 0 ? '+' : ''}${leiYoY.toFixed(2)} pt`;
    leiYoYRead = leiYoY > 0.5 ? 'Improving momentum' : leiYoY >= 0 ? 'Steady' : leiYoY >= -0.5 ? 'Slowing momentum' : 'Deteriorating';
  }

  /* ── Copper / Gold ratio */
  let cgSt = null, cgDisp = null, cgRead = null;
  const copper = copperClose?.slice(-1)[0] ?? null;
  const gold   = goldClose?.slice(-1)[0] ?? null;
  if (copper && gold) {
    // Copper futures (HG=F) are $/lb, gold (GC=F) $/oz. The conventional
    // copper/gold ratio uses cents-per-pound over $/oz → ×100.
    const ratio = (copper / gold) * 100;
    cgSt   = clamp(ratio, [0.25, 0.20, 0.15]);
    cgDisp = ratio.toFixed(3);
    cgRead = ratio > 0.25 ? 'Risk-on, growth expected' : ratio > 0.20 ? 'Declining risk appetite' : ratio > 0.15 ? 'Risk-off signal' : 'Strong risk-off';
  }

  /* ── Composite phase + confidence */
  const statusMap = {
    yc: ycSt, ism: ismSt, claims: claimsSt, cpi: cpiSt,
    hy: hySt, leiTrend: leiTrendSt, leiYoY: leiYoYSt, spx: spxSt,
    ff: ffSt, tips: tipsSt, copper: cgSt, dxy: dxySt,
  };
  const { phase, phaseIdx, rawPhase, rawPhaseIdx, laborGated, transitional, confidence, needleAngle, norm } = composite(statusMap);

  /* ── Save to KV */
  const payload = {
    live: true,
    updatedAt: new Date().toISOString(),
    phase,
    phaseIdx,
    rawPhase,
    rawPhaseIdx,
    laborGated,
    transitional,
    confidence,
    needleAngle,
    norm,
    tier1: [
      { name: 'Yield Curve (2Y–10Y)',   value: ycDisp,     reading: ycRead,     status: ycSt     ?? 'WARNING' },
      { name: 'ISM Manufacturing PMI',  value: ismDisp,    reading: ismRead,    status: ismSt    ?? 'WARNING' },
      { name: 'Unemployment Claims',    value: claimsDisp, reading: claimsRead, status: claimsSt ?? 'CAUTION' },
      { name: 'CPI Year-over-Year',     value: cpiDisp,    reading: cpiRead,    status: cpiSt    ?? 'CAUTION' },
    ],
    tier2: [
      ['Leading Indicator Index', leiDisp,     leiTrendRead, leiTrendSt  ?? 'WARNING'],
      ['Conf. Board LEI YoY',     leiYoYDisp,  leiYoYRead,   leiYoYSt    ?? 'ALERT'  ],
      ['S&P 500 vs 200 DMA',      spxDisp,     spxRead,      spxSt       ?? 'CAUTION'],
      ['High Yield Spreads',      hyDisp,      hyRead,       hySt        ?? 'WARNING'],
      ['Fed Funds Rate',          ffDisp,      ffRead,       ffSt        ?? 'CAUTION'],
      ['10yr TIPS Real Yield',    tipsDisp,    tipsRead,     tipsSt      ?? 'WARNING'],
      ['Copper / Gold Ratio',     cgDisp,      cgRead,       cgSt        ?? 'WARNING'],
      ['USD DXY',                 dxyDisp,     dxyRead,      dxySt       ?? 'CAUTION'],
    ],
  };

  // ── Per-field carry-forward ──────────────────────────────────────────
  // If an individual indicator came back empty (FRED dropped that one series),
  // carry forward its last good value rather than showing a blank. A single
  // flaky series should never blank out, and we must never overwrite a real
  // cached value with null. Match by indicator name.
  let carried = 0;
  if (lastGood) {
    payload.tier1 = payload.tier1.map(t => {
      if (t.value == null) {
        const prev = lastGood.tier1?.find(p => p.name === t.name);
        if (prev && prev.value != null) { carried++; return { ...prev, stale: true }; }
      }
      return t;
    });
    payload.tier2 = payload.tier2.map(t => {
      if (t[1] == null) {
        const prev = lastGood.tier2?.find(p => p[0] === t[0]);
        if (prev && prev[1] != null) { carried++; return [...prev]; }
      }
      return t;
    });
  }

  // ── FRED health check ────────────────────────────────────────────────
  // How many FRED series returned data this pull (before carry-forward)?
  const fredSeries = [ycObs, claimsObs, cpiObs, hyObs, ffObs, tipsObs, leiObs, spxObs];
  const fredOk = fredSeries.filter(o => o && o.length > 0).length;
  // Require the yield curve (highest-weighted daily series) plus a healthy
  // majority. Without the curve, the regime isn't trustworthy.
  const fredHealthy = (ycObs && ycObs.length > 0) && fredOk >= 6;

  if (!fredHealthy && !lastGood) {
    // FRED degraded and we have nothing cached — return what we have, no save.
    return NextResponse.json(payload, {
      headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=3600, stale-if-error=604800' },
    });
  }
  if (!fredHealthy) {
    // FRED degraded but we have a good cache — serve it rather than a
    // half-empty live reading, and don't overwrite the cache.
    return kvFallbackResponse(lastGood);
  }

  // FRED healthy — persist as new "last good". Carry-forward above ensures we
  // never write a null over a previously-good field.
  try {
    const redis = getRedis();
    if (redis) await redis.set(KV_KEY, JSON.stringify(payload));
  } catch { /* non-fatal */ }

  return NextResponse.json(payload, {
    headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400, stale-if-error=604800' },
  });
}
