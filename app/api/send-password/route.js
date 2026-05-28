export async function POST(req) {
  try {
    const { email } = await req.json();
    if (!email) return Response.json({ error: 'Email required' }, { status: 400 });

    const loopsRes = await fetch('https://app.loops.so/api/v1/transactional', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.LOOPS_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transactionalId: 'cmpor99qa00aw0jw9agh4wgst',
        email,
        dataVariables: {
          observerPassword: process.env.OBSERVER_PASSWORD,
        },
      }),
    });

    const loopsBody = await loopsRes.json().catch(() => ({}));
    console.log('Loops response:', loopsRes.status, JSON.stringify(loopsBody));

    if (!loopsRes.ok) {
      return Response.json({ error: 'Loops error', status: loopsRes.status, detail: loopsBody }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error('Send password error:', err);
    return Response.json({ error: 'Failed to send' }, { status: 500 });
  }
}
