'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { INDICATOR_DATA } from '@/lib/indicatorData';

const C = {
  navy: '#1F4E78', gold: '#B8860B',
  bg: '#FAF9F6', bgSubtle: '#F2F0EB', text: '#2C3E50', muted: '#7F8C8D',
  border: 'rgba(44,62,80,0.10)',
  green: '#27AE60', greenLight: '#58D68D',
  amber: '#D4AC0D', orange: '#CA6F1E', red: '#C0392B',
};

/* ── SVG Gauge ─────────────────────────────────────────────── */
function CycleDial({ needleAngle = 90, confidence = 0.82 }) {
  const cx = 250, cy = 256, R = 178, ri = 122;
  const rad = (a) => a * Math.PI / 180;
  const ox = (a) => cx + R * Math.cos(rad(a));
  const oy = (a) => cy - R * Math.sin(rad(a));
  const ix = (a) => cx + ri * Math.cos(rad(a));
  const iy = (a) => cy - ri * Math.sin(rad(a));

  const seg = (a1, a2) => {
    const large = a1 - a2 > 180 ? 1 : 0;
    return [
      `M ${ox(a1).toFixed(1)} ${oy(a1).toFixed(1)}`,
      `A ${R} ${R} 0 ${large} 1 ${ox(a2).toFixed(1)} ${oy(a2).toFixed(1)}`,
      `L ${ix(a2).toFixed(1)} ${iy(a2).toFixed(1)}`,
      `A ${ri} ${ri} 0 ${large} 0 ${ix(a1).toFixed(1)} ${iy(a1).toFixed(1)} Z`,
    ].join(' ');
  };

  const phases = [
    { a1: 180, a2: 144, color: C.green,      label: 'RECOVERY' },
    { a1: 144, a2: 108, color: C.greenLight,  label: 'EXPANSION' },
    { a1: 108, a2: 72,  color: C.amber,       label: 'LATE CYCLE' },
    { a1: 72,  a2: 36,  color: C.orange,      label: 'CONTRACTION' },
    { a1: 36,  a2: 0,   color: C.red,         label: 'CRISIS' },
  ];

  const nLen = 162;
  const nx = (cx + nLen * Math.cos(rad(needleAngle))).toFixed(1);
  const ny = (cy - nLen * Math.sin(rad(needleAngle))).toFixed(1);
  const labelR = 206;
  const labelPos = (a) => ({ x: cx + labelR * Math.cos(rad(a)), y: cy - labelR * Math.sin(rad(a)) });
  const anchor = (pos) => pos.x < cx - 14 ? 'end' : pos.x > cx + 14 ? 'start' : 'middle';

  // Cone of uncertainty: wider when confidence is low, vanishes near 1.0
  const halfWidth = (1 - confidence) * 42;
  const wHi = Math.min(180, needleAngle + halfWidth);
  const wLo = Math.max(0, needleAngle - halfWidth);
  const wedge = [
    `M ${cx} ${cy}`,
    `L ${(cx + nLen * Math.cos(rad(wHi))).toFixed(1)} ${(cy - nLen * Math.sin(rad(wHi))).toFixed(1)}`,
    `A ${nLen} ${nLen} 0 0 1 ${(cx + nLen * Math.cos(rad(wLo))).toFixed(1)} ${(cy - nLen * Math.sin(rad(wLo))).toFixed(1)}`,
    'Z',
  ].join(' ');

  return (
    <svg viewBox="0 0 500 272" width="100%" style={{ maxWidth: 480, display: 'block', margin: '0 auto' }}>
      {phases.map(({ a1, a2, color, label }, i) => {
        const mid = (a1 + a2) / 2;
        const lp = labelPos(mid);
        return (
          <g key={i}>
            <path d={seg(a1, a2)} fill={color} stroke="white" strokeWidth="2.5" />
            <text x={lp.x.toFixed(1)} y={lp.y.toFixed(1)} textAnchor={anchor(lp)}
              style={{ fontFamily: 'Arial,Helvetica,sans-serif', fontSize: 9, fontWeight: 700, fill: '#2C3E50', letterSpacing: '0.04em' }}>
              {label}
            </text>
          </g>
        );
      })}
      {/* Cone of uncertainty — width reflects (1 − confidence) */}
      <path d={wedge} fill={C.navy} opacity={0.12} />
      <circle cx={(cx + (R + 8) * Math.cos(rad(needleAngle))).toFixed(1)} cy={(cy - (R + 8) * Math.sin(rad(needleAngle))).toFixed(1)} r="4" fill={C.navy} />
      <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={C.navy} strokeWidth="2.5" strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={(cx - 28 * Math.cos(rad(needleAngle))).toFixed(1)} y2={(cy + 28 * Math.sin(rad(needleAngle))).toFixed(1)} stroke={C.navy} strokeWidth="2" strokeLinecap="round" opacity="0.3" />
      <circle cx={cx} cy={cy} r={11} fill={C.navy} />
      <circle cx={cx} cy={cy} r={5} fill={C.bg} />
      <text x={cx} y={cy + 30} textAnchor="middle" style={{ fontFamily: "Georgia,'Times New Roman',serif", fontSize: 11, fontStyle: 'italic', fill: C.muted }}>
        Long Cycle Compass
      </text>
    </svg>
  );
}

