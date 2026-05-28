export async function POST(req) {
  try {
    const { email } = await req.json();
    if (!email) return Response.json({ error: 'Email required' }, { status: 400 });

    await fetch('https://app.loops.so/api/v1/transactional', {
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

    return Response.json({ success: true });
  } catch (err) {
    console.error('Send password error:', err);
    return Response.json({ error: 'Failed to send' }, { status: 500 });
  }
}
