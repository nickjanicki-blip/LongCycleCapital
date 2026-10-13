import { getSession } from '@/lib/dashboard/auth';
import { getHistory, getInputs, getLatest } from '@/lib/dashboard/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ error: 'Not authorized' }, { status: 401 });
  const [snapshot, history, inputs] = await Promise.all([getLatest(), getHistory(30), session.isOwner ? getInputs() : null]);
  return Response.json({ snapshot, history, inputs, isOwner: session.isOwner });
}
