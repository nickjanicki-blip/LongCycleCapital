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
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep]         = useState('email'); // 'email' | 'password' | 'sent' | 'denied'
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

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

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    // Send password email — API silently ignores non-approved emails
    await fetch('/api/send-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    }).catch(() => {});
    setLoading(false);
    setStep('password');
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        setError('Incorrect password. Please try again.');
        setLoading(false);
        return;
      }
      login();
      fetch('/api/observer-tag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      }).catch(() => {});
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

          {step === 'email' && (
            <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={labelStyle}>Email</label>
                <input style={inputStyle} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@institution.com" required autoFocus />
              </div>
              <button type="submit" disabled={loading} style={{ fontFamily: 'Arial', fontSize: 12, letterSpacing: '0.07em', textTransform: 'uppercase', fontWeight: 700, padding: '13px 24px', background: C.navy, color: C.bg, border: 'none', borderRadius: 2, cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Sending...' : 'Send Password'}
              </button>
              <div style={{ fontFamily: 'Arial', fontSize: 12, color: C.muted, lineHeight: 1.7, borderTop: `1px solid ${C.border}`, paddingTop: 20 }}>
                Access is by invitation only. Enter your email and we will send your password if you are on file.
              </div>
            </form>
          )}

          {step === 'password' && (
            <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ fontFamily: "Georgia,serif", fontSize: 17, color: C.navy, lineHeight: 1.5 }}>
                If <span style={{ color: C.gold }}>{email}</span> is on file, your password is on its way.
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <label style={labelStyle}>Password</label>
                  <button type="button" onClick={() => setStep('email')} style={{ fontFamily: 'Arial', fontSize: 11, color: C.muted, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Wrong email?</button>
                </div>
                <input style={inputStyle} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••••" required autoFocus />
              </div>
              {error && (
                <p style={{ fontFamily: 'Arial', fontSize: 12, color: '#C0392B', margin: 0 }}>{error}</p>
              )}
              <button type="submit" disabled={loading} style={{ fontFamily: 'Arial', fontSize: 12, letterSpacing: '0.07em', textTransform: 'uppercase', fontWeight: 700, padding: '13px 24px', background: C.navy, color: C.bg, border: 'none', borderRadius: 2, cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Verifying...' : 'Login'}
              </button>
            </form>
          )}

        </div>
      </section>
    </div>
  );
}
