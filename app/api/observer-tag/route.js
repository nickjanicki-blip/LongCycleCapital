const AUDIENCE_ID = '49fcf87b-1dbb-46ac-8b21-e2d97e9137de';

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
    console.error('Observer tag error:', err);
    return Response.json({ error: 'Failed to tag observer' }, { status: 500 });
  }
}
