'use client';
import { useState } from 'react';
import Link from 'next/link';
import PageHero from '@/components/PageHero';
import SubscribeModal from '@/components/SubscribeModal';
import { useAuth } from '@/lib/AuthContext';

const C = {
  navy: '#1F4E78', gold: '#B8860B',
  bg: '#FAF9F6', text: '#2C3E50', muted: '#7F8C8D',
  border: 'rgba(44,62,80,0.10)',
};

const essays = [
  { type: 'Regime Briefing',  date: 'May 16, 2026',  title: 'Late-Cycle Signals Accumulating',              locked: true,  excerpt: 'Current regime: LATE CYCLE at 0.82 confidence. Three Tier 1 indicators moved into warning territory this week.',                        mins: 4,  slug: 'regime-briefing-may-2026' },
  { type: 'Regime Briefing',  date: 'May 9, 2026',   title: 'Dollar Strength Index Approaching Extreme',    locked: true,  excerpt: 'DXY at 104.8, approaching levels that have historically preceded multi-year reversals in currency cycles.',                              mins: 5,  slug: 'regime-briefing-dollar-2026' },
  { type: 'Quarterly Essay',  date: 'Q3 2026',        title: 'The Long-Term Debt Cycle: Where Are We?',                   excerpt: 'Understanding the structural forces driving the current macro regime — and what history suggests comes next for sovereign debt markets.',                          mins: 18, slug: 'essay-debt-cycle-2026' },
  { type: 'Quarterly Essay',  date: 'Jan 2026',      title: 'History Rhymes: 1937 and 2026',                              excerpt: 'The structural parallels between the current environment and 1937 are striking — and instructive for positioning through the next phase.', mins: 22, slug: 'essay-1937-2026' },
  { type: 'Annual Letter',    date: 'January 2026',  title: '2025: A Year of Positioning',                               excerpt: 'Our inaugural annual letter. What we built, what we learned, and why we believe the next five years will reward patience.',               mins: 10, slug: 'annual-letter-2025' },
];

const typeColor = { 'Quarterly Essay': C.navy, 'Regime Briefing': C.gold, 'Annual Letter': '#922B21' };

export default function ResearchPage() {
  const { isObserver } = useAuth();
  const [showModal, setShowModal] = useState(false);

  return (
    <div>
      {showModal && <SubscribeModal onClose={() => setShowModal(false)} />}
      <PageHero
        eyebrow="Research"
        title="Long-form analysis. Framework-oriented. No predictions."
        subtitle="Essays, regime briefings, and annual letters. Written for readers who think in cycles."
      />

      <section className="section-pad" style={{ background: C.bg }}>
        <div className="page-max">
          {essays.map((e, i) => (
            <div
              key={i}
              className="research-row"
              onClick={() => e.locked && !isObserver ? setShowModal(true) : null}
              style={{ cursor: e.locked && !isObserver ? 'pointer' : 'default', opacity: e.locked && !isObserver ? 0.75 : 1 }}
            >
              <div>
                <div style={{ display: 'inline-block', fontFamily: 'Arial', fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: typeColor[e.type] || C.muted, padding: '3px 8px', background: `${typeColor[e.type] || C.muted}16`, borderRadius: 2, marginBottom: 8 }}>{e.type}</div>
                <div style={{ fontFamily: "'Courier New',monospace", fontSize: 11, color: C.muted }}>{e.date}</div>
              </div>
              <div>
                {e.locked && !isObserver ? (
                  <>
                    <h3 style={{ fontFamily: "Georgia,serif", fontSize: 'clamp(17px,2vw,22px)', fontWeight: 400, color: C.navy, marginBottom: 8, lineHeight: 1.3 }}>{e.title}</h3>
                    <p style={{ fontFamily: 'Arial', fontSize: 13, color: C.muted, lineHeight: 1.65 }}>{e.excerpt}</p>
                  </>
                ) : (
                  <Link href={`/research/${e.slug}`} style={{ textDecoration: 'none' }}>
                    <h3 style={{ fontFamily: "Georgia,serif", fontSize: 'clamp(17px,2vw,22px)', fontWeight: 400, color: C.navy, marginBottom: 8, lineHeight: 1.3 }}>{e.title}</h3>
                    <p style={{ fontFamily: 'Arial', fontSize: 13, color: C.muted, lineHeight: 1.65 }}>{e.excerpt}</p>
                  </Link>
                )}
              </div>
              <div className="read-time" style={{ textAlign: 'right', paddingTop: 4, flexShrink: 0 }}>
                {e.locked && !isObserver ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'Arial', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.gold, border: '1px solid ' + C.gold, padding: '3px 8px', borderRadius: 2, whiteSpace: 'nowrap' }}>
                    <svg width="8" height="9" viewBox="0 0 10 12"><rect x="1" y="5" width="8" height="7" rx="1" fill="currentColor" /><path d="M3 5V3.5a2 2 0 0 1 4 0V5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                    Observer&apos;s Only
                  </span>
                ) : (
                  <span className="read-time-plain" style={{ fontFamily: 'Arial', fontSize: 11, color: C.muted, whiteSpace: 'nowrap' }}>{e.mins} min</span>
                )}
              </div>
            </div>
          ))}

          <div style={{ paddingTop: 40, borderTop: `1px solid ${C.border}` }}>
            <p style={{ fontFamily: 'Arial', fontSize: 13, color: C.muted, lineHeight: 1.75 }}>
              The full research archive — including all prior regime briefings and founder notes — is available in the LP Dashboard.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
