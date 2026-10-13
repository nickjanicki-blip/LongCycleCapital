import { GET as compassGET } from '@/app/api/compass/route';
import { getSession, isCronRequest } from '@/lib/dashboard/auth';
import { runEngine, statusMap } from '@/lib/dashboard/engine';
import { getInputs, getJournal, getLatest, saveSnapshot } from '@/lib/dashboard/store';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

async function emailAlert(snapshot) {
  const to = (process.env.DASHBOARD_OWNER_EMAILS || '').split(',').map(s => s.trim()).filter(Boolean);
  const b = snapshot.brief;
  const ready = b.watch.filter(w => w.status === 'READY');
  if (!to.length || !process.env.RESEND_API_KEY || (!b.changes.length && !ready.length)) return false;

  const li = arr => arr.map(x => `<li style="margin:4px 0">${x}</li>`).join('');
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;color:#2C3E50">
      <p style="font-family:Georgia,serif;font-size:20px;color:#1F4E78;margin:0 0 4px">${esc(b.headline)}</p>
      <p style="font-size:15px">${esc(b.recommendation)}</p>
      ${b.changes.length ? `<p style="font-size:12px;font-weight:bold;letter-spacing:.08em;color:#B8860B">CHANGES SINCE LAST RUN</p>
        <ul>${li(b.changes.map(c => `${esc(c.name)}: ${esc(c.from)} &rarr; <b>${esc(c.to)}</b>`))}</ul>` : ''}
      ${b.watch.length ? `<p style="font-size:12px;font-weight:bold;letter-spacing:.08em;color:#B8860B">ON WATCH</p>
        <ul>${li(b.watch.map(w => `<b>${esc(w.name)}</b> (${esc(w.status)}): ${esc(w.line)}`))}</ul>` : ''}
      <p><a href="https://www.longcyclecapital.com/dashboard" style="color:#1F4E78">Open the dashboard</a></p>
    </div>`;
  const subject = ready.length ? `LCC: ${ready.length} setup(s) READY` : `LCC: ${b.changes.length} signal change(s)`;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'Long Cycle Capital <hello@longcyclecapital.com>', to, subject, html }),
  });
  return r.ok;
}

export async function GET(req) {
  const session = isCronRequest(req) ? null : await getSession();
  if (!isCronRequest(req) && !session?.isOwner) return Response.json({ error: 'Not authorized' }, { status: 401 });

  const compass = await (await compassGET()).json();
  const [inputs, journal, prev] = await Promise.all([getInputs(), getJournal(), getLatest()]);
  const snapshot = await runEngine({ compass, inputs, journal, prev });

  const summary = { runAt: snapshot.runAt, statuses: statusMap(snapshot), gsr: snapshot.gsr?.ratio, btc: snapshot.btc?.price, vix: snapshot.vix, errors: snapshot.errors.length };
  await saveSnapshot(snapshot, summary);
  const emailed = await emailAlert(snapshot).catch(() => false);

  return Response.json({ ok: true, runAt: snapshot.runAt, changes: snapshot.brief.changes.length, emailed, errors: snapshot.errors });
}
