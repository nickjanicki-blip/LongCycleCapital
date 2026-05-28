'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import SubscribeModal from '@/components/SubscribeModal';

const C = {
  navy: '#1F4E78', gold: '#B8860B',
  bg: '#FAF9F6', bgSubtle: '#F2F0EB', text: '#2C3E50', muted: '#7F8C8D',
  border: 'rgba(44,62,80,0.10)',
};

function HomeHero() {
  return (
    <section className="home-hero" style={{ background: C.navy, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingTop: 64, position: 'relative', overflow: 'hidden' }}>
      <svg style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', opacity: 0.04, pointerEvents: 'none' }} width="600" height="460" viewBox="0 0 700 500">
        <path d="M 40 340 C 140 80 260 70 380 220 C 500 370 600 360 660 220" fill="none" stroke="#FAF9F6" strokeWidth="60" strokeLinecap="round" />
        <path d="M 40 260 C 100 160 170 150 240 230 C 310 310 380 300 450 210 C 520 120 590 115 640 180" fill="none" stroke="#FAF9F6" strokeWidth="28" strokeLinecap="round" strokeOpacity="0.5" />
      </svg>

      <div className="page-max hero-inner">
        <div className="hero-eyebrow" style={{ fontFamily: 'Arial,Helvetica,sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.gold, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 28, height: 1, background: C.gold, display: 'inline-block' }} />
          A public experiment in long-cycle macro investing
        </div>

        <h1 style={{ fontFamily: "Georgia,'Times New Roman',serif", fontSize: 'clamp(40px,5.5vw,72px)', fontWeight: 400, lineHeight: 1.08, letterSpacing: '-0.02em', color: C.bg, marginBottom: 20, maxWidth: 780, textWrap: 'pretty' }}>
          We trade cycles.<br />Not noise.
        </h1>

        <div className="hero-tagline" style={{ fontFamily: "Georgia,serif", fontSize: 'clamp(18px,2.2vw,24px)', fontStyle: 'italic', color: C.gold }}>
          Patience compounds.
        </div>

        <p className="hero-body" style={{ fontFamily: 'Arial,Helvetica,sans-serif', fontSize: 'clamp(15px,1.6vw,17px)', lineHeight: 1.75, color: 'rgba(250,249,246,0.72)', maxWidth: 520, textWrap: 'pretty' }}>
          Long Cycle Capital is a self-managed fund exploring cycle-based macro investing. We publicly document our framework, our market analysis, and our thinking. We are not accepting outside capital at this time.
        </p>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/compass" style={{ fontFamily: 'Arial', fontSize: 12, letterSpacing: '0.07em', textTransform: 'uppercase', fontWeight: 700, padding: '14px 28px', background: C.gold, color: '#fff', border: 'none', borderRadius: 2, textDecoration: 'none', display: 'inline-block' }}>
            Cycle Compass →
          </Link>
          <Link href="/research" style={{ fontFamily: 'Arial', fontSize: 12, letterSpacing: '0.07em', textTransform: 'uppercase', fontWeight: 700, padding: '14px 28px', background: 'transparent', color: 'rgba(250,249,246,0.80)', border: '1px solid rgba(250,249,246,0.22)', borderRadius: 2, textDecoration: 'none', display: 'inline-block' }}>
            Read Research →
          </Link>
        </div>

        <div className="stats-row">
          {[['18–22%', 'Target CAGR'], ['5–10', 'Positions per year'], ['6–18mo', 'Average hold']].map(([val, label], i) => (
            <div key={i} className="stat-item">
              <div style={{ fontFamily: "Georgia,serif", fontSize: 'clamp(26px,3.5vw,36px)', fontWeight: 400, color: C.bg, lineHeight: 1, marginBottom: 6 }}>{val}</div>
              <div style={{ fontFamily: 'Arial', fontSize: 11, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'rgba(250,249,246,0.45)' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HomePhilosophy() {
  const beliefs = [
    { title: 'Markets move in cycles, not lines.', body: 'Recurring patterns driven by debt cycles, central bank policy, demographics, and technology adoption compound across multiple timeframes.' },
    { title: 'The best opportunities require patience.', body: 'Cycle setups that produce asymmetric returns happen rarely. Recognizing them requires waiting for multiple cycles to align.' },
    { title: 'Activity is the enemy of returns.', body: 'The greatest sin in investing is manufacturing trades when no opportunity exists. We do less, not more.' },
    { title: 'Capital preservation enables compounding.', body: 'A 50% loss requires a 100% gain to recover. The math of compounding strongly favors investors who avoid catastrophic losses.' },
  ];

  return (
    <section className="section-pad" style={{ background: C.bg }}>
      <div className="page-max">
        <div className="phil-layout">
          <div>
            <div style={{ fontFamily: 'Arial', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.muted, marginBottom: 16 }}>Our Worldview</div>
            <h2 style={{ fontFamily: "Georgia,serif", fontSize: 'clamp(26px,3vw,36px)', fontWeight: 400, color: C.navy, lineHeight: 1.2, marginBottom: 18 }}>What we believe about markets</h2>
            <div style={{ width: 32, height: 1, background: C.gold, marginBottom: 20 }} />
            <p className="t-base" style={{ fontFamily: 'Arial', color: C.muted, lineHeight: 1.75 }}>These convictions underpin everything: strategy, positioning, hold periods, and how we think about risk.</p>
          </div>
          <div className="beliefs-grid">
            {beliefs.map((b, i) => (
              <div key={i} style={{ borderTop: `2px solid ${i < 2 ? C.navy : C.gold}`, paddingTop: 18 }}>
                <h3 style={{ fontFamily: "Georgia,serif", fontSize: 17, fontWeight: 400, color: C.navy, lineHeight: 1.35, marginBottom: 10 }}>{b.title}</h3>
                <p className="t-sm" style={{ fontFamily: 'Arial', color: C.muted, lineHeight: 1.7 }}>{b.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function HomeStrategyPreview() {
  const strategies = [
    { label: 'Currency', title: 'Central Bank Divergences', body: 'Currency pairs at policy-cycle extremes where multi-year mean reversion is structurally probable.' },
    { label: 'Metals', title: 'Gold / Silver Ratio', body: 'Mean reversion setups at multi-decade extremes in the gold-silver ratio.' },
    { label: 'Digital', title: 'Bitcoin Halving Cycle', body: "Systematic positioning around Bitcoin's four-year halving cycle. The most predictable cycle in any liquid asset." },
    { label: 'Crisis', title: 'Crisis Accumulation', body: 'Equity and real asset accumulation when the Cycle Compass signals maximum regime stress.' },
  ];

  return (
    <section className="section-pad" style={{ background: C.bgSubtle }}>
      <div className="page-max">
        <div style={{ marginBottom: 48, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontFamily: 'Arial', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.muted, marginBottom: 10 }}>Strategy</div>
            <h2 style={{ fontFamily: "Georgia,serif", fontSize: 'clamp(26px,3vw,36px)', fontWeight: 400, color: C.navy }}>Four cycle-based strategies</h2>
          </div>
          <Link href="/strategy" style={{ fontFamily: 'Arial', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700, padding: '10px 20px', background: 'transparent', color: C.navy, border: `1px solid ${C.navy}`, borderRadius: 2, textDecoration: 'none', display: 'inline-block' }}>
            Full Overview →
          </Link>
        </div>
        <div className="four-col">
          {strategies.map((s, i) => (
            <div key={i} style={{ background: C.bg, padding: 'clamp(20px,3vw,28px) clamp(16px,2.5vw,24px)' }}>
              <div className="t-label" style={{ fontFamily: 'Arial', fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: C.gold, marginBottom: 12 }}>{s.label}</div>
              <h3 style={{ fontFamily: "Georgia,serif", fontSize: 18, fontWeight: 400, color: C.navy, lineHeight: 1.3, marginBottom: 12 }}>{s.title}</h3>
              <p className="t-sm" style={{ fontFamily: 'Arial', color: C.muted, lineHeight: 1.65 }}>{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HomeResearchPreview() {
  const { isObserver } = useAuth();
  const [showModal, setShowModal] = useState(false);

  const essays = [
    { type: 'Quarterly Essay', date: 'May 2026', title: 'The Long-Term Debt Cycle: Where Are We?', excerpt: 'Understanding the structural forces driving the current macro regime — and what history suggests comes next.', slug: 'essay-debt-cycle-2026' },
    { type: 'Regime Briefing', date: 'May 16, 2026', title: 'Late-Cycle Signals Accumulating', excerpt: 'Three indicators flashed this week. Cycle Compass: LATE CYCLE with high confidence.', locked: true, slug: 'regime-briefing-may-2026' },
    { type: 'Quarterly Essay', date: 'April 2026', title: 'History Rhymes: 1937 and 2026', excerpt: 'The structural parallels between the current environment and 1937 are striking — and instructive.', slug: 'essay-1937-2026' },
  ];

  const typeColor = { 'Quarterly Essay': C.navy, 'Regime Briefing': C.gold };

  return (
    <section className="section-pad" style={{ background: C.bg, borderTop: `1px solid ${C.border}` }}>
      {showModal && <SubscribeModal onClose={() => setShowModal(false)} />}
      <div className="page-max">
        <div style={{ marginBottom: 44, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontFamily: 'Arial', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.muted, marginBottom: 10 }}>Research</div>
            <h2 style={{ fontFamily: "Georgia,serif", fontSize: 'clamp(26px,3vw,36px)', fontWeight: 400, color: C.navy }}>Recent writing</h2>
          </div>
          <Link href="/research" style={{ fontFamily: 'Arial', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700, padding: '10px 20px', background: 'transparent', color: C.navy, border: `1px solid ${C.navy}`, borderRadius: 2, textDecoration: 'none', display: 'inline-block' }}>
            All Research →
          </Link>
        </div>

        {essays.map((e, i) => {
          const locked = e.locked && !isObserver;
          const rowContent = (
            <>
              <div>
                <div style={{ display: 'inline-block', fontFamily: 'Arial', fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: typeColor[e.type] || C.muted, padding: '3px 8px', background: `${typeColor[e.type] || C.muted}18`, borderRadius: 2, marginBottom: 8 }}>{e.type}</div>
                <div style={{ fontFamily: "'Courier New',monospace", fontSize: 11, color: C.muted }}>{e.date}</div>
              </div>
              <div>
                <h3 style={{ fontFamily: "Georgia,serif", fontSize: 20, fontWeight: 400, color: C.navy, marginBottom: 8, lineHeight: 1.3 }}>{e.title}</h3>
                <p className="t-sm" style={{ fontFamily: 'Arial', color: C.muted, lineHeight: 1.65 }}>{e.excerpt}</p>
              </div>
              <div className="read-time" style={{ textAlign: 'right', paddingTop: 4, flexShrink: 0 }}>
                {locked ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'Arial', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.gold, border: '1px solid ' + C.gold, padding: '3px 8px', borderRadius: 2, whiteSpace: 'nowrap' }}>
                    <svg width="8" height="9" viewBox="0 0 10 12"><rect x="1" y="5" width="8" height="7" rx="1" fill="currentColor" /><path d="M3 5V3.5a2 2 0 0 1 4 0V5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                    Observer&apos;s Only
                  </span>
                ) : (
                  <span className="read-time-plain" style={{ fontFamily: 'Arial', fontSize: 11, color: C.muted }}>→</span>
                )}
              </div>
            </>
          );
          return locked ? (
            <div key={i} className="research-row" onClick={() => setShowModal(true)} style={{ opacity: 0.72 }}>
              {rowContent}
            </div>
          ) : (
            <Link key={i} href={`/research/${e.slug}`} className="research-row" style={{ display: 'grid', gridTemplateColumns: '140px 1fr auto', gap: 32, padding: '32px 0', borderTop: `1px solid ${C.border}`, textDecoration: 'none' }}>
              {rowContent}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function HomeNewsletter() {
  const { subscribe } = useAuth();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  return (
    <section style={{ background: C.navy, padding: 'clamp(56px,8vw,88px) 0' }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '0 clamp(20px,5vw,40px)', textAlign: 'center' }}>
        <div style={{ fontFamily: 'Arial', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.gold, marginBottom: 20 }}>QUARTERLY REGIME BRIEFING</div>
        <h2 style={{ fontFamily: "Georgia,'Times New Roman',serif", fontSize: 'clamp(24px,3vw,34px)', fontWeight: 400, color: C.bg, lineHeight: 1.25, marginBottom: 16, textWrap: 'pretty' }}>
          Follow the experiment.
        </h2>
        <p className="t-base" style={{ fontFamily: 'Arial', color: 'rgba(250,249,246,0.62)', lineHeight: 1.75, marginBottom: 32, textWrap: 'pretty' }}>
          We are not accepting outside capital. But we publish our framework, our Cycle Compass readings, and our thinking publicly. No predictions. No hype. Just the work.
        </p>
        {submitted ? (
          <div style={{ fontFamily: "Georgia,serif", fontSize: 18, fontStyle: 'italic', color: C.gold }}>
            You&apos;re in. Patience compounds.
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); if (email) { setSubmitted(true); subscribe(); fetch('/api/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) }); } }}
            style={{ display: 'flex', gap: 8, maxWidth: 420, margin: '0 auto', flexWrap: 'wrap' }}>
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com" required
              style={{ flex: '1 1 200px', fontFamily: 'Arial', fontSize: 14, padding: '11px 14px', background: 'rgba(250,249,246,0.10)', border: '1px solid rgba(250,249,246,0.18)', borderRadius: 2, color: C.bg, outline: 'none' }}
            />
            <button type="submit" style={{ fontFamily: 'Arial', fontSize: 11, letterSpacing: '0.07em', textTransform: 'uppercase', fontWeight: 700, padding: '11px 22px', background: C.gold, color: '#fff', border: 'none', borderRadius: 2, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Subscribe
            </button>
          </form>
        )}
        <div style={{ fontFamily: 'Arial', fontSize: 11, color: 'rgba(250,249,246,0.28)', marginTop: 16 }}>
          Free. No spam. Unsubscribe any time.
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <>
      <HomeHero />
      <HomePhilosophy />
      <HomeStrategyPreview />
      <HomeResearchPreview />
      <HomeNewsletter />
    </>
  );
}
