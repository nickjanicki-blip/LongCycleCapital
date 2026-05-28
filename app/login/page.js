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
  const [email, setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        setError('This email does not have Observer access.');
        setLoading(false);
        return;
      }
      login(email);
      router.push('/compass');
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
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
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={labelStyle}>Email</label>
              <input
                style={inputStyle}
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@institution.com"
                required
                autoFocus
              />
            </div>
            {error && (
              <p style={{ fontFamily: 'Arial', fontSize: 12, color: '#C0392B', margin: 0 }}>{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              style={{ fontFamily: 'Arial', fontSize: 12, letterSpacing: '0.07em', textTransform: 'uppercase', fontWeight: 700, padding: '13px 24px', background: C.navy, color: C.bg, border: 'none', borderRadius: 2, cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Checking...' : 'Access Dashboard'}
            </button>
            <div style={{ fontFamily: 'Arial', fontSize: 12, color: C.muted, lineHeight: 1.7, borderTop: `1px solid ${C.border}`, paddingTop: 20 }}>
              Access is by invitation only. Enter your email to continue.
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
