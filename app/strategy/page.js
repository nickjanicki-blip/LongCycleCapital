import PageHero from '@/components/PageHero';

const C = {
  navy: '#1F4E78', gold: '#B8860B',
  bg: '#FAF9F6', bgSubtle: '#F2F0EB', text: '#2C3E50', muted: '#7F8C8D',
  border: 'rgba(44,62,80,0.10)',
};

const stats = [
  { n: '5–10', label: 'Positions per year' },
  { n: '2–5×', label: 'Typical leverage' },
  { n: '5%', label: 'Max risk per trade' },
  { n: '15%', label: 'Max concurrent risk' },
];

const strategies = [
  { num: '01', tag: 'Currency', title: 'Central Bank Policy Divergences', body: 'We trade currency pairs when central bank policy cycles diverge significantly, typically at multi-year extremes. Entry criteria require both fundamental cycle confirmation and technical setup alignment. Typical hold: 6–18 months.' },
  { num: '02', tag: 'Metals', title: 'Gold / Silver Ratio Mean Reversion', body: 'The gold-silver ratio has mean-reverted from extremes reliably across every decade of data. We position when the ratio reaches multi-year extremes, sizing based on historical deviation magnitude.' },
  { num: '03', tag: 'Digital', title: 'Bitcoin Halving Cycle', body: "Bitcoin's four-year halving cycle is the most structurally predictable cycle in any liquid asset class. We position systematically in the 12 months following each halving event, sizing relative to cycle phase confidence." },
  { num: '04', tag: 'Crisis', title: 'Crisis-Period Accumulation', body: 'When the Cycle Compass signals maximum stress, we accumulate equity and real asset positions. These setups require maximum patience. Often 12–24 months of uncomfortable positioning before mean reversion begins.' },
];

export const metadata = {
  title: 'Strategy — Long Cycle Capital',
  description: 'Four cycle-based strategies. High-conviction setups at cycle convergence.',
};

export default function StrategyPage() {
  return (
    <div>
      <PageHero
        eyebrow="Strategy"
        title="High-conviction setups at cycle convergence."
        subtitle="Four strategy areas. Each defined by specific cycle-based entry criteria. No discretion — the framework decides."
      />

      <section style={{ background: C.bgSubtle }}>
        <div className="page-max">
          <div className="strategy-stats">
            {stats.map((s, i) => (
              <div key={i} className="strategy-stat">
                <div style={{ fontFamily: "Georgia,serif", fontSize: 'clamp(28px,3.5vw,40px)', fontWeight: 400, color: C.navy, lineHeight: 1, marginBottom: 6, whiteSpace: 'nowrap' }}>{s.n}</div>
                <div style={{ fontFamily: 'Arial', fontSize: 11, letterSpacing: '0.07em', textTransform: 'uppercase', color: C.muted }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad" style={{ background: C.bg }}>
        <div className="page-max">
          {strategies.map((s, i) => (
            <div key={i} className="strategy-item">
              <div>
                <div style={{ fontFamily: "'Courier New',monospace", fontSize: 12, color: C.gold, fontWeight: 700 }}>{s.num}</div>
                <div style={{ fontFamily: 'Arial', fontSize: 10, letterSpacing: '0.09em', textTransform: 'uppercase', color: C.muted, marginTop: 4 }}>{s.tag}</div>
              </div>
              <div>
                <h3 style={{ fontFamily: "Georgia,serif", fontSize: 'clamp(18px,2.2vw,24px)', fontWeight: 400, color: C.navy, marginBottom: 14, lineHeight: 1.3 }}>{s.title}</h3>
                <p className="t-sub" style={{ fontFamily: 'Arial', color: C.text, lineHeight: 1.8, textWrap: 'pretty' }}>{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ background: C.bgSubtle, padding: 'clamp(40px,5vw,60px) 0' }}>
        <div className="page-max">
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', maxWidth: 680 }}>
            <span style={{ width: 24, height: 1, background: C.gold, flexShrink: 0, marginTop: 9 }} />
            <p className="t-sub" style={{ fontFamily: 'Arial', color: C.muted, lineHeight: 1.8 }}>
              <strong style={{ color: C.text }}>On position sizing.</strong> All four strategies share a unified risk framework. Maximum 5% of capital at risk per position. Maximum 15% concurrent risk across all open positions. Leverage is a tool for capturing asymmetric setups, not for manufacturing returns where the cycle does not support them.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
