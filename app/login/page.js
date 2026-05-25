'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageHero from '@/components/PageHero';
import { useAuth } from '@/lib/AuthContext';

const C = {
  navy: '#1F4E78', gold: '#B8860B',
  bg: '#FAF9F6', text: '#2C3E50', muted: '#7F8C8D',
  border: 'rgba(44,62,80,0.10)',
};

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [attempted, setAttempted] = useState(false);

  const inputStyle = {
    fontFamily: 'Arial,Helvetica,sans-serif', fontSize: 14,
    padding: '11px 14px', width: '100%',
    background: '#fff', border: `1px solid rgba(44,62,80,0.18)`,
    borderRadius: 2, color: C.text, outline: 'none',
  };

  const labelStyle = {
    fontFamily: 'Arial', fontSize: 11, fontWeight: 700,
    letterSpacing: '0.06em', textTransform: 'uppercase',
    color: C.muted, display: 'block', marginBottom: 7,
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    login();
    router.push('/compass');
  };

  return (
    <div>
      <PageHero
        eyebrow="LP Dashboard"
        title="Observer access."
        subtitle="Full Cycle Compass dashboard, position updates, and the complete research archive."
      />

      <section className="section-pad" style={{ background: C.bg }}>
        <div style={{ maxWidth: 420, margin: '0 auto', padding: '0 clamp(20px,5vw,40px)' }}>
          {attempted ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <div style={{ fontFamily: "Georgia,serif", fontSize: 26, color: C.navy, marginBottom: 12 }}>Access is by invitation.</div>
              <p style={{ fontFamily: 'Arial', fontSize: 14, color: C.muted, lineHeight: 1.75 }}>
                We are not currently accepting new observers. If you believe you should have access, please reach out directly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={labelStyle}>Email</label>
                <input style={inputStyle} type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="you@institution.com" required />
              </div>
              <div>
                <label style={labelStyle}>Password</label>
                <input style={inputStyle} type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••••" required />
              </div>
              <button type="submit" style={{ fontFamily: 'Arial', fontSize: 12, letterSpacing: '0.07em', textTransform: 'uppercase', fontWeight: 700, padding: '13px 24px', background: C.navy, color: C.bg, border: 'none', borderRadius: 2, cursor: 'pointer' }}>
                Login
              </button>
              <div style={{ fontFamily: 'Arial', fontSize: 12, color: C.muted, lineHeight: 1.7, borderTop: `1px solid ${C.border}`, paddingTop: 20 }}>
                Access is by invitation only. Long Cycle Capital is not accepting new investors. This portal is for existing observers of the fund&apos;s public experiment.
              </div>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
