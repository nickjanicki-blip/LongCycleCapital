import crypto from 'node:crypto';
import { getSession } from '@/lib/dashboard/auth';
import { getJournal, setJournal } from '@/lib/dashboard/store';

export const dynamic = 'force-dynamic';

const FIELDS = ['date', 'strategy', 'pair', 'direction', 'entry', 'stop', 'target', 'exit', 'riskPct', 'status', 'notes'];

async function owner() {
  const s = await getSession();
  return s?.isOwner ? s : null;
}

export async function GET() {
  if (!(await owner())) return Response.json({ error: 'Not authorized' }, { status: 401 });
  return Response.json({ trades: await getJournal() });
}

export async function POST(req) {
  if (!(await owner())) return Response.json({ error: 'Not authorized' }, { status: 401 });
  const body = await req.json();
  const trade = Object.fromEntries(FIELDS.map(f => [f, String(body[f] ?? '').slice(0, f === 'notes' ? 2000 : 100)]));
  const trades = await getJournal();
  const i = body.id ? trades.findIndex(t => t.id === body.id) : -1;
  if (i >= 0) trades[i] = { ...trades[i], ...trade };
  else trades.unshift({ id: crypto.randomUUID(), ...trade });
  await setJournal(trades);
  return Response.json({ trades });
}

export async function DELETE(req) {
  if (!(await owner())) return Response.json({ error: 'Not authorized' }, { status: 401 });
  const id = new URL(req.url).searchParams.get('id');
  const trades = (await getJournal()).filter(t => t.id !== id);
  await setJournal(trades);
  return Response.json({ trades });
}
