import { NextResponse } from 'next/server';

const FRED_KEY  = process.env.FRED_API_KEY;
const FRED_BASE = 'https://api.stlouisfed.org/fred/series/observations';
const CACHE     = { next: { revalidate: 86400 } };

/* ── FRED helpers ──────────────────────────────────────────── */
async function fredObs(id, limit = 14) {
  if (!FRED_KEY) return null;
  try {
    const url = `${FRED_BASE}?series_id=${id}&api_key=${FRED_KEY}&file_type=json&sort_order=desc&limit=${limit}`;
    const r = await fetch(url, CACHE);
    const d = await r.json();
    return (d.observations ?? []).filter(o => o.value !== '.');
  } catch { return null; }
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

function composite(statusMap) {
  let wSum = 0, scoreSum = 0;
  for (const [k, w] of Object.entries(WEIGHTS)) {
    const s = statusMap[k];
    if (s != null) { scoreSum += SCORE[s] * w; wSum += w; }
  }
  const norm = wSum ? scoreSum / wSum / 3 : 0.5;   // 0–1

  // confidence = agreement among indicators (1 - spread)
  const vals = Object.entries(WEIGHTS)
    .filter(([k]) => statusMap[k] != null)
    .map(([k]) => SCORE[statusMap[k]] / 3);
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  const sd   = Math.sqrt(vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length);
  const conf = Math.max(0.35, Math.min(0.99, 1 - sd * 1.5));

  // Map normalised stress → phase
  let phase, phaseIdx, needleAngle;
  if      (norm < 0.20) { phase = 'Recovery';    phaseIdx = 0; needleAngle = 162; }
  else if (norm < 0.40) { phase = 'Expansion';   phaseIdx = 1; needleAngle = 126; }
  else if (norm < 0.60) { phase = 'Late Cycle';  phaseIdx = 2; needleAngle = 108 - conf * 36; }
  else if (norm < 0.80) { phase = 'Contraction'; phaseIdx = 3; needleAngle = 54; }
  else                  { phase = 'Crisis';       phaseIdx = 4; needleAngle = 18; }

  return { phase, phaseIdx, confidence: +conf.toFixed(2), needleAngle: +needleAngle.toFixed(1) };
}

/* ── Main handler ──────────────────────────────────────────── */
export async function GET() {
  if (!FRED_KEY) return NextResponse.json({ live: false });

  /* Parallel fetches */
  const [ycObs, claimsObs, cpiObs, hyObs, ffObs, tipsObs, leiObs, ismObs,
         spxCloses, dxyClose, copperClose, goldClose] = await Promise.all([
    fredObs('T10Y2Y',       1),
    fredObs('ICSA',         1),
    fredObs('CPIAUCSL',    14),
    fredObs('BAMLH0A0HYM2', 1),
    fredObs('FEDFUNDS',     1),
    fredObs('DFII10',       1),
    fredObs('USSLIND',     14),
    fredObs('NAPM',         1),
    yahooCloses('%5EGSPC', '1y'),
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

  /* ── ISM PMI */
  const ism     = fv(ismObs);
  const ismSt   = clamp(ism, [55, 50, 46]);  // ALERT below 46, not 48
  const ismDisp = ism != null ? ism.toFixed(1) : null;
  const ismRead = ism != null ? (ism < 48 ? 'Contraction territory' : ism < 50 ? 'Near contraction' : ism < 55 ? 'Slowing growth' : 'Expanding') : null;

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

  /* ── S&P vs 200 DMA */
  let spxPct = null, spxSt = null, spxDisp = null, spxRead = null;
  if (spxCloses && spxCloses.length >= 200) {
    const sma = spxCloses.slice(-200).reduce((a, b) => a + b, 0) / 200;
    const last = spxCloses[spxCloses.length - 1];
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

  /* ── LEI YoY */
  let leiYoY = null, leiYoYSt = null, leiYoYDisp = null, leiYoYRead = null;
  if (leiObs && leiObs.length >= 13) {
    const lat = parseFloat(leiObs[0].value), yr = parseFloat(leiObs[12].value);
    leiYoY     = ((lat - yr) / yr) * 100;
    leiYoYSt   = clamp(leiYoY, [2, 0, -3]);
    leiYoYDisp = `${leiYoY >= 0 ? '+' : ''}${leiYoY.toFixed(1)}%`;
    leiYoYRead = leiYoY > 2 ? 'Positive momentum' : leiYoY >= 0 ? 'Slowing momentum' : leiYoY >= -3 ? 'Contraction signal' : 'Recession-level reading';
  }

  /* ── Copper / Gold ratio */
  let cgSt = null, cgDisp = null, cgRead = null;
  const copper = copperClose?.slice(-1)[0] ?? null;
  const gold   = goldClose?.slice(-1)[0] ?? null;
  if (copper && gold) {
    const ratio = copper / gold;
    cgSt   = clamp(ratio, [0.25, 0.20, 0.15]);
    cgDisp = ratio.toFixed(4);
    cgRead = ratio > 0.25 ? 'Risk-on, growth expected' : ratio > 0.20 ? 'Declining risk appetite' : ratio > 0.15 ? 'Risk-off signal' : 'Strong risk-off';
  }

  /* ── Composite phase + confidence */
  const statusMap = {
    yc: ycSt, ism: ismSt, claims: claimsSt, cpi: cpiSt,
    hy: hySt, leiTrend: leiTrendSt, leiYoY: leiYoYSt, spx: spxSt,
    ff: ffSt, tips: tipsSt, copper: cgSt, dxy: dxySt,
  };
  const { phase, phaseIdx, confidence, needleAngle } = composite(statusMap);

  /* ── Response */
  return NextResponse.json({
    live: true,
    updatedAt: new Date().toISOString(),
    phase,
    phaseIdx,
    confidence,
    needleAngle,
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
  }, {
    headers: { 'Cache-Control': 's-maxage=86400, stale-while-revalidate=43200' },
  });
}
