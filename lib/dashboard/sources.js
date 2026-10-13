const UA = { 'User-Agent': 'Mozilla/5.0 (LongCycleCapital dashboard)' };
const NO_STORE = { cache: 'no-store' };

async function getJSON(url, { timeoutMs = 15000, headers = {} } = {}) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const r = await fetch(url, { ...NO_STORE, headers: { ...UA, ...headers }, signal: ctrl.signal });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.json();
    } catch (e) {
      if (attempt === 3) throw new Error(`${url.split('?')[0]}: ${e.message}`);
      await new Promise(res => setTimeout(res, 500 * attempt));
    } finally {
      clearTimeout(timer);
    }
  }
}

async function getText(url, { timeoutMs = 20000 } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { ...NO_STORE, headers: UA, signal: ctrl.signal });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.text();
  } finally {
    clearTimeout(timer);
  }
}

// Returns ascending bars [{ t: ms, o, h, l, c }] with null rows dropped.
export async function yahoo(symbol, interval = '1d', range = '2y') {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}`;
  const d = await getJSON(url);
  const r = d.chart?.result?.[0];
  if (!r) throw new Error(`Yahoo ${symbol}: no data`);
  const q = r.indicators.quote[0];
  const bars = [];
  r.timestamp.forEach((ts, i) => {
    const c = q.close[i];
    if (c == null) return;
    bars.push({ t: ts * 1000, o: q.open[i] ?? c, h: q.high[i] ?? c, l: q.low[i] ?? c, c });
  });
  return bars;
}

// Returns ascending [{ date: 'YYYY-MM-DD', v: number }].
export async function fred(id, { limit = 400, start } = {}) {
  const key = process.env.FRED_API_KEY?.trim().replace(/^["']|["']$/g, '');
  if (!key) throw new Error('FRED_API_KEY missing');
  let url = `https://api.stlouisfed.org/fred/series/observations?series_id=${id}&api_key=${key}&file_type=json&sort_order=desc&limit=${limit}`;
  if (start) url += `&observation_start=${start}`;
  const d = await getJSON(url);
  return (d.observations ?? [])
    .filter(o => o.value !== '.')
    .map(o => ({ date: o.date, v: Number(o.value) }))
    .reverse();
}

// BIS central bank policy rates, monthly end-of-period. Returns { US: [{period, v}], JP: [...] }.
export async function bisPolicyRates(areas, startPeriod) {
  const url = `https://stats.bis.org/api/v1/data/WS_CBPOL/M.${areas.join('+')}/all?startPeriod=${startPeriod}&format=csv`;
  const csv = await getText(url);
  const lines = csv.trim().split('\n');
  const header = lines[0].split(',');
  const iArea = header.indexOf('REF_AREA');
  const iPeriod = header.indexOf('TIME_PERIOD');
  const iVal = header.indexOf('OBS_VALUE');
  const out = {};
  for (const line of lines.slice(1)) {
    const cols = line.split(',');
    // TITLE/COMPILATION may contain commas; read period/value relative to the end.
    const off = cols.length - header.length;
    const area = cols[iArea];
    const period = cols[iPeriod + off];
    const v = Number(cols[iVal + off]);
    if (!area || !period || Number.isNaN(v)) continue;
    (out[area] ||= []).push({ period, v });
  }
  for (const k of Object.keys(out)) out[k].sort((a, b) => a.period.localeCompare(b.period));
  return out;
}

// CFTC legacy futures-only report. Returns ascending [{ date, net }] (non-commercial long minus short).
export async function cftcNet(marketCode, weeks = 170) {
  const url = `https://publicreporting.cftc.gov/resource/6dca-aqww.json?cftc_contract_market_code=${marketCode}` +
    `&$order=report_date_as_yyyy_mm_dd%20DESC&$limit=${weeks}` +
    `&$select=report_date_as_yyyy_mm_dd,noncomm_positions_long_all,noncomm_positions_short_all`;
  const rows = await getJSON(url);
  return rows.map(r => ({
    date: r.report_date_as_yyyy_mm_dd.slice(0, 10),
    net: Number(r.noncomm_positions_long_all) - Number(r.noncomm_positions_short_all),
  })).reverse();
}

// CoinMetrics community (free) daily BTC metrics, full history. Returns ascending rows.
export async function coinmetricsBTC(metrics) {
  const rows = [];
  let url = `https://community-api.coinmetrics.io/v4/timeseries/asset-metrics?assets=btc&metrics=${metrics.join(',')}&frequency=1d&page_size=10000`;
  while (url) {
    const d = await getJSON(url, { timeoutMs: 25000 });
    rows.push(...(d.data ?? []));
    url = d.next_page_url || null;
  }
  return rows.map(r => {
    const o = { date: r.time.slice(0, 10) };
    for (const m of metrics) o[m] = r[m] != null ? Number(r[m]) : null;
    return o;
  });
}
