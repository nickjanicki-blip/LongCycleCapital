'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import PageHero from '@/components/PageHero';
import { useAuth } from '@/lib/AuthContext';

const C = {
  navy: '#1F4E78', gold: '#B8860B', bg: '#FAF9F6', subtle: '#F2F0EB', text: '#2C3E50', muted: '#7F8C8D',
  border: 'rgba(44,62,80,0.10)', green: '#27AE60', amber: '#D4AC0D', orange: '#CA6F1E', red: '#C0392B',
};
const F = { serif: "Georgia,'Times New Roman',serif", sans: 'Arial,Helvetica,sans-serif', mono: "'Courier New',monospace" };
const STATUS_COLOR = {
  READY: C.green, ACCUMULATE: C.green, ARMED: C.green, APPROACHING: C.orange, DISTRIBUTE: C.orange,
  WATCH: C.amber, HOLD: C.amber, ACTIVE: C.navy, PAUSED: C.red, ERROR: C.red, DISCRETIONARY: C.muted,
};
const REGIMES = ['Recovery', 'Expansion', 'Late Cycle', 'Contraction', 'Crisis'];
const TABS = ['Brief', 'FX Tier 1', 'Gold-Silver', 'Bitcoin', 'Recession', 'Journal'];

const Badge = ({ s }) => {
  const col = STATUS_COLOR[s] || C.muted;
  return <span style={{ fontFamily: F.sans, fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: col, background: `${col}18`, padding: '4px 9px', borderRadius: 2, whiteSpace: 'nowrap' }}>{s}</span>;
};
const Label = ({ children, gold }) => (
  <div style={{ fontFamily: F.sans, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: gold ? C.gold : C.muted, marginBottom: 10 }}>{children}</div>
);
const Card = ({ title, right, accent, children }) => (
  <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderTop: `3px solid ${accent || C.navy}`, borderRadius: 3, padding: 20, marginBottom: 16, minWidth: 0 }}>
    {(title || right) && (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ fontFamily: F.sans, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.text }}>{title}</div>
        {right}
      </div>
    )}
    {children}
  </div>
);
const Row = ({ k, v, mono = true }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '7px 0', borderBottom: `1px solid ${C.border}`, fontFamily: F.sans, fontSize: 13 }}>
    <span style={{ color: C.muted }}>{k}</span>
    <span style={{ fontFamily: mono ? F.mono : F.sans, color: C.text, textAlign: 'right' }}>{v ?? 'n/a'}</span>
  </div>
);
const Dot = ({ on }) => <span style={{ width: 9, height: 9, borderRadius: '50%', background: on ? C.green : 'rgba(44,62,80,0.18)', display: 'inline-block', flexShrink: 0, marginTop: 4 }} />;
const Layer = ({ n, label, met, detail, manual }) => (
  <div style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: `1px solid ${C.border}` }}>
    <Dot on={met} />
    <div style={{ minWidth: 0 }}>
      <div style={{ fontFamily: F.sans, fontSize: 13, fontWeight: 700, color: C.text }}>
        <span style={{ fontFamily: F.mono, color: C.gold, marginRight: 6 }}>{n}</span>{label}{manual && <span style={{ color: C.muted, fontWeight: 400 }}> · manual</span>}
      </div>
      <div style={{ fontFamily: F.sans, fontSize: 12, color: C.muted, marginTop: 3, lineHeight: 1.55 }}>{detail}</div>
    </div>
  </div>
);
const btn = (primary) => ({
  fontFamily: F.sans, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer',
  padding: '8px 14px', borderRadius: 2, border: primary ? 'none' : `1px solid ${C.border}`, background: primary ? C.navy : '#fff', color: primary ? C.bg : C.text,
});
const input = { fontFamily: F.sans, fontSize: 13, padding: '8px 10px', border: '1px solid rgba(44,62,80,0.18)', borderRadius: 2, color: C.text, background: '#fff', width: '100%' };
const fmt = iso => (iso ? new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'never');

async function post(url, body, method = 'POST') {
  const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || `HTTP ${r.status}`);
  return r.json();
}

