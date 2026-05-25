import Link from 'next/link';

const C = {
  navyDeep: '#162E45', gold: '#B8860B', goldLight: '#F0C040',
  bg: '#FAF9F6', border: 'rgba(250,249,246,0.10)',
};

const cols = {
  'Strategy':  [['Overview','/strategy'],['Currency','/strategy'],['Metals','/strategy'],['Bitcoin Cycle','/strategy'],['Crisis Periods','/strategy']],
  'Research':  [['Monthly Essays','/research'],['Regime Briefings','/research'],['Annual Letters','/research'],['Archive','/research']],
  'Firm':      [['About','/about'],['Cycle Compass','/compass'],['LP Login','/login']],
};

export default function Footer() {
  return (
    <footer style={{ background: C.navyDeep, color: C.bg }}>
      <div className="page-max">
        <div className="footer-top">
          <div>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, textDecoration: 'none' }}>
              <svg width="48" height="24" viewBox="0 0 64 30" fill="none">
                <path d="M 4 24 C 12 8 22 6 32 16 C 42 26 52 25 60 16" stroke={C.bg} strokeWidth="1.8" strokeLinecap="round" />
                <path d="M 4 18 C 9 11 15 10 21 16 C 27 22 33 21 39 14 C 45 7 51 7 57 13" stroke={C.goldLight} strokeWidth="1.1" strokeLinecap="round" />
              </svg>
              <div>
                <div style={{ fontFamily: "Georgia,serif", fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', lineHeight: 1.3 }}>Long Cycle</div>
                <div style={{ fontFamily: "Georgia,serif", fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', lineHeight: 1.3 }}>Capital</div>
                <div style={{ height: 0.75, background: C.goldLight, marginTop: 3 }} />
              </div>
            </Link>
            <p style={{ fontFamily: 'Arial,Helvetica,sans-serif', fontSize: 'var(--text-sm)', color: 'rgba(250,249,246,0.50)', lineHeight: 1.75, marginBottom: 24, maxWidth: 260 }}>
              A self-managed fund exploring long-cycle macro investing. We document our framework and thinking publicly.
            </p>
            <div style={{ fontFamily: "Georgia,serif", fontSize: 14, fontStyle: 'italic', color: C.goldLight, opacity: 0.75 }}>
              Patience compounds.
            </div>
          </div>

          {Object.entries(cols).map(([title, items]) => (
            <div key={title}>
              <div style={{ fontFamily: 'Arial', fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'rgba(250,249,246,0.35)', marginBottom: 16 }}>{title}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {items.map(([label, href]) => (
                  <Link key={label} href={href} style={{ fontFamily: 'Arial', fontSize: 'var(--text-sm)', color: 'rgba(250,249,246,0.60)', textDecoration: 'none' }}>
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '22px 0', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ fontFamily: 'Arial', fontSize: 11, color: 'rgba(250,249,246,0.28)' }}>© 2026 Long Cycle Capital. All rights reserved.</div>
          <div style={{ display: 'flex', gap: 24 }}>
            {['Privacy Policy', 'Terms of Use'].map(t => (
              <span key={t} style={{ fontFamily: 'Arial', fontSize: 11, color: 'rgba(250,249,246,0.28)', cursor: 'pointer' }}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      <div style={{ borderTop: `1px solid ${C.border}` }}>
        <div className="page-max" style={{ paddingTop: 20, paddingBottom: 28 }}>
          <p style={{ fontFamily: 'Arial', fontSize: 10, color: 'rgba(250,249,246,0.20)', lineHeight: 1.7 }}>
            This website is for informational purposes only and does not constitute an offer to sell or solicitation of an offer to buy any securities. Long Cycle Capital manages proprietary capital only and is not registered as an investment adviser. Past performance is not indicative of future results. All investing involves risk, including the possible loss of principal.
          </p>
        </div>
      </div>
    </footer>
  );
}
