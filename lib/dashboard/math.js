export const last = a => a[a.length - 1];
export const mean = a => a.reduce((s, x) => s + x, 0) / a.length;
export const stdev = a => {
  const m = mean(a);
  return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / a.length);
};
export const zscore = (x, window) => {
  const sd = stdev(window);
  return sd ? (x - mean(window)) / sd : 0;
};
export const sma = (a, n) => (a.length >= n ? mean(a.slice(-n)) : null);
export const round = (x, d = 2) => (x == null || Number.isNaN(x) ? null : Number(x.toFixed(d)));
export const pct = (a, b) => (b ? (a - b) / b : null);

// Wilder RSI series aligned to closes (first n entries null).
export function rsiSeries(closes, n = 14) {
  const out = new Array(closes.length).fill(null);
  if (closes.length <= n) return out;
  let gain = 0, loss = 0;
  for (let i = 1; i <= n; i++) {
    const d = closes[i] - closes[i - 1];
    if (d > 0) gain += d; else loss -= d;
  }
  gain /= n; loss /= n;
  out[n] = loss === 0 ? 100 : 100 - 100 / (1 + gain / loss);
  for (let i = n + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    gain = (gain * (n - 1) + Math.max(d, 0)) / n;
    loss = (loss * (n - 1) + Math.max(-d, 0)) / n;
    out[i] = loss === 0 ? 100 : 100 - 100 / (1 + gain / loss);
  }
  return out;
}

export function atr(bars, n = 14) {
  if (bars.length <= n) return null;
  const trs = bars.slice(1).map((b, i) => {
    const pc = bars[i].c;
    return Math.max(b.h - b.l, Math.abs(b.h - pc), Math.abs(b.l - pc));
  });
  return mean(trs.slice(-n));
}

// Drop the in-progress weekly bar so signals only use closed weeks.
export function closedWeeks(bars, now = Date.now()) {
  if (!bars.length) return bars;
  const lastBar = last(bars);
  return now - lastBar.t < 7 * 24 * 3600 * 1000 ? bars.slice(0, -1) : bars;
}

// Align two bar series by calendar date (UTC day).
export function alignByDay(a, b) {
  const key = t => new Date(t).toISOString().slice(0, 10);
  const mb = new Map(b.map(x => [key(x.t), x]));
  return a.filter(x => mb.has(key(x.t))).map(x => [x, mb.get(key(x.t))]);
}

export function monthsBetween(fromISO, to = new Date()) {
  const from = new Date(fromISO);
  return (to - from) / (1000 * 3600 * 24 * 30.4375);
}
