const C = { navy: '#1F4E78', gold: '#B8860B', bg: '#FAF9F6' };

export default function PageHero({ eyebrow, title, subtitle }) {
  return (
    <section style={{ background: C.navy, paddingTop: 64 }}>
      <div className="page-max" style={{ padding: 'clamp(52px,7vw,80px) clamp(20px,5vw,40px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <span style={{ width: 24, height: 1, background: C.gold, display: 'inline-block' }} />
          <span style={{ fontFamily: 'Arial,Helvetica,sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.gold }}>{eyebrow}</span>
        </div>
        <h1 style={{ fontFamily: "Georgia,'Times New Roman',serif", fontSize: 'clamp(28px,4vw,52px)', fontWeight: 400, color: C.bg, lineHeight: 1.1, letterSpacing: '-0.01em', marginBottom: subtitle ? 18 : 0, maxWidth: 720, textWrap: 'pretty' }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontFamily: 'Arial,Helvetica,sans-serif', fontSize: 'clamp(14px,1.6vw,17px)', color: 'rgba(250,249,246,0.60)', lineHeight: 1.7, maxWidth: 520 }}>
            {subtitle}
          </p>
        )}
      </div>
    </section>
  );
}
