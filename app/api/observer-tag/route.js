export async function POST(req) {
  try {
    const { email } = await req.json();
    if (!email) return Response.json({ error: 'Email required' }, { status: 400 });

    // Try to create — if exists, update to observer
    const res = await fetch('https://app.loops.so/api/v1/contacts/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.LOOPS_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        userGroup: 'observer',
        source: 'longcyclecapital.com',
        mailingLists: { cmpoqhxaf0tg90jy71ic860uw: true },
      }),
    });

    if (res.status === 409) {
      await fetch('https://app.loops.so/api/v1/contacts/update', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${process.env.LOOPS_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          userGroup: 'observer',
          mailingLists: { cmpoqhxaf0tg90jy71ic860uw: true },
        }),
      });
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error('Loops observer-tag error:', err);
    return Response.json({ error: 'Failed to tag observer' }, { status: 500 });
  }
}
