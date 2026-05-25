import Link from 'next/link';
import PageHero from '@/components/PageHero';

const C = {
  navy: '#1F4E78', gold: '#B8860B',
  bg: '#FAF9F6', bgSubtle: '#F2F0EB', text: '#2C3E50', muted: '#7F8C8D',
  border: 'rgba(44,62,80,0.10)',
};

const lessons = [
  ['01', 'Cycles overpower plans.', 'The best business plan I ever wrote was made irrelevant by a cycle shift inside 18 months. The one that actually mattered was the one built around recognizing which phase I was in and positioning accordingly, not trying to fight it.'],
  ['02', 'Most of the time, the answer is to wait.', 'Building 50 locations in 17 years sounds like aggressive growth. But the actual work was mostly waiting. Waiting for the right market conditions, the right operator, the right moment. The years I tried to force progress were consistently the most expensive.'],
  ['03', "Risk management isn't a feature, it's the whole game.", 'The brick and mortar operators who lost everything in 2020-2024 had one thing in common: they were over-leveraged going in. The ones who came out stronger had preserved capital through the 2019 expansion. In business and in markets, the difference between surviving and not is almost always how you handled the last cycle peak.'],
  ['04', 'The opportunity is always in the fear.', "2009 was the best time to start a business in a generation. Most people couldn't see it because the environment felt catastrophic. But that fear is precisely what made the conditions favorable. Everything was cheap, low competition, motivated partners. Markets work the same way."],
];

const lpValues = [
  ['Patient', "A 5–10 year investment horizon is the baseline, not a goal. Short-term correlation to anything is irrelevant to us."],
  ['Intellectually engaged', "Wants to understand the framework, not just the numbers. Cycle investing without intellectual buy-in doesn't hold during drawdowns."],
  ['Cycle-aware', 'Already believes that markets operate in cycles. This is not a metaphor, but is the core mechanism of how capital moves.'],
];

export const metadata = {
  title: 'About — Long Cycle Capital',
  description: 'Built on 17 years of learning what cycles actually do to a business.',
};

