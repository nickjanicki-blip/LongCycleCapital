import crypto from 'node:crypto';
import { cookies } from 'next/headers';

export const SESSION_COOKIE = 'lcc_session';
export const SESSION_MAX_AGE = 30 * 24 * 3600;

const secret = () => {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error('SESSION_SECRET not configured');
  return s;
};
const sign = payload => crypto.createHmac('sha256', secret()).update(payload).digest('base64url');

export function makeSessionValue(email) {
  const payload = Buffer.from(JSON.stringify({ e: email.toLowerCase(), exp: Date.now() + SESSION_MAX_AGE * 1000 })).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

export function sessionCookieOptions() {
  return { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: SESSION_MAX_AGE };
}

function verify(value) {
  if (!value || !value.includes('.')) return null;
  const [payload, sig] = value.split('.');
  const expected = sign(payload);
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const { e, exp } = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return exp > Date.now() ? e : null;
  } catch { return null; }
}

const owners = () => (process.env.DASHBOARD_OWNER_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);

// { email, isOwner } for a valid observer session, else null.
export async function getSession() {
  const email = verify((await cookies()).get(SESSION_COOKIE)?.value);
  return email ? { email, isOwner: owners().includes(email) } : null;
}

export function isCronRequest(req) {
  const s = process.env.CRON_SECRET;
  return Boolean(s) && req.headers.get('authorization') === `Bearer ${s}`;
}
