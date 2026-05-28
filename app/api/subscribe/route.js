const AUDIENCE_ID = '50e36a46-5b0e-4662-99c5-22aff770bbba'; // LCC Subscribers

export async function POST(req) {
  try {
    const { email } = await req.json();
    if (!email) return Response.json({ error: 'Email required' }, { status: 400 });

    await fetch(`https://api.resend.com/audiences/${AUDIENCE_ID}/contacts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        unsubscribed: false,
      }),
    }).catch(() => {});

    return Response.json({ success: true });
  } catch (err) {
    console.error('Subscribe error:', err);
    return Response.json({ error: 'Failed to subscribe' }, { status: 500 });
  }
}