export default function AboutPage() {
  return (
    <div>
      <PageHero
        eyebrow="About"
        title="Built on 17 years of learning what cycles actually do to a business."
        subtitle="Long Cycle Capital applies those lessons to macro markets — systematically, patiently, publicly."
      />

      <section className="section-pad" style={{ background: C.bg }}>
        <div className="page-narrow">
          <div className="two-col">
            <div>
              <div style={{ fontFamily: 'Arial', fontSize: 11, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: C.muted, marginBottom: 12 }}>Founder</div>
              <div style={{ width: 28, height: 1, background: C.gold, marginBottom: 20 }} />
              <div style={{ fontFamily: "'Courier New',monospace", fontSize: 12, color: C.muted, lineHeight: 1.8 }}>
                <div>Nicholas Janicki</div>
                <div style={{ marginTop: 6 }}>Founded 2026</div>
                <div style={{ marginTop: 6 }}>Phoenix, AZ</div>
              </div>
            </div>
            <div>
              <p style={{ fontFamily: "Georgia,serif", fontSize: 20, fontStyle: 'italic', color: C.navy, lineHeight: 1.65, marginBottom: 32, textWrap: 'pretty' }}>
                &ldquo;The most important things I learned about business had nothing to do with hustle or vision. They were about which cycle I was in and whether I was honest with myself about it.&rdquo;
              </p>
              <p style={{ fontFamily: 'Arial', fontSize: 15, color: C.text, lineHeight: 1.8, marginBottom: 20, textWrap: 'pretty' }}>
                In 2009, at the depth of the financial crisis, Nicholas Janicki opened the first True REST float therapy location. Most people thought the timing was wrong. But opening a wellness franchise when construction, leasing, and talent were cheapest turned out to be an enormous structural advantage. That was the first real lesson in cycle awareness.
              </p>
              <p style={{ fontFamily: 'Arial', fontSize: 15, color: C.text, lineHeight: 1.8, marginBottom: 20, textWrap: 'pretty' }}>
                Over 17 years, True REST grew to 50+ locations across 22 states. But the education was not in the growth. It was in watching what happened during every cycle that came after: the slow 2013–2016 slog, the 2017–2019 expansion phase, and then 2020. The businesses that survived were the ones that had preserved capital and built lean. The ones that had not, did not.
              </p>
              <p style={{ fontFamily: 'Arial', fontSize: 15, color: C.text, lineHeight: 1.8, textWrap: 'pretty' }}>
                Long Cycle Capital is the direct expression of that education applied to markets. The framework is not theoretical, it is the same logic that made the difference between a location that thrived and one that closed. Which cycle are we in? What does that mean for positioning? What does patience actually buy you?
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-pad" style={{ background: C.bgSubtle }}>
        <div className="page-narrow">
          <div style={{ marginBottom: 48 }}>
            <div style={{ fontFamily: 'Arial', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.muted, marginBottom: 12 }}>What 17 Years Taught</div>
            <h2 style={{ fontFamily: "Georgia,serif", fontSize: 'clamp(26px,3vw,36px)', fontWeight: 400, color: C.navy, lineHeight: 1.2 }}>The lessons, not the story</h2>
          </div>
          {lessons.map(([num, title, body]) => (
            <div key={num} style={{ display: 'grid', gridTemplateColumns: '48px 1fr', gap: '0 28px', padding: '32px 0', borderTop: `1px solid ${C.border}` }}>
              <div style={{ fontFamily: "'Courier New',monospace", fontSize: 12, color: C.gold, fontWeight: 700, paddingTop: 3 }}>{num}</div>
              <div>
                <h3 style={{ fontFamily: "Georgia,serif", fontSize: 20, fontWeight: 400, color: C.navy, lineHeight: 1.3, marginBottom: 12 }}>{title}</h3>
                <p style={{ fontFamily: 'Arial', fontSize: 14, color: C.muted, lineHeight: 1.75, textWrap: 'pretty' }}>{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section-pad" style={{ background: C.bg }}>
        <div className="page-narrow">
          <div className="two-col">
            <div>
              <div style={{ fontFamily: 'Arial', fontSize: 11, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: C.muted, marginBottom: 12 }}>Long-term Thesis</div>
              <div style={{ width: 28, height: 1, background: C.gold, marginBottom: 20 }} />
              <div style={{ fontFamily: "'Courier New',monospace", fontSize: 12, color: C.muted, lineHeight: 1.8 }}>
                <div>Horizon: 2030–2032</div>
                <div style={{ marginTop: 6 }}>Framework: Debt Cycle</div>
                <div style={{ marginTop: 6 }}>Dalio / Ray / History</div>
              </div>
            </div>
            <div>
              <h3 style={{ fontFamily: "Georgia,serif", fontSize: 22, fontWeight: 400, color: C.navy, lineHeight: 1.3, marginBottom: 16 }}>
                The long-term debt cycle is approaching its terminal phase.
              </h3>
              <p style={{ fontFamily: 'Arial', fontSize: 15, color: C.text, lineHeight: 1.8, marginBottom: 18, textWrap: 'pretty' }}>
                The last major inflection in the long-term debt cycle occurred around 1930–1933. Roughly 90 years later, the structural indicators are converging: debt-to-GDP levels, real interest rate trajectories, reserve currency dynamics. History suggests a period of significant structural adjustment is ahead, most likely concentrated between 2028 and 2033.
              </p>
              <p style={{ fontFamily: 'Arial', fontSize: 15, color: C.text, lineHeight: 1.8, textWrap: 'pretty' }}>
                This is not a prediction. It is a probabilistic framework that informs our time horizon, our strategy selection, and our willingness to hold positions through short-term noise. The four strategies we run are each designed for this macro backdrop.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-pad" style={{ background: C.bgSubtle }}>
        <div className="page-narrow">
          <div style={{ marginBottom: 44 }}>
            <div style={{ fontFamily: 'Arial', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.muted, marginBottom: 12 }}>Who We Are For</div>
            <h2 style={{ fontFamily: "Georgia,serif", fontSize: 'clamp(26px,3vw,36px)', fontWeight: 400, color: C.navy }}>We are not for everyone.</h2>
          </div>
          <p style={{ fontFamily: 'Arial', fontSize: 15, color: C.text, lineHeight: 1.8, maxWidth: 640, marginBottom: 44, textWrap: 'pretty' }}>
            We manage proprietary capital and are not currently accepting outside investors. When and if that changes, our aligned observer will look like this:
          </p>
          <div className="values-row">
            {lpValues.map(([title, body]) => (
              <div key={title} style={{ flex: 1 }}>
                <div style={{ fontFamily: 'Arial', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.gold, marginBottom: 10 }}>{title}</div>
                <p style={{ fontFamily: 'Arial', fontSize: 13, color: C.muted, lineHeight: 1.7, textWrap: 'pretty' }}>{body}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 48 }}>
            <Link href="/compass" style={{ fontFamily: 'Arial', fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700, padding: '12px 24px', background: C.navy, color: C.bg, border: 'none', borderRadius: 2, marginRight: 12, textDecoration: 'none', display: 'inline-block' }}>
              See the Compass
            </Link>
            <Link href="/research" style={{ fontFamily: 'Arial', fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700, padding: '12px 24px', background: 'transparent', color: C.navy, border: `1px solid ${C.navy}`, borderRadius: 2, textDecoration: 'none', display: 'inline-block' }}>
              Read Our Research →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
