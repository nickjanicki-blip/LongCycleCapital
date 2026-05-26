'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const C = {
  navy: '#1F4E78', gold: '#B8860B', goldBright: '#F0C040',
  bg: '#FAF9F6', muted: '#7F8C8D', border: 'rgba(44,62,80,0.12)',
};

function LCCLogo({ light }) {
  return (
    <svg width="56" height="28" viewBox="0 0 64 30" fill="none">
      <path d="M 4 24 C 12 8 22 6 32 16 C 42 26 52 25 60 16"
        stroke={light ? C.bg : C.navy} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M 4 18 C 9 11 15 10 21 16 C 27 22 33 21 39 14 C 45 7 51 7 57 13"
        stroke={light ? C.goldBright : C.gold} strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}

const navLinks = [
  { href: '/',         label: 'Home' },
  { href: '/compass',  label: 'Cycle Compass' },
  { href: '/strategy', label: 'Strategy' },
  { href: '/research', label: 'Research' },
  { href: '/about',    label: 'About' },
  { href: '/login',    label: 'LP Login' },
];

export default function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const isHeroPage = pathname === '/';
  const isDark = isHeroPage && !scrolled && !menuOpen;
  const logoColor = (isDark || menuOpen) ? C.bg : C.navy;
  const barColor = menuOpen ? C.bg : (isDark ? C.bg : C.navy);
  const headerBg = menuOpen ? C.navy : isDark ? 'transparent' : C.bg;

  return (
    <>
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
        background: headerBg,
        borderBottom: (isDark || menuOpen) ? 'none' : `1px solid ${C.border}`,
        boxShadow: scrolled && !menuOpen ? '0 1px 6px rgba(0,0,0,0.08)' : 'none',
        transition: 'background 280ms ease, box-shadow 280ms ease',
      }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto',
          padding: '0 clamp(20px,5vw,40px)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          height: 64,
        }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
            <LCCLogo light={isDark || menuOpen} />
            <div>
              <div style={{ fontFamily: "Georgia,'Times New Roman',serif", fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: logoColor, lineHeight: 1.25 }}>Long Cycle</div>
              <div style={{ fontFamily: "Georgia,'Times New Roman',serif", fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: logoColor, lineHeight: 1.25 }}>Capital</div>
              <div style={{ height: 1, background: isDark || menuOpen ? C.goldBright : C.gold, marginTop: 3 }} />
            </div>
          </Link>

          <nav className="desktop-nav" style={{ alignItems: 'center', gap: 2 }}>
            {navLinks.map(({ href, label }) => {
              const active = pathname === href;
              return (
                <Link key={href} href={href} style={{
                  fontFamily: 'Arial,Helvetica,sans-serif',
                  fontSize: 11, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 700,
                  padding: '6px 11px',
                  borderBottom: active ? `2px solid ${C.gold}` : '2px solid transparent',
                  color: active
                    ? (isDark ? '#fff' : C.navy)
                    : (isDark ? 'rgba(250,249,246,0.65)' : C.muted),
                  transition: 'color 160ms, border-color 160ms',
                  textDecoration: 'none',
                }}>
                  {label}
                </Link>
              );
            })}
          </nav>

          <button
            className="mob-toggle"
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Toggle menu"
            style={{ flexDirection: 'column', gap: 5, padding: 10, background: 'none', border: 'none' }}
          >
            <span style={{ display: 'block', width: 22, height: 1.5, background: barColor, transition: 'transform 220ms, opacity 220ms', transform: menuOpen ? 'translateY(6.5px) rotate(45deg)' : 'none' }} />
            <span style={{ display: 'block', width: 22, height: 1.5, background: barColor, opacity: menuOpen ? 0 : 1, transition: 'opacity 200ms' }} />
            <span style={{ display: 'block', width: 22, height: 1.5, background: barColor, transition: 'transform 220ms', transform: menuOpen ? 'translateY(-6.5px) rotate(-45deg)' : 'none' }} />
          </button>
        </div>
      </header>

      <div style={{
        position: 'fixed', top: 64, left: 0, right: 0, bottom: 0,
        zIndex: 199, background: C.navy,
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-start',
        padding: 'clamp(32px,8vw,64px)',
        opacity: menuOpen ? 1 : 0,
        pointerEvents: menuOpen ? 'all' : 'none',
        transition: 'opacity 240ms ease',
      }}>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {navLinks.map(({ href, label }) => (
            <Link key={href} href={href} style={{
              fontFamily: "Georgia,'Times New Roman',serif",
              fontSize: 'clamp(28px,8vw,42px)', fontWeight: 400, letterSpacing: '-0.01em',
              color: pathname === href ? C.goldBright : C.bg,
              textAlign: 'left',
              borderBottom: '1px solid rgba(250,249,246,0.08)',
              padding: '16px 0', textDecoration: 'none', display: 'block',
            }}>
              {label}
            </Link>
          ))}
        </nav>
        <div style={{ marginTop: 'auto', paddingTop: 40, fontFamily: "Georgia,serif", fontSize: 15, fontStyle: 'italic', color: C.goldBright, opacity: 0.75 }}>
          Patience compounds.
        </div>
      </div>
    </>
  );
}