/* ── Phase Narrative ─────────────────────────────────────── */
const phaseData = [
  { name: 'Recovery',    color: C.green,      current: false, what: 'GDP has bottomed, unemployment is peaking, credit beginning to loosen. Central banks are accommodative. Asset prices often still depressed.', why: 'The best risk-adjusted entry points in any cycle. Feels terrible — the prior crisis is still fresh — but this is when the longest-duration assets offer the highest expected returns.', positioning: 'Accumulate. Maximum duration. Highest conviction sizing.' },
  { name: 'Expansion',   color: C.greenLight, current: false, what: 'Growth accelerating, earnings rising, credit readily available, volatility low. The economy feels good. Most investors are fully invested and optimistic.', why: 'This is when risk quietly builds. Valuations stretch, leverage increases across the system, and complacency peaks. The best expansions plant the seeds of the next crisis.', positioning: 'Ride momentum — but tighten stops and begin reducing duration. Know your exit before you need it.' },
  { name: 'Late Cycle',  color: C.amber,      current: false, what: 'Growth still positive but decelerating. Yield curve flattening or inverted. Credit spreads widening. Labor market at peak. Leading indicators turning.', why: 'The clock is visible. This phase tends to be shorter than investors expect and ends faster than almost anyone anticipates. Positioning decisions made here matter enormously.', positioning: "Reduce risk. Preserve capital. Identify the crisis opportunities you'll want to execute when the time comes." },
  { name: 'Contraction', color: C.orange,     current: false, what: 'GDP contracting, earnings declining, credit tightening sharply, unemployment rising. Asset prices falling across the board. Correlations approach 1.', why: 'When the damage from Late Cycle overleveraging becomes visible. Also when seeds of the next Recovery are planted — in forced selling and abandoned assets.', positioning: 'Capital preservation first. Begin identifying specific assets for Crisis accumulation. Patience, not action.' },
  { name: 'Crisis',      color: C.red,        current: false, what: 'Acute stress — liquidity freezing, forced selling across all asset classes, systemic fear. Every asset looks like a liability. Correlations go to 1.', why: 'The opportunity of a generation if you have dry powder and the psychological constitution to act. Every major wealth-building opportunity in history came from someone willing to buy when no one else would.', positioning: 'Execute the accumulation playbook. This is what all the patience was for.' },
];

