export async function POST(req) {
  try {
    const { email } = await req.json();
    if (!email) return Response.json({ error: 'Email required' }, { status: 400 });

    const allowedEmails = (process.env.OBSERVER_EMAILS || '')
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(Boolean);

    // Silently succeed if email not on list — don't reveal who is/isn't an observer
    if (allowedEmails.length > 0 && !allowedEmails.includes(email.toLowerCase())) {
      return Response.json({ success: true });
    }

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
