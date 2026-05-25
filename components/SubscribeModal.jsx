'use client';
import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';

const C = { navy: '#1F4E78', gold: '#B8860B', bg: '#FAF9F6', muted: '#7F8C8D', text: '#2C3E50' };

export default function SubscribeModal({ onClose }) {
  const { subscribe } = useAuth();
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    if (email) {
      setDone(true);
      subscribe();
      setTimeout(onClose, 1400);
    }
  };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(31,78,120,0.22)', backdropFilter: 'blur(3px)' }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 401, background: C.bg, padding: 'clamp(32px,5vw,48px)', maxWidth: 400, width: '90vw', boxShadow: '0 8px 48px rgba(31,78,120,0.18)' }}>
        {done ? (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div style={{ fontFamily: "Georgia,serif", fontSize: 22, color: C.navy, marginBottom: 10 }}>You're an observer.</div>
            <div style={{ fontFamily: "Georgia,serif", fontSize: 16, fontStyle: 'italic', color: C.gold }}>Patience compounds.</div>
          </div>
        ) : (
          <>
            <div style={{ fontFamily: 'Arial', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.gold, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 20, height: 1, background: C.gold, display: 'inline-block' }} />
              Observer Access
            </div>
            <h2 style={{ fontFamily: "Georgia,serif", fontSize: 'clamp(22px,3vw,28px)', fontWeight: 400, color: C.navy, lineHeight: 1.2, marginBottom: 12, textWrap: 'pretty' }}>
              Subscribe to unlock regime briefings.
            </h2>
            <p style={{ fontFamily: 'Arial', fontSize: 13, color: C.muted, lineHeight: 1.75, marginBottom: 24 }}>
              Weekly regime briefings, market readings, and the full research archive. Free. No spam.
            </p>
            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                required placeholder="your@email.com"
                style={{ fontFamily: 'Arial', fontSize: 14, padding: '11px 14px', border: '1px solid rgba(44,62,80,0.20)', borderRadius: 2, color: C.text, outline: 'none', width: '100%' }}
              />
              <button type="submit" style={{ fontFamily: 'Arial', fontSize: 11, letterSpacing: '0.07em', textTransform: 'uppercase', fontWeight: 700, padding: '12px', background: C.navy, color: C.bg, border: 'none', borderRadius: 2, cursor: 'pointer' }}>
                Become an Observer
              </button>
            </form>
            <button onClick={onClose} style={{ marginTop: 14, fontFamily: 'Arial', fontSize: 11, color: C.muted, background: 'none', border: 'none', cursor: 'pointer', display: 'block', width: '100%', textAlign: 'center' }}>
              Cancel
            </button>
          </>
        )}
      </div>
    </>
  );
}