/* ── Tabs ─────────────────────────────────────────────── */
function BriefTab({ s, isOwner, inputs, saveInputs }) {
  const b = s.brief;
  const r = s.regime;
  return (
    <>
      <div style={{ background: C.navy, borderRadius: 3, padding: '20px 22px', marginBottom: 16, color: C.bg }}>
        <Label gold>Regime · Compass</Label>
        <div style={{ fontFamily: F.serif, fontSize: 28, marginBottom: 6 }}>{b.headline}</div>
        <div style={{ fontFamily: F.sans, fontSize: 14, color: 'rgba(250,249,246,0.75)', lineHeight: 1.6 }}>{b.recommendation}</div>
        <div style={{ fontFamily: F.mono, fontSize: 11, color: 'rgba(250,249,246,0.45)', marginTop: 10 }}>
          FX risk {r.adjustments.fx.risk}% / {r.adjustments.fx.fat}% fat pitch · VIX {s.vix?.toFixed(1)} · ISM {s.ismAsOf || 'n/a'}
        </div>
      </div>

      <Card title="On watch" accent={C.gold}>
        {b.watch.length === 0 && <div style={{ fontFamily: F.sans, fontSize: 13, color: C.muted }}>Nothing is on watch.</div>}
        {b.watch.map(w => (
          <div key={w.name} style={{ padding: '10px 0', borderBottom: `1px solid ${C.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
              <span style={{ fontFamily: F.sans, fontSize: 13, fontWeight: 700, color: C.text }}>{w.name}</span><Badge s={w.status} />
            </div>
            <div style={{ fontFamily: F.sans, fontSize: 12.5, color: C.muted, marginTop: 4, lineHeight: 1.55 }}>{w.line}</div>
          </div>
        ))}
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16 }}>
        <Card title="Developing">
          {(b.developing || []).length === 0 ? <div style={{ fontFamily: F.sans, fontSize: 13, color: C.muted }}>No near-misses.</div>
            : <ul style={{ margin: 0, paddingLeft: 18, fontFamily: F.sans, fontSize: 12.5, color: C.text, lineHeight: 1.7 }}>{b.developing.map(d => <li key={d}>{d}</li>)}</ul>}
        </Card>
        <Card title="Standing positions">
          {(b.positions || []).length === 0 ? <div style={{ fontFamily: F.sans, fontSize: 13, color: C.muted }}>None.</div>
            : b.positions.map(p => <div key={p.name} style={{ fontFamily: F.sans, fontSize: 12.5, padding: '6px 0' }}><b>{p.name}</b><div style={{ color: C.muted }}>{p.line}</div></div>)}
        </Card>
        <Card title="Changes since last run">
          {b.changes.length === 0 ? <div style={{ fontFamily: F.sans, fontSize: 13, color: C.muted }}>No status changes.</div>
            : b.changes.map(c => <Row key={c.name} k={c.name} v={`${c.from} → ${c.to}`} />)}
        </Card>
        {b.todo.length > 0 && (
          <Card title="Needs your input" accent={C.orange}>
            <ul style={{ margin: 0, paddingLeft: 18, fontFamily: F.sans, fontSize: 12.5, color: C.text, lineHeight: 1.7 }}>{b.todo.map(t => <li key={t}>{t}</li>)}</ul>
          </Card>
        )}
      </div>

      {isOwner && (
        <Card title="Settings">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16 }}>
            <div>
              <Label>Regime override</Label>
              <select style={input} value={inputs.regimeOverride || ''} onChange={e => saveInputs({ regimeOverride: e.target.value || null })}>
                <option value="">Auto (Compass: {r.auto})</option>
                {REGIMES.map(x => <option key={x}>{x}</option>)}
              </select>
            </div>
            <div>
              <Label>Trading equity ($, for FX sizing)</Label>
              <input style={input} type="number" defaultValue={inputs.equity || 500000} onBlur={e => saveInputs({ equity: e.target.value })} />
            </div>
          </div>
        </Card>
      )}
      {s.errors?.length > 0 && (
        <Card title="Data warnings" accent={C.red}>
          {s.errors.map(e => <div key={e} style={{ fontFamily: F.mono, fontSize: 11, color: C.red, padding: '3px 0' }}>{e}</div>)}
        </Card>
      )}
    </>
  );
}

function FxTab({ fx, isOwner, inputs, saveInputs }) {
  if (!fx) return <Card title="FX unavailable">Data failed this run.</Card>;
  const g = inputs?.fxGuidance || {};
  return (
    <>
      <div style={{ fontFamily: F.sans, fontSize: 12.5, color: C.muted, marginBottom: 14 }}>
        Risk {fx.riskPct}% standard / {fx.fatPct}% fat pitch. {fx.regimeNote} Layer 1: policy-rate gap at a 24-month extreme and not narrowing for 6 months, plus your guidance confirmation. Direction always fades the crowded side of CFTC positioning.
      </div>
      {fx.pairs.map(p => (
        <Card key={p.pair} title={p.pair} right={<Badge s={p.status} />} accent={STATUS_COLOR[p.status] || C.navy}>
          {p.error ? <div style={{ fontFamily: F.mono, fontSize: 12, color: C.red }}>{p.error}</div> : (
            <>
              {p.pauseReason && <div style={{ fontFamily: F.sans, fontSize: 12.5, color: C.red, marginBottom: 8 }}>{p.pauseReason}</div>}
              <Layer n="L1" label="Central bank divergence" met={p.l1.met}
                detail={`${p.l1.baseBank} ${p.l1.baseRate}% (${p.l1.tb}) vs ${p.l1.quoteBank} ${p.l1.quoteRate}% (${p.l1.tq}) as of ${p.l1.asOf}. Gap ${p.l1.gap}pt vs 24-month max ${p.l1.max24}pt: ${p.l1.atExtreme ? 'at extreme' : 'not at extreme'}, ${p.l1.established ? 'held 6+ months' : 'not established or narrowing'}.`} />
              <Layer n="L2" label="CFTC positioning extreme" met={p.l2.met}
                detail={`Z ${p.l2.z} vs 3-year history, ${p.l2.weeks} week(s) beyond ±2${p.l2.crowded ? `, crowded ${p.l2.crowded} → trade ${p.direction}` : ''}${p.fatPitchQuant ? ' · fat pitch eligible on the numbers' : ''}. Report ${p.l2.asOf}.`} />
              <Layer n="L3" label="Weekly technical trigger" met={p.l3.met}
                detail={p.l3.triggers.length ? p.l3.triggers.map(t => `${t.name} (${t.dir})`).join('; ') : 'No trigger on the last closed weekly bar.'} />
              {p.missing.length > 0 && <div style={{ fontFamily: F.sans, fontSize: 12, color: C.muted, marginTop: 10 }}>Missing: {p.missing.join('; ')}.</div>}
              {p.plan && (
                <div style={{ background: C.subtle, padding: 12, marginTop: 12, borderRadius: 2 }}>
                  <Label gold>Trade plan ({p.plan.direction})</Label>
                  <Row k="Entry reference" v={p.plan.entryRef} /><Row k="Stop (1.5x weekly ATR)" v={p.plan.stop} />
                  <Row k="2R / 4R" v={`${p.plan.target2R} / ${p.plan.target4R}`} />
                  <Row k="Risk" v={`${p.plan.riskPct}% = $${p.plan.riskDollars.toLocaleString()}`} /><Row k="Units" v={p.plan.units.toLocaleString()} />
                  <div style={{ fontFamily: F.sans, fontSize: 11.5, color: C.muted, marginTop: 8 }}>{p.plan.notes}</div>
                </div>
              )}
              {isOwner && (
                <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12, fontFamily: F.sans, fontSize: 12.5, color: C.text, cursor: 'pointer' }}>
                  <input type="checkbox" checked={Boolean(g[p.pair])} onChange={e => saveInputs({ fxGuidance: { [p.pair]: e.target.checked } })} />
                  Forward guidance confirms continuation 3+ months
                </label>
              )}
            </>
          )}
        </Card>
      ))}
    </>
  );
}

function GsrTab({ g, isOwner, inputs, saveInputs }) {
  const [story, setStory] = useState(inputs?.gsrMacroStory || '');
  if (!g) return <Card title="GSR unavailable">Data failed this run.</Card>;
  const pts = g.history || [];
  const vals = pts.map(p => p[1]);
  const lo = Math.min(40, ...vals), hi = Math.max(95, ...vals);
  const W = 600, H = 160;
  const x = i => (i / Math.max(1, pts.length - 1)) * W;
  const y = v => H - ((v - lo) / (hi - lo)) * H;
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p[1]).toFixed(1)}`).join(' ');
  return (
    <>
      <Card title="Gold-silver ratio" right={<Badge s={g.status} />} accent={C.gold}>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'baseline', marginBottom: 10 }}>
          <span style={{ fontFamily: F.serif, fontSize: 40, color: C.navy }}>{g.ratio}</span>
          <span style={{ fontFamily: F.sans, fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', color: C.muted }}>{g.zone}</span>
          <span style={{ fontFamily: F.mono, fontSize: 12, color: C.muted }}>Gold ${g.gold} · Silver ${g.silver}</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', minWidth: 320, height: 'auto', display: 'block' }} role="img" aria-label="Weekly gold-silver ratio, last two years">
            {[[80, C.orange], [60, C.amber], [90, C.red], [45, C.green]].map(([v, col]) => (
              <g key={v}><line x1="0" x2={W} y1={y(v)} y2={y(v)} stroke={col} strokeDasharray="4 4" strokeWidth="1" opacity="0.6" />
                <text x={W - 4} y={y(v) - 3} textAnchor="end" style={{ fontFamily: F.mono, fontSize: 10, fill: col }}>{v}</text></g>
            ))}
            <path d={path} fill="none" stroke={C.navy} strokeWidth="1.8" />
          </svg>
        </div>
        <div style={{ fontFamily: F.sans, fontSize: 11, color: C.muted, marginTop: 4 }}>Weekly closes, last 2 years. Zones: above 80 long silver/short gold, below 60 long gold/short silver.</div>
        <div style={{ fontFamily: F.sans, fontSize: 13, color: C.text, marginTop: 12 }}>{g.watchNote}</div>
        <div style={{ fontFamily: F.sans, fontSize: 12.5, color: C.muted, marginTop: 4 }}>{g.biasNote}</div>
      </Card>
      <Card title="Entry layers (all four, same week)">
        <Layer n="L1" label="Ratio in zone, |Z| ≥ 1.5" met={g.layers.l1.met} detail={g.layers.l1.detail} />
        <Layer n="L2" label="Duration in zone" met={g.layers.l2.met} detail={g.layers.l2.detail} />
        <Layer n="L3" label="Reversion confirmed" met={g.layers.l3.met} detail={g.layers.l3.detail} />
        <Layer n="L4" label="Macro story" met={g.layers.l4.met} manual detail={g.layers.l4.detail} />
        <Row k="5y mean / Z" v={`${g.mean5} / ${g.z5}`} /><Row k="10y Z (fat pitch needs ±2.5 and ratio >100 or <30)" v={g.z10} />
        {isOwner && (
          <div style={{ marginTop: 14 }}>
            <Label>Layer 4 macro story</Label>
            <textarea style={{ ...input, minHeight: 80 }} value={story} onChange={e => setStory(e.target.value)} placeholder="Specific macro reason the ratio should revert (industrial demand, easing cycle...)" />
            <button style={{ ...btn(true), marginTop: 8 }} onClick={() => saveInputs({ gsrMacroStory: story })}>Save story</button>
          </div>
        )}
      </Card>
      {g.plan && (
        <Card title="Trade plan">
          <Row k="Action" v={g.plan.action} mono={false} /><Row k="Risk" v={`${g.plan.riskPct}%`} /><Row k="Stop (ratio)" v={g.plan.stopRatio} />
          <ul style={{ fontFamily: F.sans, fontSize: 12.5, color: C.text, lineHeight: 1.7, paddingLeft: 18, marginTop: 8 }}>{g.plan.exits.map(e => <li key={e}>{e}</li>)}</ul>
        </Card>
      )}
    </>
  );
}

function BtcTab({ b }) {
  if (!b) return <Card title="Bitcoin unavailable">Data failed this run.</Card>;
  return (
    <>
      <Card title="Bitcoin cycle" right={<Badge s={b.status} />} accent="#F7931A">
        <div style={{ fontFamily: F.serif, fontSize: 36, color: C.navy, marginBottom: 6 }}>${b.price.toLocaleString()}</div>
        <div style={{ fontFamily: F.sans, fontSize: 13.5, color: C.text, lineHeight: 1.6, marginBottom: 10 }}>{b.action}</div>
        <Row k="Months since halving (Apr 19, 2024)" v={b.months} />
        <Row k="Time-based phase (dashboard)" v={`P${b.timePhase.phase} ${b.timePhase.name}`} mono={false} />
        <Row k="200-week MA" v={b.ma200w ? `$${b.ma200w.toLocaleString()}` : 'n/a'} />
        <Row k="Cycle peak" v={`$${b.peak.toLocaleString()} (${b.peakDate}), down ${b.drawdownPct}%`} />
        <Row k="MVRV / MVRV-Z" v={`${b.mvrv} / ${b.mvrvZ} (CoinMetrics ${b.cmDate})`} />
        <Row k="Puell Multiple" v={b.puell} />
        <Row k="Pi Cycle (111DMA ÷ 2x350DMA, top at 1.0)" v={b.piGap} />
        <div style={{ fontFamily: F.sans, fontSize: 12, color: C.muted, marginTop: 10 }}>Regime overlay: {b.regimeNote}</div>
      </Card>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16 }}>
        <Card title={`Accumulation (${b.accumCount}/5, need 3)`}>
          {b.accum.map(a => <Layer key={a.name} n="" label={a.name} met={a.met} detail={String(a.value)} />)}
        </Card>
        <Card title={`Distribution signals (${b.distCount})`}>
          {b.distribution.map(d => <Layer key={d.name} n="" label={d.name} met={d.met} detail={d.met ? 'Triggered' : 'Not triggered'} />)}
        </Card>
      </div>
      <Card title="Tranche plan (20% each of the 10% sleeve)">
        {b.tranches.map(t => <Layer key={t.n} n={`T${t.n}`} label={t.trigger} met={Boolean(t.hit)} detail={t.hit == null ? 'Tracked after tranche 1 fills' : t.hit ? 'Condition met' : 'Not yet'} />)}
      </Card>
    </>
  );
}

function RecessionTab({ r, isOwner, inputs, saveInputs }) {
  if (!r) return <Card title="Recession data unavailable">Data failed this run.</Card>;
  const man = inputs?.recessionManual || {};
  const tier = (title, items, lead) => (
    <Card title={`${title} · ${items.filter(i => i.met).length}/${items.length}`} accent={C.navy}>
      <div style={{ fontFamily: F.sans, fontSize: 11.5, color: C.muted, marginBottom: 6 }}>{lead}</div>
      {items.map(i => (
        <div key={i.id} style={{ display: 'flex', gap: 10, padding: '9px 0', borderBottom: `1px solid ${C.border}` }}>
          <Dot on={i.met} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: F.sans, fontSize: 13, color: C.text }}>{i.label}</div>
            <div style={{ fontFamily: F.mono, fontSize: 11, color: C.muted, marginTop: 2 }}>{i.value}</div>
          </div>
          {!i.auto && isOwner && <input type="checkbox" aria-label={i.label} checked={Boolean(man[i.id])} onChange={e => saveInputs({ recessionManual: { [i.id]: e.target.checked } })} />}
        </div>
      ))}
    </Card>
  );
  return (
    <>
      <Card title="Crisis trades" accent={C.red}>
        {r.crisisTrades.map(t => (
          <div key={t.name} style={{ padding: '10px 0', borderBottom: `1px solid ${C.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}><b style={{ fontFamily: F.sans, fontSize: 13 }}>{t.name}</b><Badge s={t.status} /></div>
            <div style={{ fontFamily: F.sans, fontSize: 12, color: C.muted, marginTop: 3 }}>{t.why}</div>
          </div>
        ))}
      </Card>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16 }}>
        {tier('Tier 1', r.tier1, '6-24 month lead')}
        {tier('Tier 2', r.tier2, '3-12 month lead')}
        {tier('Tier 3', r.tier3, '0-3 month lead')}
      </div>
    </>
  );
}

const EMPTY_TRADE = { date: new Date().toISOString().slice(0, 10), strategy: 'FX Tier 1', pair: '', direction: 'Long', entry: '', stop: '', target: '', exit: '', riskPct: '', status: 'Open', notes: '' };

function JournalTab() {
  const [trades, setTrades] = useState(null);
  const [form, setForm] = useState(EMPTY_TRADE);
  const [err, setErr] = useState('');
  useEffect(() => { fetch('/api/dashboard/journal').then(r => r.json()).then(d => setTrades(d.trades || [])).catch(() => setErr('Could not load journal')); }, []);
  const save = async () => {
    try { setTrades((await post('/api/dashboard/journal', form)).trades); setForm(EMPTY_TRADE); setErr(''); } catch (e) { setErr(e.message); }
  };
  const del = async id => { try { setTrades((await post(`/api/dashboard/journal?id=${id}`, null, 'DELETE')).trades); } catch (e) { setErr(e.message); } };
  const f = k => ({ value: form[k], onChange: e => setForm({ ...form, [k]: e.target.value }), style: input });
  return (
    <>
      <Card title={form.id ? 'Edit trade' : 'Log a trade'}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 10 }}>
          <input type="date" {...f('date')} />
          <select {...f('strategy')}>{['FX Tier 1', 'Gold-Silver', 'Bitcoin', 'Recession'].map(x => <option key={x}>{x}</option>)}</select>
          <input placeholder="Instrument / pair" {...f('pair')} />
          <select {...f('direction')}>{['Long', 'Short'].map(x => <option key={x}>{x}</option>)}</select>
          <input placeholder="Entry" {...f('entry')} /><input placeholder="Stop" {...f('stop')} />
          <input placeholder="Target" {...f('target')} /><input placeholder="Exit" {...f('exit')} />
          <input placeholder="Risk %" {...f('riskPct')} />
          <select {...f('status')}>{['Open', 'Closed — Win', 'Closed — Loss', 'Stopped Out'].map(x => <option key={x}>{x}</option>)}</select>
        </div>
        <textarea placeholder="Notes" {...f('notes')} style={{ ...input, marginTop: 10, minHeight: 60 }} />
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button style={btn(true)} onClick={save}>{form.id ? 'Update' : 'Add trade'}</button>
          {form.id && <button style={btn(false)} onClick={() => setForm(EMPTY_TRADE)}>Cancel</button>}
        </div>
        {err && <div style={{ fontFamily: F.sans, fontSize: 12, color: C.red, marginTop: 8 }}>{err}</div>}
      </Card>
      <Card title={`Trades (${trades?.length ?? 0})`}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: F.sans, fontSize: 12.5, minWidth: 640 }}>
            <thead><tr>{['Date', 'Strategy', 'Instrument', 'Dir', 'Entry', 'Stop', 'Exit', 'R', 'Status', ''].map(h => <th key={h} style={{ textAlign: 'left', padding: '8px 8px 8px 0', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.muted, borderBottom: `2px solid ${C.border}` }}>{h}</th>)}</tr></thead>
            <tbody>
              {(trades || []).map(t => {
                const e = Number(t.entry), s = Number(t.stop), x = Number(t.exit);
                const rMult = e && s && x && e !== s ? ((x - e) / Math.abs(e - s)) * (t.direction === 'Short' ? -1 : 1) : null;
                return (
                  <tr key={t.id}>
                    {[t.date, t.strategy, t.pair, t.direction, t.entry, t.stop, t.exit].map((v, i) => <td key={i} style={{ padding: '8px 8px 8px 0', borderBottom: `1px solid ${C.border}`, fontFamily: i >= 4 ? F.mono : F.sans }}>{v}</td>)}
                    <td style={{ padding: '8px 8px 8px 0', borderBottom: `1px solid ${C.border}`, fontFamily: F.mono, color: rMult == null ? C.muted : rMult >= 0 ? C.green : C.red }}>{rMult == null ? '' : rMult.toFixed(2)}</td>
                    <td style={{ padding: '8px 8px 8px 0', borderBottom: `1px solid ${C.border}` }}>{t.status}</td>
                    <td style={{ padding: '8px 0', borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap' }}>
                      <button style={{ ...btn(false), padding: '4px 8px' }} onClick={() => setForm(t)}>Edit</button>{' '}
                      <button style={{ ...btn(false), padding: '4px 8px', color: C.red }} onClick={() => del(t.id)}>Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

/* ── Page ─────────────────────────────────────────────── */
export default function DashboardPage() {
  const { isAuthenticated } = useAuth();
  const [data, setData] = useState(null);
  const [state, setState] = useState('loading');
  const [tab, setTab] = useState('Brief');
  const [running, setRunning] = useState(false);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    const r = await fetch('/api/dashboard', { cache: 'no-store' });
    if (r.status === 401) return setState('auth');
    if (!r.ok) return setState('error');
    setData(await r.json());
    setState('ok');
  }, []);
  useEffect(() => { load(); }, [load]);

  const saveInputs = async patch => {
    try { const { inputs } = await post('/api/dashboard/inputs', patch); setData(d => ({ ...d, inputs })); setMsg('Saved. Run now to apply.'); }
    catch (e) { setMsg(e.message); }
  };
  const runNow = async () => {
    setRunning(true); setMsg('');
    try { const r = await fetch('/api/dashboard/run', { cache: 'no-store' }).then(x => x.json()); await load(); setMsg(r.ok ? `Updated · ${r.changes} change(s)` : r.error || 'Run failed'); }
    catch { setMsg('Run failed'); }
    setRunning(false);
  };

  const s = data?.snapshot;
  const tabs = data?.isOwner ? TABS : TABS.filter(t => t !== 'Journal');

  return (
    <div>
      <PageHero eyebrow="Trading Dashboard" title="Signals, not predictions." subtitle="Daily read of the four playbooks against live data. The engine flags setups; every trade is a manual decision." />
      <section style={{ background: C.bg, padding: 'clamp(28px,4vw,48px) 0' }}>
        <div className="page-max" style={{ padding: '0 clamp(16px,5vw,40px)' }}>
          {state === 'loading' && <div style={{ fontFamily: F.sans, color: C.muted }}>Loading…</div>}
          {state === 'error' && <div style={{ fontFamily: F.sans, color: C.red }}>Could not load the dashboard.</div>}
          {state === 'auth' && (
            <Card title="Observer access required">
              <p style={{ fontFamily: F.sans, fontSize: 14, color: C.text, lineHeight: 1.6 }}>
                {isAuthenticated ? 'Your session needs a refresh. Log in again to open the dashboard.' : 'The trading dashboard is available to Observers.'}
              </p>
              <Link href="/login" style={{ ...btn(true), display: 'inline-block', textDecoration: 'none', marginTop: 8 }}>Log in</Link>
            </Card>
          )}
          {state === 'ok' && !s && (
            <Card title="No run yet">
              <p style={{ fontFamily: F.sans, fontSize: 14 }}>The engine hasn't run yet.</p>
              {data.isOwner && <button style={btn(true)} onClick={runNow} disabled={running}>{running ? 'Running…' : 'Run now'}</button>}
            </Card>
          )}
          {state === 'ok' && s && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {tabs.map(t => (
                    <button key={t} onClick={() => setTab(t)} style={{ ...btn(tab === t), background: tab === t ? C.navy : 'transparent' }}>{t}</button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', fontFamily: F.mono, fontSize: 11, color: C.muted }}>
                  <span>Last run {fmt(s.runAt)}</span>
                  {data.isOwner && <button style={btn(false)} onClick={runNow} disabled={running}>{running ? 'Running…' : 'Run now'}</button>}
                </div>
              </div>
              {msg && <div style={{ fontFamily: F.sans, fontSize: 12, color: C.navy, marginBottom: 10 }}>{msg}</div>}
              {tab === 'Brief' && <BriefTab s={s} isOwner={data.isOwner} inputs={data.inputs || {}} saveInputs={saveInputs} />}
              {tab === 'FX Tier 1' && <FxTab fx={s.fx} isOwner={data.isOwner} inputs={data.inputs} saveInputs={saveInputs} />}
              {tab === 'Gold-Silver' && <GsrTab g={s.gsr} isOwner={data.isOwner} inputs={data.inputs} saveInputs={saveInputs} />}
              {tab === 'Bitcoin' && <BtcTab b={s.btc} />}
              {tab === 'Recession' && <RecessionTab r={s.recession} isOwner={data.isOwner} inputs={data.inputs} saveInputs={saveInputs} />}
              {tab === 'Journal' && data.isOwner && <JournalTab />}
              <div style={{ fontFamily: F.sans, fontSize: 11, color: C.muted, marginTop: 24, lineHeight: 1.6 }}>
                Signals are computed from public data (FRED, BIS, CFTC, Yahoo Finance, CoinMetrics) against the LCC playbooks. Not investment advice.
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
