export async function POST(req) {
  try {
    const { email } = await req.json();
    if (!email) return Response.json({ error: 'Email required' }, { status: 400 });

    const res = await fetch('https://app.loops.so/api/v1/contacts/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.LOOPS_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        userGroup: 'subscriber',
        source: 'longcyclecapital.com',
        mailingLists: { cmpoqhxaf0tg90jy71ic860uw: true },
      }),
    });

    // If contact already exists, update them instead
    if (res.status === 409) {
      await fetch('https://app.loops.so/api/v1/contacts/update', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${process.env.LOOPS_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          mailingLists: { cmpoqhxaf0tg90jy71ic860uw: true },
        }),
      });
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error('Loops subscribe error:', err);
    return Response.json({ error: 'Failed to subscribe' }, { status: 500 });
  }
}
