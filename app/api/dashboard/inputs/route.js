import { getSession } from '@/lib/dashboard/auth';
import { REGIMES } from '@/lib/dashboard/regime';
import { FX_PAIRS } from '@/lib/dashboard/fx';
import { getInputs, setInputs } from '@/lib/dashboard/store';

export const dynamic = 'force-dynamic';

const MANUAL_REC = ['bubbles', 'lei_fall', 'bank_fail'];

export async function POST(req) {
  const session = await getSession();
  if (!session?.isOwner) return Response.json({ error: 'Not authorized' }, { status: 401 });
  const body = await req.json();
  const cur = await getInputs();
  const next = { ...cur };

  if ('regimeOverride' in body) next.regimeOverride = REGIMES.includes(body.regimeOverride) ? body.regimeOverride : null;
  if ('equity' in body) next.equity = Math.max(0, Number(body.equity) || 0);
  if ('gsrMacroStory' in body) next.gsrMacroStory = String(body.gsrMacroStory || '').slice(0, 2000);
  if (body.fxGuidance && typeof body.fxGuidance === 'object') {
    next.fxGuidance = { ...(cur.fxGuidance || {}) };
    for (const { pair } of FX_PAIRS) if (pair in body.fxGuidance) next.fxGuidance[pair] = Boolean(body.fxGuidance[pair]);
  }
  if (body.recessionManual && typeof body.recessionManual === 'object') {
    next.recessionManual = { ...(cur.recessionManual || {}) };
    for (const k of MANUAL_REC) if (k in body.recessionManual) next.recessionManual[k] = Boolean(body.recessionManual[k]);
  }
  await setInputs(next);
  return Response.json({ inputs: next });
}