function PhaseCard({ name, color, current, what, why, positioning }) {
  return (
    <div style={{ background: current ? C.navy : C.bg, padding: 'clamp(20px,3vw,28px) clamp(16px,2.5vw,22px)', borderTop: `3px solid ${color}`, display: 'flex', flexDirection: 'column', gap: 14, height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'Arial', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color }}>{name}</span>
        {current && <span style={{ fontFamily: 'Arial', fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', background: color, color: '#fff', padding: '2px 7px', borderRadius: 2 }}>Current</span>}
      </div>
      <p className="t-sm" style={{ fontFamily: 'Arial', color: current ? 'rgba(250,249,246,0.65)' : C.muted, lineHeight: 1.7, textWrap: 'pretty' }}>{what}</p>
      <div style={{ borderTop: `1px solid ${current ? 'rgba(250,249,246,0.10)' : C.border}`, paddingTop: 14 }}>
        <div style={{ fontFamily: 'Arial', fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: current ? 'rgba(250,249,246,0.40)' : C.muted, marginBottom: 6 }}>Why it matters</div>
        <p className="t-sm" style={{ fontFamily: 'Arial', color: current ? 'rgba(250,249,246,0.65)' : C.muted, lineHeight: 1.7, textWrap: 'pretty' }}>{why}</p>
      </div>
      <div style={{ borderTop: `1px solid ${current ? 'rgba(250,249,246,0.10)' : C.border}`, paddingTop: 14, marginTop: 'auto' }}>
        <div style={{ fontFamily: 'Arial', fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color, marginBottom: 6 }}>Positioning</div>
        <p className="t-sm" style={{ fontFamily: 'Arial', fontStyle: 'italic', color: current ? 'rgba(250,249,246,0.80)' : C.text, lineHeight: 1.65 }}>{positioning}</p>
      </div>
    </div>
  );
}

function PhaseNarrative({ currentPhaseIdx = 2 }) {
  const N = phaseData.length;
  const currentIdx = currentPhaseIdx;
  // Inject current flag dynamically; build extended array for infinite loop
  const phasesWithCurrent = phaseData.map((p, i) => ({ ...p, current: i === currentIdx }));
  const extPhases = [phasesWithCurrent[N - 1], ...phasesWithCurrent, phasesWithCurrent[0]];
  const [activeIdx, setActiveIdx] = useState(currentIdx); // real index 0..N-1
  const trackRef = useRef(null);
  const timerRef = useRef(null);

  // Snap to the current regime on mount AND whenever it changes (e.g. after
  // live data loads and updates the regime from the default placeholder).
  useEffect(() => {
    const t = trackRef.current;
    if (t) t.scrollLeft = (currentIdx + 1) * t.offsetWidth;
    setActiveIdx(currentIdx);
  }, [currentIdx]);

  const handleScroll = () => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const t = trackRef.current;
      if (!t) return;
      const raw = Math.round(t.scrollLeft / t.offsetWidth);
      // Hit the leading Crisis-clone → silently teleport to real Crisis
      if (raw === 0) { t.scrollLeft = N * t.offsetWidth; setActiveIdx(N - 1); return; }
      // Hit the trailing Recovery-clone → silently teleport to real Recovery
      if (raw === N + 1) { t.scrollLeft = 1 * t.offsetWidth; setActiveIdx(0); return; }
      setActiveIdx(raw - 1);
    }, 100);
  };

  // Arrow buttons scroll one adjacent slot (wraps through the clone)
  const scrollAdj = (dir) => {
    const t = trackRef.current;
    if (!t) return;
    const cur = Math.round(t.scrollLeft / t.offsetWidth);
    t.scrollTo({ left: (cur + dir) * t.offsetWidth, behavior: 'smooth' });
  };

  // Dot buttons instant-jump to any real card
  const jumpTo = (realIdx) => {
    const t = trackRef.current;
    if (t) t.scrollLeft = (realIdx + 1) * t.offsetWidth;
    setActiveIdx(realIdx);
  };

  const prevIdx = (activeIdx - 1 + N) % N;
  const nextIdx = (activeIdx + 1) % N;

  return (
    <section className="section-pad" style={{ background: C.bg, borderTop: `1px solid ${C.border}` }}>
      <div className="page-max">
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontFamily: 'Arial', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.muted, marginBottom: 10 }}>The Five Phases</div>
          <h2 style={{ fontFamily: "Georgia,serif", fontSize: 'clamp(22px,2.5vw,30px)', fontWeight: 400, color: C.navy }}>What each regime means and why it matters</h2>
        </div>

        {/* Desktop: grid — unchanged */}
        <div className="phase-grid">
          {phasesWithCurrent.map(p => <PhaseCard key={p.name} {...p} />)}
        </div>

        {/* Mobile: native scroll-snap carousel with infinite loop via clones */}
        <div className="phase-carousel">
          <div ref={trackRef} className="phase-track" onScroll={handleScroll}>
            {extPhases.map((p, i) => (
              <div key={i} className="phase-slide">
                <PhaseCard {...p} />
              </div>
            ))}
          </div>

          {/* Phase-coloured dot indicators */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, padding: '18px 0 14px' }}>
            {phasesWithCurrent.map((p, i) => (
              <button key={i} onClick={() => jumpTo(i)} aria-label={p.name} style={{
                width: i === activeIdx ? 22 : 8, height: 8, borderRadius: 4,
                background: i === activeIdx ? p.color : 'rgba(44,62,80,0.15)',
                border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0,
                transition: 'width 220ms ease, background 220ms ease',
              }} />
            ))}
          </div>

          {/* Prev / Next — scrolls through the clone, wraps seamlessly */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
            <button onClick={() => scrollAdj(-1)} style={{ fontFamily: 'Arial', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: phaseData[prevIdx].color, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0' }}>
              <span style={{ fontSize: 16, lineHeight: 1 }}>←</span> {phaseData[prevIdx].name}
            </button>
            <button onClick={() => scrollAdj(1)} style={{ fontFamily: 'Arial', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: phaseData[nextIdx].color, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0' }}>
              {phaseData[nextIdx].name} <span style={{ fontSize: 16, lineHeight: 1 }}>→</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Indicator Drawer ─────────────────────────────────────── */
function IndicatorDrawer({ name, currentValue, currentStatus, isAuthenticated, onClose }) {
  const data = INDICATOR_DATA[name];
  if (!data) return null;
  const scl = { OK: C.green, CAUTION: C.amber, WARNING: C.orange, ALERT: C.red };
  const isTier2 = data.tier === 2;
  const showFull = !isTier2 || isAuthenticated;

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(31,78,120,0.22)', backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 'clamp(300px,36vw,400px)', background: C.bg, zIndex: 301, overflowY: 'auto', boxShadow: '-4px 0 32px rgba(31,78,120,0.14)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ background: C.navy, padding: '20px 22px', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1, paddingRight: 12 }}>
              <div style={{ fontFamily: 'Arial', fontSize: 9, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: isTier2 ? C.gold : 'rgba(250,249,246,0.50)', marginBottom: 8 }}>
                {isTier2 ? 'Tier 2 · Extended Dashboard' : 'Tier 1 · Public'}
              </div>
              <div style={{ fontFamily: "Georgia,serif", fontSize: 17, fontWeight: 400, color: '#FAF9F6', lineHeight: 1.3 }}>{name}</div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(250,249,246,0.55)', fontSize: 22, cursor: 'pointer', lineHeight: 1, paddingTop: 2 }}>×</button>
          </div>
          <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontFamily: "Georgia,serif", fontSize: 26, color: '#FAF9F6', fontWeight: 400 }}>{currentValue}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(250,249,246,0.08)', padding: '4px 10px', borderRadius: 2 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: scl[currentStatus], flexShrink: 0 }} />
              <span style={{ fontFamily: 'Arial', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', color: scl[currentStatus] }}>{currentStatus}</span>
            </span>
          </div>
        </div>

        <div style={{ padding: '22px', flex: 1, display: 'flex', flexDirection: 'column', gap: 22 }}>
          {showFull ? (
            <>
              <div>
                <div style={{ fontFamily: 'Arial', fontSize: 9, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: C.muted, marginBottom: 8 }}>What it measures</div>
                <p className="t-sm" style={{ fontFamily: 'Arial', color: C.text, lineHeight: 1.75, margin: 0 }}>{data.what}</p>
              </div>
              <div>
                <div style={{ fontFamily: 'Arial', fontSize: 9, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: C.muted, marginBottom: 8 }}>Why it matters</div>
                <p className="t-sm" style={{ fontFamily: 'Arial', color: C.text, lineHeight: 1.75, margin: 0 }}>{data.why}</p>
              </div>
              {data.weight && (
                <div style={{ background: '#F2F0EB', borderLeft: '3px solid ' + C.gold, padding: '12px 14px' }}>
                  <div style={{ fontFamily: 'Arial', fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.gold, marginBottom: 6 }}>Model Weight · {data.weight}</div>
                  {data.composite && <p className="t-sm" style={{ fontFamily: 'Arial', color: C.text, lineHeight: 1.7, margin: 0 }}>{data.composite}</p>}
                </div>
              )}
              <div>
                <div style={{ fontFamily: 'Arial', fontSize: 9, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: C.muted, marginBottom: 10 }}>Signal thresholds</div>
                {data.thresholds.map(([range, status, note], i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, padding: '8px 0', borderBottom: i < data.thresholds.length - 1 ? '1px solid ' + C.border : 'none', alignItems: 'flex-start' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: scl[status], flexShrink: 0, marginTop: 5 }} />
                    <div>
                      <span style={{ fontFamily: "'Courier New',monospace", fontSize: 11, color: C.navy, fontWeight: 700, marginRight: 8 }}>{range}</span>
                      <span style={{ fontFamily: 'Arial', fontSize: 12, color: C.muted }}>{note}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid ' + C.border }}>
                <div style={{ fontFamily: 'Arial', fontSize: 9, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: C.muted, marginBottom: 8 }}>Data source</div>
                <div style={{ fontFamily: 'Arial', fontSize: 12, color: C.muted, marginBottom: 6 }}>{data.source}{data.fredId ? ' · Series ' + data.fredId : ''}</div>
                {data.fredUrl && <a href={data.fredUrl} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'Arial', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: C.navy, textDecoration: 'underline', textUnderlineOffset: 2 }}>View source data →</a>}
                {isTier2 && data.fredId && (
                  <div style={{ marginTop: 10, fontFamily: "'Courier New',monospace", fontSize: 10, color: C.muted, background: '#F2F0EB', padding: '7px 10px', borderRadius: 2, wordBreak: 'break-all' }}>
                    {'FRED API: /fred/series/observations?series_id=' + data.fredId}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, textAlign: 'center' }}>
              <svg width="26" height="30" viewBox="0 0 32 36" style={{ marginBottom: 14 }}>
                <rect x="4" y="14" width="24" height="20" rx="3" fill={C.navy} />
                <path d="M 10 14 L 10 10 A 6 6 0 0 1 22 10 L 22 14" fill="none" stroke={C.navy} strokeWidth="2.5" strokeLinecap="round" />
                <rect x="13" y="20" width="6" height="7" rx="1" fill="#FAF9F6" opacity="0.7" />
              </svg>
              <div style={{ fontFamily: "Georgia,serif", fontSize: 17, color: C.navy, marginBottom: 10 }}>LP Access Required</div>
              <p className="t-sm" style={{ fontFamily: 'Arial', color: C.muted, lineHeight: 1.7, marginBottom: 16 }}>Model weighting, composite contribution, and signal thresholds are available to authenticated observers.</p>
              <div style={{ fontFamily: 'Arial', fontSize: 12, color: C.muted, fontStyle: 'italic', textAlign: 'left', background: '#F2F0EB', padding: '10px 14px', borderRadius: 2 }}>{data.what.slice(0, 100)}...</div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function IndicatorCard({ name, value, reading, status, onClick }) {
  const statusColor = { OK: C.green, CAUTION: C.amber, WARNING: C.orange, ALERT: C.red };
  const col = statusColor[status] || C.muted;
  return (
    <div onClick={onClick}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 12px rgba(31,78,120,0.10)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
      style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 3, padding: '18px 20px', cursor: 'pointer', transition: 'box-shadow 160ms' }}>
      <div style={{ fontFamily: 'Arial', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.muted, marginBottom: 10 }}>{name}</div>
      <div style={{ fontFamily: "Georgia,serif", fontSize: 22, fontWeight: 400, color: C.text, marginBottom: 6 }}>{value}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: col, display: 'inline-block', flexShrink: 0 }} />
        <span style={{ fontFamily: 'Arial', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', color: col }}>{status}</span>
        <span style={{ fontFamily: 'Arial', fontSize: 11, color: C.muted, marginLeft: 2 }}>— {reading}</span>
      </div>
    </div>
  );
}

const gatedRows = [
  ['Leading Indicator Index', '96.2', 'Declining 4 of 5 months', 'WARNING'],
  ['Conf. Board LEI YoY', '−3.1%', 'Negative 6 consecutive months', 'ALERT'],
  ['S&P 500 vs 200 DMA', '−1.8%', 'Below 200-day moving average', 'CAUTION'],
  ['High Yield Spreads', '4.2%', 'Elevated, trending wider', 'WARNING'],
  ['Fed Funds Rate', '5.25%', 'Holding — cuts not priced', 'CAUTION'],
  ['10yr TIPS Real Yield', '2.14%', 'Multi-year restrictive', 'WARNING'],
  ['Copper / Gold Ratio', '0.18', 'Falling — risk-off signal', 'WARNING'],
  ['USD DXY', '104.8', 'Approaching multi-year extreme', 'CAUTION'],
];

function GatedContent({ rows = gatedRows, onRowClick }) {
  const statusColor = { OK: C.green, CAUTION: C.amber, WARNING: C.orange, ALERT: C.red };
  return (
    <table className="t-sm" style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Arial' }}>
      <thead>
        <tr style={{ borderBottom: `2px solid ${C.border}` }}>
          {['Indicator', 'Reading', 'Context', 'Status'].map(h => (
            <th key={h} style={{ fontFamily: 'Arial', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.muted, textAlign: 'left', padding: '8px 12px 12px 0' }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map(([name, val, ctx, st], i) => (
          <tr key={i}
            onClick={() => onRowClick && onRowClick(name, val, st)}
            style={{ borderBottom: `1px solid ${C.border}`, cursor: onRowClick ? 'pointer' : 'default' }}
            onMouseEnter={e => { if (onRowClick) e.currentTarget.style.background = 'rgba(31,78,120,0.03)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = ''; }}>
            <td style={{ padding: '12px 12px 12px 0', color: C.text, fontWeight: 600 }}>{name}</td>
            <td style={{ padding: '12px 12px 12px 0', fontFamily: "Georgia,serif", color: C.navy }}>{val}</td>
            <td style={{ padding: '12px 12px 12px 0', color: C.muted, fontSize: 12 }}>{ctx}</td>
            <td style={{ padding: '12px 0' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor[st], flexShrink: 0 }} />
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', color: statusColor[st] }}>{st}</span>
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Hardcoded fallbacks shown until live data loads
const FALLBACK_T1 = [
  { name: 'Yield Curve (2Y–10Y)', value: '−0.14%', reading: 'Inverted',          status: 'WARNING' },
  { name: 'ISM Manufacturing PMI', value: '47.2',   reading: 'Contraction zone',  status: 'WARNING' },
  { name: 'Unemployment Claims',   value: '247k',   reading: 'Rising trend',      status: 'CAUTION' },
  { name: 'CPI Year-over-Year',    value: '3.8%',   reading: 'Above 2% target',   status: 'CAUTION' },
];

export default function CompassPage() {
  const { isAuthenticated } = useAuth();
  const [drawer, setDrawer] = useState(null);

  // Live data state — initialised to hardcoded fallbacks
  const [livePhase,      setLivePhase]      = useState('Late Cycle');
  const [livePhaseIdx,   setLivePhaseIdx]   = useState(2);
  const [liveConfidence, setLiveConfidence] = useState(0.82);
  const [liveNeedle,     setLiveNeedle]     = useState(90);  // Late Cycle zone centre
  const [liveUpdated,    setLiveUpdated]    = useState('May 24, 2026');
  const [liveRawPhase,   setLiveRawPhase]   = useState(null);
  const [liveLaborGated, setLiveLaborGated] = useState(false);
  const [liveTransitional, setLiveTransitional] = useState(false);
  const [tier1Indicators, setTier1]        = useState(FALLBACK_T1);
  const [liveGatedRows,   setGatedRows]    = useState(gatedRows);

  useEffect(() => {
    fetch('/api/compass')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d?.live) return;
        setLivePhase(d.phase);
        setLivePhaseIdx(d.phaseIdx);
        setLiveConfidence(d.confidence);
        setLiveNeedle(d.needleAngle);
        setLiveRawPhase(d.rawPhase);
        setLiveLaborGated(d.laborGated);
        setLiveTransitional(d.transitional);
        const dt = new Date(d.updatedAt);
        setLiveUpdated(dt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }));
        // Merge live values; keep name as key to preserve drawer links
        setTier1(prev => prev.map(ind => {
          const live = d.tier1.find(x => x.name === ind.name);
          return live?.value ? { ...ind, value: live.value, reading: live.reading, status: live.status } : ind;
        }));
        setGatedRows(d.tier2.map(row =>
          row.map(cell => cell ?? '—')
        ));
      })
      .catch(() => {});
  }, []);

  const PHASE_COLORS = [C.green, C.greenLight, C.amber, C.orange, C.red];
  const regimeColor = PHASE_COLORS[livePhaseIdx] ?? C.amber;
  const confidenceLabel =
    liveConfidence >= 0.75 ? { text: 'High agreement',     color: 'rgba(250,249,246,0.55)' }
  : liveConfidence >= 0.60 ? { text: 'Moderate agreement', color: 'rgba(250,249,246,0.55)' }
  :                          { text: 'Low — transitional', color: C.gold };

  return (
    <div>
      {drawer && (
        <IndicatorDrawer
          name={drawer.name} currentValue={drawer.value} currentStatus={drawer.status}
          isAuthenticated={isAuthenticated} onClose={() => setDrawer(null)}
        />
      )}

      {/* Hero */}
      <section style={{ background: C.navy, paddingTop: 64 }}>
        <div className="page-max" style={{ padding: 'clamp(52px,7vw,80px) clamp(20px,5vw,40px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <span style={{ width: 24, height: 1, background: C.gold, display: 'inline-block' }} />
            <span style={{ fontFamily: 'Arial', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.gold }}>Cycle Compass</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
            <div>
              <h1 style={{ fontFamily: "Georgia,serif", fontSize: 'clamp(32px,4vw,52px)', fontWeight: 400, color: C.bg, lineHeight: 1.1, marginBottom: 16 }}>
                Current Regime: <span style={{ color: regimeColor }}>{livePhase}</span>
              </h1>
              <p style={{ fontFamily: 'Arial', fontSize: 15, color: 'rgba(250,249,246,0.60)', lineHeight: 1.65, maxWidth: 480 }}>
                Our market regime classification engine synthesizes macro, credit, momentum, and sentiment indicators into a single cycle reading.
              </p>
              {liveLaborGated && (
                <div style={{ marginTop: 18, maxWidth: 480, borderLeft: `2px solid ${C.gold}`, paddingLeft: 14 }}>
                  <p style={{ fontFamily: 'Arial', fontSize: 13, color: 'rgba(250,249,246,0.78)', lineHeight: 1.6 }}>
                    Leading indicators point to <strong style={{ color: C.bg }}>{liveRawPhase}</strong>, but the labor market hasn&apos;t confirmed. Regime held at <strong style={{ color: C.bg }}>{livePhase}</strong> — hold current posture until labor confirms.
                  </p>
                </div>
              )}
              {liveTransitional && !liveLaborGated && (
                <div style={{ marginTop: 18, maxWidth: 480, borderLeft: `2px solid ${C.gold}`, paddingLeft: 14 }}>
                  <p style={{ fontFamily: 'Arial', fontSize: 13, color: 'rgba(250,249,246,0.78)', lineHeight: 1.6 }}>
                    Indicators are mixed — the reading sits near a phase boundary. Treat as transitional and await confirmation before shifting posture.
                  </p>
                </div>
              )}
            </div>
            <div style={{ background: 'rgba(250,249,246,0.06)', border: '1px solid rgba(250,249,246,0.12)', borderRadius: 4, padding: '20px 28px', textAlign: 'center', flexShrink: 0 }}>
              <div style={{ fontFamily: 'Arial', fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'rgba(250,249,246,0.45)', marginBottom: 10 }}>Confidence</div>
              <div style={{ fontFamily: "Georgia,serif", fontSize: 36, fontWeight: 400, color: regimeColor, lineHeight: 1 }}>{liveConfidence.toFixed(2)}</div>
              <div style={{ fontFamily: 'Arial', fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', color: confidenceLabel.color, marginTop: 8 }}>{confidenceLabel.text}</div>
              <div style={{ fontFamily: 'Arial', fontSize: 10, color: 'rgba(250,249,246,0.35)', marginTop: 6 }}>Updated {liveUpdated}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Gauge */}
      <section style={{ background: C.bgSubtle, padding: 'clamp(40px,6vw,64px) 0' }}>
        <div className="page-max">
          <div style={{ maxWidth: 560, margin: '0 auto' }}>
            <CycleDial needleAngle={liveNeedle} confidence={liveConfidence} />
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 24, flexWrap: 'wrap' }}>
              {[['RECOVERY', C.green], ['EXPANSION', C.greenLight], ['LATE CYCLE', C.amber], ['CONTRACTION', C.orange], ['CRISIS', C.red]].map(([label, color]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: color, display: 'inline-block' }} />
                  <span style={{ fontFamily: 'Arial', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', color: C.muted }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <PhaseNarrative currentPhaseIdx={livePhaseIdx} />

      {/* Tier 1 indicators */}
      <section className="section-pad" style={{ background: C.bg }}>
        <div className="page-max">
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontFamily: 'Arial', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.muted, marginBottom: 10 }}>Tier 1 Indicators — Public</div>
            <h2 style={{ fontFamily: "Georgia,serif", fontSize: 'clamp(22px,2.5vw,30px)', fontWeight: 400, color: C.navy }}>Key signals driving the current reading</h2>
          </div>
          <div className="indicator-grid">
            {tier1Indicators.map((ind, i) => (
              <IndicatorCard key={i} {...ind} onClick={() => setDrawer({ name: ind.name, value: ind.value, status: ind.status })} />
            ))}
          </div>
        </div>
      </section>

      {/* Gated Tier 2 */}
      <section className="section-pad" style={{ background: C.bgSubtle }}>
        <div className="page-max">
          <div style={{ position: 'relative' }}>
            {isAuthenticated && (
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontFamily: 'Arial', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.muted, marginBottom: 10 }}>Full Dashboard — Tier 2</div>
                <h2 style={{ fontFamily: "Georgia,serif", fontSize: 28, fontWeight: 400, color: C.navy }}>Extended indicator set &amp; composite scores</h2>
              </div>
            )}

            <div className={isAuthenticated ? '' : 'gated-blur'}>
              {!isAuthenticated && (
                <div style={{ marginBottom: 28 }}>
                  <div style={{ fontFamily: 'Arial', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.muted, marginBottom: 10 }}>Full Dashboard — Tier 2</div>
                  <h2 style={{ fontFamily: "Georgia,serif", fontSize: 28, fontWeight: 400, color: C.navy }}>Extended indicator set &amp; composite scores</h2>
                </div>
              )}
              <GatedContent rows={liveGatedRows} onRowClick={(name, val, st) => setDrawer({ name, value: val, status: st })} />
            </div>

            {!isAuthenticated && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(242,240,235,0.72)', backdropFilter: 'blur(1px)' }}>
                <div style={{ textAlign: 'center', maxWidth: 360 }}>
                  <svg width="32" height="36" viewBox="0 0 32 36" style={{ marginBottom: 16 }}>
                    <rect x="4" y="14" width="24" height="20" rx="3" fill={C.navy} />
                    <path d="M 10 14 L 10 10 A 6 6 0 0 1 22 10 L 22 14" fill="none" stroke={C.navy} strokeWidth="2.5" strokeLinecap="round" />
                    <rect x="13" y="20" width="6" height="7" rx="1" fill={C.bg} opacity="0.7" />
                  </svg>
                  <div style={{ fontFamily: "Georgia,serif", fontSize: 22, fontWeight: 400, color: C.navy, marginBottom: 10 }}>Full Dashboard</div>
                  <p style={{ fontFamily: 'Arial', fontSize: 14, color: C.muted, lineHeight: 1.65, marginBottom: 24 }}>
                    The extended indicator set, composite regime scores, and positioning signals are available to qualified observers.
                  </p>
                  <Link href="/login" style={{ fontFamily: 'Arial', fontSize: 12, letterSpacing: '0.07em', textTransform: 'uppercase', fontWeight: 700, padding: '12px 28px', background: C.navy, color: C.bg, border: 'none', borderRadius: 2, cursor: 'pointer', marginRight: 10, textDecoration: 'none', display: 'inline-block' }}>
                    LP Login
                  </Link>
                  <Link href="/about" style={{ fontFamily: 'Arial', fontSize: 12, letterSpacing: '0.07em', textTransform: 'uppercase', fontWeight: 700, padding: '12px 28px', background: 'transparent', color: C.navy, border: `1px solid ${C.navy}`, borderRadius: 2, cursor: 'pointer', textDecoration: 'none', display: 'inline-block' }}>
                    Learn More
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Methodology */}
      <section style={{ background: C.bg, padding: '40px 0', borderTop: `1px solid ${C.border}` }}>
        <div className="page-max">
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', maxWidth: 680 }}>
            <span style={{ width: 24, height: 1, background: C.gold, flexShrink: 0, marginTop: 9 }} />
            <p style={{ fontFamily: 'Arial', fontSize: 12, color: C.muted, lineHeight: 1.75 }}>
              <strong style={{ color: C.text }}>Methodology.</strong> The Cycle Compass draws on 20+ macro, credit, and momentum data inputs, synthesized into 12 published indicators across two tiers. Tier 1 indicators drive the headline regime reading; Tier 2 extends the model with additional signals and composite scoring. The confidence score (0–1.0) reflects the degree of indicator agreement. All indicator weights are shown in the detail drawers.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
